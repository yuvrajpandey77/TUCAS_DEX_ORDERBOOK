// Contract ABIs
export const ORDERBOOK_DEX_ABI = [
  'function addTradingPair(address baseToken, address quoteToken, uint256 minOrderSize, uint256 pricePrecision) external',
  'function placeLimitOrder(address baseToken, address quoteToken, uint256 amount, uint256 price, bool isBuy) external payable returns (uint256)',
  'function placeMarketOrder(address baseToken, address quoteToken, uint256 amount, bool isBuy) external payable',
  'function cancelOrder(uint256 orderId) external',
  'function getOrderBook(address baseToken, address quoteToken) external view returns (uint256[], uint256[], uint256[], uint256[])',
  'function getUserOrders(address user) external view returns (uint256[])',
  'function getUserBalance(address user, address token) external view returns (uint256)',
  'function withdraw(address token, uint256 amount) external',
  'function tradingPairs(address, address) external view returns (address, address, bool, uint256, uint256)',
  'function orders(uint256) external view returns (uint256, address, address, address, uint256, uint256, bool, bool, uint256)',
  'function isTradingPairActive(address baseToken, address quoteToken) external view returns (bool)',
  'function owner() external view returns (address)',
  'function transferOwnership(address newOwner) external',
  'function renounceOwnership() external',
  'function balances(address, address) external view returns (uint256)',
  'function userOrders(address, uint256) external view returns (uint256)',
  'function FEE_DENOMINATOR() external view returns (uint256)',
  'function TRADING_FEE() external view returns (uint256)',
  'function LIQUIDITY_FEE() external view returns (uint256)',
  'function NATIVE_TOKEN() external view returns (address)',
  // Events
  'event OrderPlaced(uint256 indexed orderId, address indexed trader, address baseToken, address quoteToken, uint256 amount, uint256 price, bool isBuy)',
  'event OrderMatched(uint256 indexed buyOrderId, uint256 indexed sellOrderId, address baseToken, address quoteToken, uint256 amount, uint256 price)',
  'event OrderCancelled(uint256 indexed orderId, address indexed trader)',
  'event TradingPairAdded(address indexed baseToken, address indexed quoteToken, uint256 minOrderSize)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event LiquidityAdded(address indexed provider, address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount)',
  'event LiquidityRemoved(address indexed provider, address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount)',
]

export const CONTRACTS = {
  ORDERBOOK_DEX: {
    address: (import.meta as any).env?.VITE_ORDERBOOK_DEX_ADDRESS || '0x0000000000000000000000000000000000000000',
    abi: ORDERBOOK_DEX_ABI
  }
} as const;

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

export const RPC_URL = (import.meta as any).env?.VITE_RPC_URL || 'https://ethereum.publicnode.com';
export const CHAIN_ID = 1;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  name: 'Ethereum Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: ['https://etherscan.io'],
} as const; 