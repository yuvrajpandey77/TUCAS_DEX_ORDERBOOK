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
            UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER, // 1% fee
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
        const gasEstimate = await this.estimateSwapGas(tokenIn, tokenOut, amountIn, UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER);

        return {
          inputAmount: amountIn,
          outputAmount: amountOutFormatted,
          priceImpact: '0.1', // Simplified - would need more complex calculation
          minimumReceived: minimumReceivedFormatted,
          gasEstimate: gasEstimate.toString(),
          route: ['ETH', 'USDC'], // Show ETH in route for user clarity
          fee: UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER,
        };
      }
      
      // For other token pairs, use the original logic
      const poolExists = await this.poolExists(tokenInObj, tokenOutObj, UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER);
      if (!poolExists) {
        console.error(`❌ Pool ${tokenInObj.symbol}/${tokenOutObj.symbol} does not exist on Ethereum mainnet`);
        throw new Error('Pool not found. Please check your network connection.');
      }

      // Get pool info to determine fee
      const poolInfo = await this.getPoolInfo('ETH_USDC');
      if (!poolInfo) {
        console.error('❌ Pool info not available');
        throw new Error('Unable to get pool information. Please check your connection.');
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
        amountOut = await quoterContract.quoteExactInputSingle.staticCall(
          tokenIn,
          tokenOut,
          poolInfo.fee,
          amountInWei,
          0 // sqrtPriceLimitX96 = 0 means no price limit
        );
        
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

      // Format amounts
      const amountOutFormatted = ethers.formatUnits(amountOut, tokenOutObj.decimals);
      const minimumReceivedFormatted = ethers.formatUnits(minimumReceived, tokenOutObj.decimals);

      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(tokenIn, tokenOut, amountIn, poolInfo.fee);

      return {
        inputAmount: amountIn,
        outputAmount: amountOutFormatted,
        priceImpact: '0.1', // Simplified - would need more complex calculation
        minimumReceived: minimumReceivedFormatted,
        gasEstimate: gasEstimate.toString(),
        route: [tokenInObj.symbol || 'UNKNOWN', tokenOutObj.symbol || 'UNKNOWN'],
        fee: poolInfo.fee,
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
  private async getFallbackQuote(
    tokenIn: any, 
    tokenOut: any, 
    amountIn: string, 
    slippageTolerance: number
  ): Promise<SwapQuote> {
    console.error('❌ CRITICAL: Pool not found or quoter failed - cannot provide real quotes!');
    console.error('This should not happen on Ethereum mainnet. Please check:');
    console.error('1. You are connected to Ethereum mainnet (chain ID: 1)');
    console.error('2. The WETH/USDC pool has liquidity');
    console.error('3. Your RPC endpoint is working');
    
    // Return null instead of mock data - force the UI to show error
    throw new Error('Unable to get real market quote. Please check your connection and try again.');
  }

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

      const { tokenIn, tokenOut, amountIn, recipient, deadline } = params;
      
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

      // Get pool info
      const poolInfo = await this.getPoolInfo('ETH_USDC');
      if (!poolInfo) {
        throw new Error('Pool not found');
      }

      // Convert amount to proper decimals
      const amountInWei = ethers.parseUnits(amountIn, tokenInObj.decimals);
      const minimumAmountOut = ethers.parseUnits(quote.minimumReceived, tokenOutObj.decimals);

      // Check if token is approved (ETH doesn't need approval)
      const signerAddress = await this.signer.getAddress();
      const isEth = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000';
      
      if (!isEth) {
        const isApproved = await this.isTokenApproved(tokenIn, UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS, signerAddress);
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
          fee: poolInfo.fee,
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
          fee: poolInfo.fee,
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
  async isTokenApproved(tokenAddress: string, spender: string, owner: string): Promise<boolean> {
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

      const allowance = await contract.allowance(owner, spender);
      return allowance > 0;
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
