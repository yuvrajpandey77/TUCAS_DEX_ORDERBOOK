import { 
  Token, 
  Percent
} from '@uniswap/sdk-core';
import { 
  FeeAmount,
  computePoolAddress
} from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { 
  UNISWAP_V3_CONFIG, 
  TOKENS, 
  TRADING_PAIRS, 
  GAS_SETTINGS,
  type TradingPair 
} from '@/config/uniswap-v3';

// Types for the service
export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  minimumReceived: string;
  gasEstimate: string;
  route: string[];
  fee: number;
  isFallback?: boolean; // Indicates if this is a fallback quote (not real market data)
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: number;
  deadline?: number;
  recipient?: string;
}

export interface PoolInfo {
  address: string;
  token0: Token;
  token1: Token;
  fee: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
}

export interface TokenBalance {
  token: string;
  balance: string;
  decimals: number;
  symbol: string;
}

export class UniswapV3Service {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
  }

  /**
   * Discover the best available pool (by liquidity) across common fee tiers
   * Returns the selected fee and pool address
   */
  private async discoverBestPool(
    tokenA: Token,
    tokenB: Token
  ): Promise<{ fee: FeeAmount; address: string } | null> {
    const feeTiers: FeeAmount[] = [100, 500, 3000, 10000] as FeeAmount[];

    let best: { fee: FeeAmount; address: string; liquidity: bigint } | null = null;

    for (const fee of feeTiers) {
      try {
        const exists = await this.poolExists(tokenA, tokenB, fee);
        if (!exists) continue;

        const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
        const poolContract = new ethers.Contract(
          poolAddress,
          ['function liquidity() external view returns (uint128)'],
          this.provider
        );
        const liquidity: bigint = await poolContract.liquidity();
        if (!best || liquidity > best.liquidity) {
          best = { fee, address: poolAddress, liquidity };
        }
      } catch {
        // ignore this tier if it errors
        continue;
      }
    }

    if (!best) return null;
    return { fee: best.fee, address: best.address };
  }

  /**
   * Try building a best single-hop or two-hop route via WETH or USDC
   * Returns the path of token addresses and corresponding fee tiers
   */
  private async discoverBestRoute(
    tokenIn: Token,
    tokenOut: Token
  ): Promise<{ path: string[]; fees: FeeAmount[] } | null> {
    // 1) Try direct pool
    const direct = await this.discoverBestPool(tokenIn, tokenOut);
    if (direct) {
      return { path: [tokenIn.address, tokenOut.address], fees: [direct.fee] };
    }

    // 2) Try via WETH
    const viaWethA = await this.discoverBestPool(tokenIn, TOKENS.WETH);
    const viaWethB = await this.discoverBestPool(TOKENS.WETH, tokenOut);
    if (viaWethA && viaWethB) {
      return {
        path: [tokenIn.address, TOKENS.WETH.address, tokenOut.address],
        fees: [viaWethA.fee, viaWethB.fee]
      };
    }

    // 3) Try via USDC
    const viaUsdcA = await this.discoverBestPool(tokenIn, TOKENS.USDC);
    const viaUsdcB = await this.discoverBestPool(TOKENS.USDC, tokenOut);
    if (viaUsdcA && viaUsdcB) {
      return {
        path: [tokenIn.address, TOKENS.USDC.address, tokenOut.address],
        fees: [viaUsdcA.fee, viaUsdcB.fee]
      };
    }

    return null;
  }

  /**
   * Compute price impact by comparing execution price to mid-price from pools
   * Returns percentage as string (e.g., "0.23")
   */
  private async computePriceImpact(
    tokenIn: Token,
    tokenOut: Token,
    route: { path: string[]; fees: FeeAmount[] },
    amountInWei: bigint,
    amountOutWei: bigint
  ): Promise<string> {
    try {
      const SCALE = 10n ** 18n;
      const Q192 = 2n ** 192n;

      // Helper to get Token object by address (limited to known TOKENS)
      const getToken = (address: string): Token | null => {
        const entry = Object.values(TOKENS).find(t => t.address.toLowerCase() === address.toLowerCase());
        return entry || null;
      };

      // Build hop mid-price (scaled by SCALE)
      const getHopScaled = async (aAddr: string, bAddr: string, fee: number): Promise<bigint> => {
        const a = getToken(aAddr);
        const b = getToken(bAddr);
        if (!a || !b) return SCALE; // neutral if unknown
        const poolAddress = await this.getPoolAddress(a, b, fee as FeeAmount);
        const poolContract = new ethers.Contract(
          poolAddress,
          ['function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'],
          this.provider
        );
        const slot0 = await poolContract.slot0();
        const sqrtX96: bigint = BigInt(slot0.sqrtPriceX96.toString());
        const priceX192 = sqrtX96 * sqrtX96; // token1 per token0 in base units

        // Determine token0/token1 sorting
        const [token0, _token1] = a.sortsBefore(b) ? [a, b] : [b, a];
        const aIsToken0 = a.address.toLowerCase() === token0.address.toLowerCase();

        // hop price in base units: token1 per token0
        const hopBaseScaled = (priceX192 * SCALE) / Q192;

        // If a is token1, we need inverse
        if (aIsToken0) {
          return hopBaseScaled; // a->b aligns with token0->token1
        } else {
          // inverse: SCALE^2 / hopBaseScaled, but to keep precision: (SCALE * Q192) / priceX192
          return (SCALE * Q192) / priceX192;
        }
      };

      // Compute route mid in base units (scaled by SCALE)
      let midScaled = SCALE;
      for (let i = 0; i < route.path.length - 1; i++) {
        const hop = await getHopScaled(route.path[i], route.path[i + 1], route.fees[i]);
        midScaled = (midScaled * hop) / SCALE;
      }

      // Adjust for decimals difference to human units
      const dIn = tokenIn.decimals;
      const dOut = tokenOut.decimals;
      const pow10 = (p: number): bigint => {
        let r = 1n;
        for (let i = 0; i < p; i++) r *= 10n;
        return r;
      };
      const decimalAdjust = dIn >= dOut ? pow10(dIn - dOut) : 1n / 1n; // handle separately below to avoid fractions

      let midScaledHuman: bigint;
      if (dIn >= dOut) {
        midScaledHuman = midScaled * decimalAdjust;
      } else {
        const invAdjust = pow10(dOut - dIn);
        midScaledHuman = midScaled / invAdjust;
      }

      // Execution price in human units: (amountOut/amountIn) * 10^(dIn-dOut)
      let execScaledHuman: bigint;
      if (dIn >= dOut) {
        execScaledHuman = (amountOutWei * SCALE * decimalAdjust) / amountInWei;
      } else {
        const invAdjust = pow10(dOut - dIn);
        execScaledHuman = (amountOutWei * SCALE) / (amountInWei / invAdjust);
      }

      if (midScaledHuman === 0n) return '0';
      // priceImpact = |1 - exec/mid| * 100
      const ratioScaled = (execScaledHuman * SCALE) / midScaledHuman; // scaled by SCALE
      const diff = ratioScaled > SCALE ? ratioScaled - SCALE : SCALE - ratioScaled;
      const impactScaled = (diff * 10000n) / SCALE; // basis points
      const integer = impactScaled / 100n;
      const decimals = impactScaled % 100n;
      return `${integer}.${decimals.toString().padStart(2, '0')}`;
    } catch {
      return '0.0';
    }
  }

  /**
   * Try alternative RPC endpoints if current one fails
   */
  private async tryAlternativeRpc(): Promise<ethers.Provider> {
    const rpcUrls = UNISWAP_V3_CONFIG.RPC_URLS || [UNISWAP_V3_CONFIG.RPC_URL];
    
    for (let i = 0; i < rpcUrls.length; i++) {
      try {
        const newProvider = new ethers.JsonRpcProvider(rpcUrls[i]);
        // Test the connection
        await newProvider.getNetwork();
        console.log(`Switched to RPC: ${rpcUrls[i]}`);
        return newProvider;
      } catch (error) {
        console.warn(`RPC ${rpcUrls[i]} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All RPC endpoints failed');
  }

  /**
   * Execute a function with RPC fallback
   */
  private async executeWithFallback<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Do not fallback for local validation errors
      const isLocalValidationError = error instanceof Error && (
        error.message.includes('No signer available') ||
        error.message.includes('Token not found') ||
        error.message.includes('Invalid') ||
        error.message.includes('Pool not found')
      );
      if (isLocalValidationError) {
        throw error;
      }
      console.warn('RPC call failed, trying alternative endpoint...', error);
      
      try {
        // Try alternative RPC
        this.provider = await this.tryAlternativeRpc();
        
        // Retry the original function
        return await fn();
      } catch (fallbackError) {
        console.error('All RPC endpoints failed:', fallbackError);
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
    }
  }

  /**
   * Set the signer for transaction execution
   */
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  /**
   * Get pool address for a trading pair
   */
  async getPoolAddress(tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<string> {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
    
    return computePoolAddress({
      factoryAddress: UNISWAP_V3_CONFIG.FACTORY_ADDRESS,
      tokenA: token0,
      tokenB: token1,
      fee,
    });
  }

  /**
   * Check if pool exists by querying the factory
   */
  async poolExists(tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<boolean> {
    return this.executeWithFallback(async () => {
      const factoryContract = new ethers.Contract(
        UNISWAP_V3_CONFIG.FACTORY_ADDRESS,
        ['function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'],
        this.provider
      );

      const poolAddress = await factoryContract.getPool(tokenA.address, tokenB.address, fee);
      return poolAddress !== ethers.ZeroAddress;
    });
  }

  /**
   * Get pool information
   */
  async getPoolInfo(pair: TradingPair): Promise<PoolInfo | null> {
    return this.executeWithFallback(async () => {
      const { token0, token1, fee } = TRADING_PAIRS[pair];
      
      // Check if pool exists first
      const exists = await this.poolExists(token0, token1, fee as FeeAmount);
      if (!exists) {
        console.warn(`Pool ${pair} does not exist`);
        return null;
      }

      const poolAddress = await this.getPoolAddress(token0, token1, fee as FeeAmount);
      
      // Get pool contract
      const poolContract = new ethers.Contract(
        poolAddress,
        [
          'function liquidity() external view returns (uint128)',
          'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
        ],
        this.provider
      );

      const [liquidity, slot0] = await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0()
      ]);

      return {
        address: poolAddress,
        token0,
        token1,
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick,
      };
    }).catch(error => {
      console.error('Error getting pool info:', error);
      return null;
    });
  }

  /**
   * Get token balance for a user
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<TokenBalance | null> {
    return this.executeWithFallback(async () => {
      const token = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
      if (!token) {
        throw new Error('Token not found');
      }

      // Handle native ETH differently
      if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        const balance = await this.provider.getBalance(userAddress);
        return {
          token: tokenAddress,
          balance: balance.toString(),
          decimals: 18, // ETH has 18 decimals
          symbol: 'ETH',
        };
      }

      // For ERC20 tokens
      const contract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) external view returns (uint256)', 'function decimals() external view returns (uint8)', 'function symbol() external view returns (string)'],
        this.provider
      );

      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
        contract.symbol()
      ]);

      return {
        token: tokenAddress,
        balance: balance.toString(),
        decimals,
        symbol,
      };
    }).catch(error => {
      console.error('Error getting token balance:', error);
      return null;
    });
  }

  /**
   * Get quote for a swap using Uniswap V3 Quoter contract
   */
  async getSwapQuote(params: SwapParams): Promise<SwapQuote | null> {
    return this.executeWithFallback(async () => {
      const { tokenIn, tokenOut, amountIn, slippageTolerance = GAS_SETTINGS.DEFAULT_SLIPPAGE_TOLERANCE } = params;
      
      console.log('🚀 getSwapQuote called with:', {
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance
      });
      
      // Find tokens
      const tokenInObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenIn.toLowerCase());
      const tokenOutObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenOut.toLowerCase());
      
      if (!tokenInObj || !tokenOutObj) {
        throw new Error('Token not found');
      }

      // For ETH, we need to use WETH in Uniswap V3
      const isEthToUsdc = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000' && 
                          tokenOut.toLowerCase() === UNISWAP_V3_CONFIG.USDC_ADDRESS.toLowerCase();
      
      if (isEthToUsdc) {
        // Use WETH for the quote since Uniswap V3 uses WETH
        const wethToken = TOKENS.WETH;
        const usdcToken = TOKENS.USDC;
        
        // Check if WETH/USDC pool exists
        const poolExists = await this.poolExists(wethToken, usdcToken, UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER);
        if (!poolExists) {
          console.error(`❌ Pool WETH/USDC does not exist on Ethereum mainnet`);
          throw new Error('Pool not found. Please check your network connection.');
        }
        
        // Discover best fee tier for WETH/USDC
        const bestPool = await this.discoverBestPool(TOKENS.WETH, TOKENS.USDC);
        if (!bestPool) {
          throw new Error('No WETH/USDC pool found');
        }

        // Get quote using WETH instead of ETH
        const amountInWei = ethers.parseUnits(amountIn, 18);
        
        const quoterContract = new ethers.Contract(
          UNISWAP_V3_CONFIG.QUOTER_ADDRESS,
          ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)'],
          this.provider
        );

        let amountOut;
        try {
          console.log('🔍 Getting quote from Uniswap V3:', {
            tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS,
            tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
            fee: UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER,
            amountIn: amountIn,
            amountInWei: amountInWei.toString()
          });
          
          amountOut = await quoterContract.quoteExactInputSingle.staticCall(
            UNISWAP_V3_CONFIG.WETH_ADDRESS, // Use WETH address
            UNISWAP_V3_CONFIG.USDC_ADDRESS, // USDC address
            bestPool.fee, // discovered fee
            amountInWei,
            0 // sqrtPriceLimitX96 = 0 means no price limit
          );
          
          console.log('🔍 Uniswap V3 quote result:', {
            amountOut: amountOut.toString(),
            amountOutFormatted: ethers.formatUnits(amountOut, 6)
          });
          
          if (!amountOut || amountOut === '0x' || amountOut === '0') {
            console.error('❌ Quoter returned empty result - no liquidity available');
            throw new Error('No liquidity available for this trade. Please try a different amount.');
          }
        } catch (quoteError) {
          console.error('❌ Quote call failed:', quoteError);
          throw new Error('Failed to get quote from Uniswap V3. Please check your connection and try again.');
        }

        // Calculate minimum received with slippage
        const slippageTolerancePercent = new Percent(slippageTolerance, 10000);
        const amountOutWei = BigInt(amountOut);
        const minimumReceived = amountOutWei - (amountOutWei * BigInt(slippageTolerancePercent.numerator.toString())) / BigInt(slippageTolerancePercent.denominator.toString());

        // Format amounts
        const amountOutFormatted = ethers.formatUnits(amountOut, 6); // USDC has 6 decimals
        const minimumReceivedFormatted = ethers.formatUnits(minimumReceived, 6);

        // Estimate gas
        const gasEstimate = await this.estimateSwapGas(tokenIn, tokenOut, amountIn, bestPool.fee);

        return {
          inputAmount: amountIn,
          outputAmount: amountOutFormatted,
          priceImpact: '0.1', // Simplified - would need more complex calculation
          minimumReceived: minimumReceivedFormatted,
          gasEstimate: gasEstimate.toString(),
          route: ['ETH', 'USDC'], // Show ETH in route for user clarity
          fee: bestPool.fee,
        };
      }
      
      // For other token pairs, try direct or 2-hop route
      const route = await this.discoverBestRoute(tokenInObj, tokenOutObj);
      if (!route) {
        console.error(`❌ No route found for ${tokenInObj.symbol}/${tokenOutObj.symbol}`);
        throw new Error('No route found. Please try different tokens or amount.');
      }

      // Convert amount to proper decimals
      const amountInWei = ethers.parseUnits(amountIn, tokenInObj.decimals);

      // Use Quoter contract to get exact quote
      const quoterContract = new ethers.Contract(
        UNISWAP_V3_CONFIG.QUOTER_ADDRESS,
        ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)'],
        this.provider
      );

      let amountOut;
      try {
        if (route.path.length === 2) {
          // Single hop
          amountOut = await quoterContract.quoteExactInputSingle.staticCall(
            route.path[0],
            route.path[1],
            route.fees[0],
            amountInWei,
            0
          );
        } else {
          // Two hops: encode path for quoteExactInput
          // Path encoding: tokenIn (20) + fee (3) + tokenMid (20) + fee (3) + tokenOut (20)
          const encodePath = (addresses: string[], fees: number[]) => {
            const FEE_SIZE = 3; // bytes
            let hex = '0x';
            for (let i = 0; i < addresses.length; i++) {
              hex += addresses[i].slice(2);
              if (i < fees.length) {
                hex += fees[i].toString(16).padStart(FEE_SIZE * 2, '0');
              }
            }
            return hex;
          };

          const exactPath = encodePath(route.path, route.fees);
          const quoterV2 = new ethers.Contract(
            UNISWAP_V3_CONFIG.QUOTER_ADDRESS,
            ['function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)'],
            this.provider
          );
          amountOut = await quoterV2.quoteExactInput.staticCall(exactPath, amountInWei);
        }
        
        // Check if result is empty (0x)
        if (!amountOut || amountOut === '0x' || amountOut === '0') {
          console.error('❌ Quoter returned empty result - no liquidity available');
          throw new Error('No liquidity available for this trade. Please try a different amount.');
        }
      } catch (quoteError) {
        console.error('❌ Quote call failed:', quoteError);
        throw new Error('Failed to get quote from Uniswap V3. Please check your connection and try again.');
      }

      // Calculate minimum received with slippage
      const slippageTolerancePercent = new Percent(slippageTolerance, 10000);
      const amountOutWei = BigInt(amountOut);
      const minimumReceived = amountOutWei - (amountOutWei * BigInt(slippageTolerancePercent.numerator.toString())) / BigInt(slippageTolerancePercent.denominator.toString());

      // Compute price impact from route mid-price
      const priceImpact = await this.computePriceImpact(tokenInObj, tokenOutObj, route, amountInWei, amountOutWei);

      // Format amounts
      const amountOutFormatted = ethers.formatUnits(amountOut, tokenOutObj.decimals);
      const minimumReceivedFormatted = ethers.formatUnits(minimumReceived, tokenOutObj.decimals);

      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(tokenIn, tokenOut, amountIn, route.fees[0]);

      return {
        inputAmount: amountIn,
        outputAmount: amountOutFormatted,
        priceImpact,
        minimumReceived: minimumReceivedFormatted,
        gasEstimate: gasEstimate.toString(),
        route: route.path.map((addr) => {
          if (addr.toLowerCase() === UNISWAP_V3_CONFIG.WETH_ADDRESS.toLowerCase()) return 'WETH';
          if (addr.toLowerCase() === UNISWAP_V3_CONFIG.USDC_ADDRESS.toLowerCase()) return 'USDC';
          if (addr.toLowerCase() === '0x0000000000000000000000000000000000000000') return 'ETH';
          if (addr.toLowerCase() === tokenIn.toLowerCase()) return tokenInObj.symbol || 'UNKNOWN';
          if (addr.toLowerCase() === tokenOut.toLowerCase()) return tokenOutObj.symbol || 'UNKNOWN';
          return 'TOKEN';
        }),
        fee: route.fees[0],
      };
    }).catch(error => {
      console.error('Error getting swap quote:', error);
      return null;
    });
  }

  /**
   * Get fallback quote when pool doesn't exist or quoter fails
   * This should only be used as a last resort and clearly marked as fallback
   */
  // Removed fallback quote method to avoid unused warnings; mainnet should always use real quotes.

  /**
   * Estimate gas for a swap
   */
  private async estimateSwapGas(tokenIn: string, tokenOut: string, amountIn: string, fee: number): Promise<bigint> {
    try {
      if (!this.signer) {
        return BigInt(300000); // Default gas limit for swaps
      }

      // Find tokens
      const tokenInObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenIn.toLowerCase());
      if (!tokenInObj) {
        return BigInt(300000);
      }

      // Convert amount to proper decimals
      const amountInWei = ethers.parseUnits(amountIn, tokenInObj.decimals);

      // For ETH → USDC swaps, use WETH
      const isEthToUsdc = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000' && 
                          tokenOut.toLowerCase() === UNISWAP_V3_CONFIG.USDC_ADDRESS.toLowerCase();

      if (isEthToUsdc) {
        // Use WETH for gas estimation
        const routerContract = new ethers.Contract(
          UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'],
          this.signer
        );

        const swapParams = {
          tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS, // Use WETH
          tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
          fee,
          recipient: await this.signer.getAddress(),
          deadline: Math.floor(Date.now() / 1000) + 1800,
          amountIn: amountInWei,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0
        };

        try {
          const gasEstimate = await routerContract.exactInputSingle.estimateGas(swapParams, {
            value: amountInWei // Include ETH value
          });
          return gasEstimate;
        } catch (gasError) {
          console.warn('Gas estimation failed, using default:', gasError);
          return BigInt(300000);
        }
      } else {
        // For other token swaps
        const routerContract = new ethers.Contract(
          UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'],
          this.signer
        );

        const swapParams = {
          tokenIn,
          tokenOut,
          fee,
          recipient: await this.signer.getAddress(),
          deadline: Math.floor(Date.now() / 1000) + 1800,
          amountIn: amountInWei,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0
        };

        try {
          const gasEstimate = await routerContract.exactInputSingle.estimateGas(swapParams);
          return gasEstimate;
        } catch (gasError) {
          console.warn('Gas estimation failed, using default:', gasError);
          return BigInt(300000);
        }
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      return BigInt(300000); // Default gas limit
    }
  }

  /**
   * Execute a swap using Uniswap V3 SwapRouter
   */
  async executeSwap(params: SwapParams): Promise<ethers.TransactionResponse | null> {
    return this.executeWithFallback(async () => {
      if (!this.signer) {
        throw new Error('No signer available');
      }

      const { tokenIn, tokenOut, amountIn, deadline } = params;
      
      // Safety: validate critical addresses and avoid burn/zero
      const ZERO = '0x0000000000000000000000000000000000000000';
      if (!ethers.isAddress(UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS)) {
        throw new Error('Invalid SwapRouter address');
      }
      if (!ethers.isAddress(tokenOut) || tokenOut.toLowerCase() === ZERO) {
        throw new Error('Invalid output token address');
      }
      
      // Get quote first
      const quote = await this.getSwapQuote(params);
      if (!quote) {
        throw new Error('Failed to get quote');
      }

      // Find tokens
      const tokenInObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenIn.toLowerCase());
      const tokenOutObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenOut.toLowerCase());
      
      if (!tokenInObj || !tokenOutObj) {
        throw new Error('Token not found');
      }

      // Discover best pool/fee for the actual pair
      // Handle ETH input as WETH for pool discovery
      const useWethForEthIn = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000' && 
                              tokenOut.toLowerCase() === UNISWAP_V3_CONFIG.USDC_ADDRESS.toLowerCase();
      const discoverTokenIn = useWethForEthIn ? TOKENS.WETH : tokenInObj;
      const discoverTokenOut = useWethForEthIn ? TOKENS.USDC : tokenOutObj;
      const bestPool = await this.discoverBestPool(discoverTokenIn, discoverTokenOut);
      if (!bestPool) {
        throw new Error('Pool not found');
      }

      // Convert amount to proper decimals
      const amountInWei = ethers.parseUnits(amountIn, tokenInObj.decimals);
      const minimumAmountOut = ethers.parseUnits(quote.minimumReceived, tokenOutObj.decimals);

      // Check if token is approved for the exact amount (ETH doesn't need approval)
      const signerAddress = await this.signer.getAddress();
      const isEth = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000';
      
      if (!isEth) {
        const isApproved = await this.isTokenApproved(
          tokenIn,
          UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          signerAddress,
          amountInWei
        );
        if (!isApproved) {
          throw new Error('Token not approved. Please approve the token first.');
        }
      }

      // For ETH → USDC swaps, we need to use exactInputSingle with ETH value
      const isEthToUsdc = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000' && 
                          tokenOut.toLowerCase() === UNISWAP_V3_CONFIG.USDC_ADDRESS.toLowerCase();

      if (isEthToUsdc) {
        // Use exactInputSingle with ETH value for ETH → USDC
        const routerContract = new ethers.Contract(
          UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'],
          this.signer
        );

        // Force recipient to signer to avoid accidental burn/wrong address
        const safeRecipient = signerAddress;

        const swapParams = {
          tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS, // Use WETH for the swap
          tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS, // USDC
          fee: bestPool.fee,
          recipient: safeRecipient,
          deadline: deadline || Math.floor(Date.now() / 1000) + 1800, // 30 minutes
          amountIn: amountInWei,
          amountOutMinimum: minimumAmountOut,
          sqrtPriceLimitX96: 0
        };

        // Estimate gas first
        const gasEstimate = await routerContract.exactInputSingle.estimateGas(swapParams, {
          value: amountInWei // Send ETH value
        });

        // Execute the swap with ETH value
        const transaction = await routerContract.exactInputSingle(swapParams, {
          value: amountInWei, // Send ETH value
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
        });
        // Wait 1 confirmation to ensure funds received
        try { await transaction.wait?.(1); } catch {}
        return transaction;
      } else {
        // For other token swaps, use regular exactInputSingle
        const routerContract = new ethers.Contract(
          UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'],
          this.signer
        );

        // Force recipient to signer to avoid accidental burn/wrong address
        const safeRecipient = signerAddress;

        const swapParams = {
          tokenIn,
          tokenOut,
          fee: bestPool.fee,
          recipient: safeRecipient,
          deadline: deadline || Math.floor(Date.now() / 1000) + 1800, // 30 minutes
          amountIn: amountInWei,
          amountOutMinimum: minimumAmountOut,
          sqrtPriceLimitX96: 0
        };

        // Estimate gas first
        const gasEstimate = await routerContract.exactInputSingle.estimateGas(swapParams);

        // Execute the swap
        const transaction = await routerContract.exactInputSingle(swapParams, {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
        });
        // Wait 1 confirmation to ensure funds received
        try { await transaction.wait?.(1); } catch {}
        return transaction;
      }
    }).catch(error => {
      console.error('Error executing swap:', error);
      throw error;
    });
  }

  /**
   * Check if token is approved for spending
   */
  async isTokenApproved(
    tokenAddress: string,
    spender: string,
    owner: string,
    requiredAmountWei: bigint = 0n
  ): Promise<boolean> {
    try {
      // Native ETH doesn't need approval
      if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        return true;
      }

      const contract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address, address) external view returns (uint256)'],
        this.provider
      );

      const allowance: bigint = await contract.allowance(owner, spender);
      return allowance >= requiredAmountWei;
    } catch (error) {
      console.error('Error checking token approval:', error);
      return false;
    }
  }

  /**
   * Approve token for spending
   */
  async approveToken(tokenAddress: string, spender: string, amount: string): Promise<ethers.TransactionResponse | null> {
    return this.executeWithFallback(async () => {
      if (!this.signer) {
        throw new Error('No signer available');
      }

      // Find token to get decimals
      const tokenObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
      if (!tokenObj) {
        throw new Error('Token not found');
      }

      // Convert amount to proper decimals
      const amountWei = ethers.parseUnits(amount, tokenObj.decimals);

      const contract = new ethers.Contract(
        tokenAddress,
        ['function approve(address, uint256) external returns (bool)'],
        this.signer
      );

      // Estimate gas first
      const gasEstimate = await contract.approve.estimateGas(spender, amountWei);

      const transaction = await contract.approve(spender, amountWei, {
        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
      });

      return transaction;
    }).catch(error => {
      console.error('Error approving token:', error);
      throw error;
    });
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    return this.executeWithFallback(async () => {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || GAS_SETTINGS.DEFAULT_GAS_PRICE;
    }).catch(error => {
      console.error('Error getting gas price:', error);
      return GAS_SETTINGS.DEFAULT_GAS_PRICE;
    });
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    return this.executeWithFallback(async () => {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.getGasPrice();

      return {
        chainId: Number(network.chainId),
        name: network.name,
        blockNumber,
        gasPrice,
      };
    }).catch(error => {
      console.error('Error getting network info:', error);
      return null;
    });
  }
}

// Export singleton instance
export const uniswapV3Service = new UniswapV3Service(
  new ethers.JsonRpcProvider(UNISWAP_V3_CONFIG.RPC_URL)
);
