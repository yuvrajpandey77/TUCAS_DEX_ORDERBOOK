import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uniswapV3Service } from '@/services/uniswap-v3-service';
import { TOKENS, UNISWAP_V3_CONFIG } from '@/config/uniswap-v3';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(() => ({
      getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111n, name: 'sepolia' }),
      getBlockNumber: vi.fn().mockResolvedValue(12345678),
      getFeeData: vi.fn().mockResolvedValue({ gasPrice: 2000000000n }),
      estimateGas: vi.fn().mockResolvedValue(300000n),
    })),
    Contract: vi.fn((address, abi, provider) => {
      const isUSDC = address === '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
      return {
        liquidity: vi.fn().mockResolvedValue('1000000000000000000'),
        slot0: vi.fn().mockResolvedValue({
          sqrtPriceX96: '123456789012345678901234567890',
          tick: 12345,
          observationIndex: 0,
          observationCardinality: 100,
          observationCardinalityNext: 100,
          feeProtocol: 0,
          unlocked: true
        }),
        balanceOf: vi.fn().mockResolvedValue('1000000000000000000'),
        decimals: vi.fn().mockResolvedValue(isUSDC ? 6 : 18),
        symbol: vi.fn().mockResolvedValue(isUSDC ? 'USDC' : 'WETH'),
        allowance: vi.fn().mockResolvedValue('0'),
        approve: vi.fn().mockResolvedValue({
          hash: '0x1234567890abcdef',
          wait: vi.fn().mockResolvedValue({ status: 1 })
        })
      };
    }),
    parseUnits: vi.fn((amount, decimals) => `${amount}${'0'.repeat(decimals)}`),
    formatUnits: vi.fn((amount, decimals) => (parseInt(amount) / Math.pow(10, decimals)).toString())
  }
}));

// Mock Uniswap V3 SDK
vi.mock('@uniswap/v3-sdk', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    token0: { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH' },
    token1: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC' }
  })),
  Route: vi.fn().mockImplementation(() => ({})),
  Trade: {
    createUncheckedTrade: vi.fn().mockReturnValue({
      outputAmount: { toExact: () => '2000.0' },
      minimumAmountOut: vi.fn().mockReturnValue({ toExact: () => '1990.0' }),
      priceImpact: { toFixed: () => '0.1' }
    })
  },
  SwapQuoter: vi.fn().mockImplementation(() => ({})),
  SwapRouter: vi.fn().mockImplementation(() => ({
    swapCallParameters: vi.fn().mockReturnValue({
      calldata: '0x1234567890abcdef',
      value: '0x0'
    })
  })),
  FeeAmount: { LOW: 500, MEDIUM: 3000, HIGH: 10000 },
  computePoolAddress: vi.fn().mockReturnValue('0x1234567890123456789012345678901234567890')
}));

// Mock Uniswap SDK Core
vi.mock('@uniswap/sdk-core', () => ({
  Token: vi.fn().mockImplementation((chainId, address, decimals, symbol, name) => ({
    chainId,
    address,
    decimals,
    symbol,
    name
  })),
  CurrencyAmount: {
    fromRawAmount: vi.fn().mockReturnValue({
      toExact: () => '1.0'
    })
  },
  TradeType: { EXACT_INPUT: 0, EXACT_OUTPUT: 1 },
  Percent: vi.fn().mockImplementation((numerator, denominator) => ({
    toFixed: () => '0.5'
  }))
}));

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890'])
  },
  writable: true
});

describe('UniswapV3Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct Sepolia configuration', () => {
      expect(UNISWAP_V3_CONFIG.CHAIN_ID).toBe(11155111);
      expect(UNISWAP_V3_CONFIG.RPC_URL).toBe('https://rpc.sepolia.org');
      expect(UNISWAP_V3_CONFIG.FACTORY_ADDRESS).toBe('0x0227628f3F023bb0B980b67D528571c95c6DaC1c');
      expect(UNISWAP_V3_CONFIG.ROUTER_ADDRESS).toBe('0x3bFA4769FB09eefC5a80d6E87c3B9C0fCf4ea5c5');
    });

    it('should have correct token addresses', () => {
      expect(TOKENS.WETH.address).toBe('0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14');
      expect(TOKENS.USDC.address).toBe('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');
    });
  });

  describe('Pool Information', () => {
    it('should get pool info for ETH/USDC pair', async () => {
      const poolInfo = await uniswapV3Service.getPoolInfo('ETH_USDC');
      
      expect(poolInfo).toBeDefined();
      expect(poolInfo?.token0).toBeDefined();
      expect(poolInfo?.token1).toBeDefined();
      expect(poolInfo?.fee).toBe(3000);
    });
  });

  describe('Token Balances', () => {
    it('should get token balance for WETH', async () => {
      const balance = await uniswapV3Service.getTokenBalance(
        TOKENS.WETH.address,
        '0x1234567890123456789012345678901234567890'
      );
      
      expect(balance).toBeDefined();
      expect(balance?.token).toBe(TOKENS.WETH.address);
      expect(balance?.symbol).toBe('WETH');
    });

    it('should get token balance for USDC', async () => {
      const balance = await uniswapV3Service.getTokenBalance(
        TOKENS.USDC.address,
        '0x1234567890123456789012345678901234567890'
      );
      
      expect(balance).toBeDefined();
      expect(balance?.token).toBe(TOKENS.USDC.address);
      expect(balance?.symbol).toBe('USDC');
    });
  });

  describe('Swap Quotes', () => {
    it('should get swap quote for WETH to USDC', async () => {
      const quote = await uniswapV3Service.getSwapQuote({
        tokenIn: TOKENS.WETH.address,
        tokenOut: TOKENS.USDC.address,
        amountIn: '1.0',
        slippageTolerance: 50
      });
      
      expect(quote).toBeDefined();
      expect(quote?.inputAmount).toBe('1.0');
      expect(quote?.outputAmount).toBeDefined();
      expect(quote?.priceImpact).toBeDefined();
      expect(quote?.gasEstimate).toBeDefined();
    });
  });

  describe('Token Approval', () => {
    it('should check token approval status', async () => {
      const isApproved = await uniswapV3Service.isTokenApproved(
        TOKENS.WETH.address,
        UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
        '0x1234567890123456789012345678901234567890'
      );
      
      expect(typeof isApproved).toBe('boolean');
    });
  });

  describe('Network Information', () => {
    it('should get network info', async () => {
      const networkInfo = await uniswapV3Service.getNetworkInfo();
      
      expect(networkInfo).toBeDefined();
      expect(networkInfo?.chainId).toBe(11155111);
      expect(networkInfo?.name).toBe('sepolia');
    });
  });

  describe('Gas Price', () => {
    it('should get current gas price', async () => {
      const gasPrice = await uniswapV3Service.getGasPrice();
      
      expect(gasPrice).toBeDefined();
      expect(typeof gasPrice).toBe('string');
    });
  });
});
