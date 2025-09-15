// Uniswap V3 Configuration for Ethereum Mainnet
import { Token } from '@uniswap/sdk-core';

// Mainnet Configuration
export const UNISWAP_V3_CONFIG = {
  // Uniswap V3 Factory Contract on Mainnet
  FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  
  // Uniswap V3 Router Contract on Mainnet
  ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  
  // Uniswap V3 Quoter Contract on Mainnet
  QUOTER_ADDRESS: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  
  // Uniswap V3 SwapRouter Contract on Mainnet
  SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  
  // WETH9 Contract on Mainnet
  WETH_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  
  // USDC Contract on Mainnet (Circle's USDC)
  USDC_ADDRESS: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  
  // Chain ID for Ethereum Mainnet
  CHAIN_ID: 1,
  
  // RPC URLs for Mainnet (multiple options for CORS compatibility)
  RPC_URLS: [
    'https://ethereum.publicnode.com', // PublicNode (CORS-friendly)
    'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura (CORS-friendly)
    'https://eth-mainnet.gateway.tenderly.co', // Tenderly (CORS-friendly)
    'https://cloudflare-eth.com', // Cloudflare (CORS-friendly)
    'https://rpc.ankr.com/eth', // Ankr (CORS-friendly)
  ],
  
  // Primary RPC URL (will try others if this fails)
  RPC_URL: 'https://ethereum.publicnode.com',
  
  // Fee tiers for different trading pairs
  FEE_TIERS: {
    LOW: 500,    // 0.05%
    MEDIUM: 3000, // 0.3%
    HIGH: 10000,  // 1%
  },
  
  // Default fee tier for ETH/USDC (1% fee tier has the most liquidity)
  DEFAULT_FEE_TIER: 10000,
} as const;

// Token definitions for Mainnet
export const TOKENS = {
  ETH: new Token(
    UNISWAP_V3_CONFIG.CHAIN_ID,
    '0x0000000000000000000000000000000000000000', // Native ETH
    18,
    'ETH',
    'Ethereum'
  ),
  
  WETH: new Token(
    UNISWAP_V3_CONFIG.CHAIN_ID,
    UNISWAP_V3_CONFIG.WETH_ADDRESS,
    18,
    'WETH',
    'Wrapped Ether'
  ),
  
  USDC: new Token(
    UNISWAP_V3_CONFIG.CHAIN_ID,
    UNISWAP_V3_CONFIG.USDC_ADDRESS,
    6,
    'USDC',
    'USD Coin'
  ),
} as const;

// Trading pairs configuration
export const TRADING_PAIRS = {
  ETH_USDC: {
    token0: TOKENS.WETH, // Use WETH for Uniswap V3 (ETH gets wrapped)
    token1: TOKENS.USDC,
    fee: UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER,
    symbol: 'ETH/USDC',
    name: 'Ethereum / USD Coin',
  },
} as const;

// Uniswap V3 Pool Addresses (calculated from factory)
export const POOL_ADDRESSES = {
  ETH_USDC: '0x0000000000000000000000000000000000000000', // Will be calculated dynamically
} as const;

// Gas settings for Mainnet
export const GAS_SETTINGS = {
  // Gas price in gwei (Mainnet typically has higher gas prices)
  DEFAULT_GAS_PRICE: '20000000000', // 20 gwei
  
  // Gas limits for different operations
  GAS_LIMITS: {
    SWAP: 300000,
    APPROVE: 100000,
    QUOTE: 100000,
  },
  
  // Slippage tolerance (0.5%)
  DEFAULT_SLIPPAGE_TOLERANCE: 50, // 0.5%
  
  // Deadline for transactions (20 minutes)
  DEFAULT_DEADLINE: 20 * 60, // 20 minutes in seconds
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity for this trade',
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  INVALID_AMOUNT: 'Invalid amount specified',
  NETWORK_ERROR: 'Network error occurred',
  USER_REJECTED: 'Transaction rejected by user',
  DEADLINE_EXCEEDED: 'Transaction deadline exceeded',
  SLIPPAGE_EXCEEDED: 'Slippage tolerance exceeded',
} as const;

// Export types
export type TokenSymbol = keyof typeof TOKENS;
export type TradingPair = keyof typeof TRADING_PAIRS;
export type FeeTier = keyof typeof UNISWAP_V3_CONFIG.FEE_TIERS;