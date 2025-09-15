// Yellow Network Configuration
// Based on the Yellow Network Technical Paper and ERC-7824 Standard

export const YELLOW_NETWORK_CONFIG = {
  // Network Configuration
  chainId: 11155111, // Ethereum Sepolia testnet
  rpcUrl: 'https://rpc.sepolia.org',
  
  // Yellow Network Core Contracts (ClearSync Protocol)
  contracts: {
    // Adjudicator contract - manages collateral and resolves disputes
    adjudicator: '0x1234567890123456789012345678901234567890', // Mock address for development
    // $YELLOW token - used as collateral in state channels
    yellowToken: '0x2345678901234567890123456789012345678901', // Mock address for development
    // State channel factory contract
    stateChannelFactory: '0x3456789012345678901234567890123456789012', // Mock address for development
    // HTLC contracts for atomic cross-chain settlements
    htlcFactory: '0x4567890123456789012345678901234567890123', // Mock address for development
    // ERC-7824 State Channel Registry
    stateChannelRegistry: '0x5678901234567890123456789012345678901234', // Mock address for development
  },
  
  // LibP2P Network Configuration
  libp2p: {
    // Bootstrap nodes for peer discovery (Yellow Network testnet)
    bootstrapNodes: [
      '/ip4/104.21.0.1/tcp/4001/p2p/12D3KooWYellowNode1',
      '/ip4/104.21.0.2/tcp/4001/p2p/12D3KooWYellowNode2',
      '/ip4/104.21.0.3/tcp/4001/p2p/12D3KooWYellowNode3',
    ],
    // PubSub topics for order book synchronization
    topics: {
      orderBook: 'yellow-network-orderbook-v1',
      priceUpdates: 'yellow-network-prices-v1',
      stateChannelUpdates: 'yellow-network-state-channels-v1',
      tradeExecution: 'yellow-network-trades-v1',
      liquidityUpdates: 'yellow-network-liquidity-v1',
    },
    // Connection settings
    maxConnections: 200,
    minConnections: 10,
    // GossipSub configuration
    gossipSub: {
      D: 6, // Degree of the mesh
      Dlo: 4, // Low degree threshold
      Dhi: 12, // High degree threshold
      Dscore: 4, // Score threshold
      Dout: 2, // Outbound degree
      Dlazy: 6, // Lazy degree
      DlazyScore: 4, // Lazy score threshold
      heartbeatInterval: 1000, // Heartbeat interval in ms
      fanoutTTL: 60000, // Fanout TTL in ms
      pruneBackoff: 60000, // Prune backoff in ms
      prunePeers: 16, // Number of peers to prune
      graftFloodThreshold: 5, // Graft flood threshold
      opportunisticGraftThreshold: 2, // Opportunistic graft threshold
      opportunisticGraftPeers: 2, // Number of opportunistic graft peers
    },
  },
  
  // State Channel Configuration (ClearSync Protocol)
  stateChannels: {
    // Minimum collateral required to open a state channel
    minCollateral: '1000000000000000000', // 1 $YELLOW (18 decimals)
    // Maximum number of state channels per participant
    maxChannels: 10,
    // Settlement period in seconds (1 hour as mentioned in paper)
    settlementPeriod: 3600,
    // Challenge period for disputes
    challengePeriod: 300, // 5 minutes
    // Margin call threshold
    marginCallThreshold: 0.8, // 80% of collateral
  },

  // Trading Configuration
  trading: {
    // Supported trading pairs
    supportedPairs: [
      'ETH/USDC',
      'ETH/USDT', 
      'MATIC/USDC',
      'MATIC/USDT',
      'BTC/USDC',
      'BTC/USDT',
      'WBTC/USDC',
      'WETH/USDC',
    ],
    // Order constraints
    minOrderSize: '1000000000000000000', // 1 token minimum
    maxOrderSize: '1000000000000000000000000', // 1M tokens maximum
    pricePrecision: 18,
    amountPrecision: 18,
    // Trading fees (basis points)
    tradingFee: 10, // 0.1%
    // Slippage tolerance
    defaultSlippage: 0.5, // 0.5%
  },

  // WebSocket Configuration for real-time updates
  websocket: {
    // Broker node WebSocket endpoint (Yellow Network testnet)
    brokerUrl: 'wss://testnet-broker.yellow.network',
    // Backup broker endpoints
    backupBrokers: [
      'wss://testnet-broker-2.yellow.network',
      'wss://testnet-broker-3.yellow.network',
    ],
    // Reconnection settings
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    // Connection timeout
    connectionTimeout: 10000,
    // Subscription topics
    topics: {
      orderBook: 'orderbook',
      trades: 'trades',
      stateChannel: 'statechannel',
      priceUpdates: 'prices',
      liquidityUpdates: 'liquidity',
      marketData: 'marketdata',
    },
    // Authentication
    auth: {
      type: 'jwt', // JWT token authentication
      token: '', // Will be set dynamically
    },
  },

  // Custodian Configuration for cross-chain support
  custodians: {
    // Ethereum custodian (testnet) - Primary
    ethereum: {
      address: '0x1111111111111111111111111111111111111111', // Mock address for development
      supportedTokens: ['ETH', 'USDC', 'USDT', 'WETH', 'WBTC', 'DAI'],
      chainId: 11155111, // Sepolia
      isActive: true,
    },
    // Arbitrum custodian (testnet)
    arbitrum: {
      address: '0x3333333333333333333333333333333333333333', // Mock address for development
      supportedTokens: ['WETH', 'USDC', 'USDT'],
      chainId: 421614, // Arbitrum Sepolia
      isActive: true,
    },
    // Optimism custodian (testnet)
    optimism: {
      address: '0x4444444444444444444444444444444444444444', // Mock address for development
      supportedTokens: ['WETH', 'USDC', 'USDT'],
      chainId: 11155420, // Optimism Sepolia
      isActive: true,
    },
  },
} as const;

// Yellow Network Types based on the technical paper

export interface StateChannel {
  id: string;
  status: 'open' | 'closed' | 'disputed' | 'challenged';
  collateral: string; // Amount of $YELLOW tokens locked
  counterparty: string; // Address of the other participant
  createdAt: number;
  lastSettlement: number;
  // ClearSync protocol specific
  distributionRatio: number; // Current collateral distribution
  marginCallThreshold: number;
  challengePeriod: number;
  // Trading activity
  totalVolume: string;
  lastTrade: number;
}

export type OrderType = 'limit' | 'market' | 'stop-loss' | 'stop-limit' | 'fill-or-kill' | 'post-only';
export type OrderSide = 'buy' | 'sell';

export interface Order {
  id: string;
  type: OrderType;
  side: OrderSide;
  amount: string;
  price: string;
  pair: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired' | 'partially-filled';
  createdAt: number;
  filledAt?: number;
  trader: string;
  // Yellow Network specific
  stateChannelId?: string; // Associated state channel
  routingPath?: string[]; // Optimal routing through the mesh network
  counterparty?: string; // Direct counterparty for P2P trading
}

export interface OrderBook {
  pair: string;
  buyOrders: Order[];
  sellOrders: Order[];
  lastUpdate: number;
  // Aggregated order book data
  totalBidVolume: string;
  totalAskVolume: string;
  bestBid: string;
  bestAsk: string;
  spread: string;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  recipient?: string;
  // Cross-chain swap parameters
  sourceChain: string;
  targetChain: string;
  // HTLC parameters for atomic settlement
  timelock?: number;
  hashlock?: string;
}

export interface SwapResult {
  txHash: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  fee: string;
  route: string[];
  // Cross-chain settlement details
  htlcId?: string;
  settlementTxHash?: string;
  // State channel updates
  stateChannelUpdates?: StateChannelUpdate[];
}

export interface StateChannelUpdate {
  channelId: string;
  newDistributionRatio: number;
  collateralChange: string;
  liabilityChange: string;
  timestamp: number;
}

export interface MarketData {
  pair: string;
  price: string;
  volume24h: string;
  change24h: number;
  high24h: string;
  low24h: string;
  lastUpdate: number;
  // Yellow Network specific
  liquidityDepth: string;
  spread: string;
  // Cross-chain availability
  availableChains: string[];
}

export interface CustodianInfo {
  address: string;
  chain: string;
  supportedTokens: string[];
  isActive: boolean;
  lastUpdate: number;
}

// Yellow Network Error Types
export class YellowNetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'YellowNetworkError';
  }
}

export const YELLOW_ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  PEER_CONNECTION_FAILED: 'PEER_CONNECTION_FAILED',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  
  // State channel errors
  INSUFFICIENT_COLLATERAL: 'INSUFFICIENT_COLLATERAL',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  CHANNEL_DISPUTED: 'CHANNEL_DISPUTED',
  CHANNEL_CLOSED: 'CHANNEL_CLOSED',
  MARGIN_CALL_REQUIRED: 'MARGIN_CALL_REQUIRED',
  SETTLEMENT_FAILED: 'SETTLEMENT_FAILED',
  
  // Trading errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_ORDER: 'INVALID_ORDER',
  ORDER_EXPIRED: 'ORDER_EXPIRED',
  INSUFFICIENT_LIQUIDITY: 'INSUFFICIENT_LIQUIDITY',
  
  // Cross-chain errors
  CUSTODIAN_UNAVAILABLE: 'CUSTODIAN_UNAVAILABLE',
  HTLC_EXPIRED: 'HTLC_EXPIRED',
  ATOMIC_SETTLEMENT_FAILED: 'ATOMIC_SETTLEMENT_FAILED',
  
  // General errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
} as const;

// LibP2P Message Types
export interface LibP2PMessage {
  type: 'orderbook_update' | 'price_update' | 'state_channel_update' | 'trade_execution';
  data: any;
  timestamp: number;
  from: string;
  to?: string;
}

// HTLC Contract Interface
export interface HTLCParams {
  hashlock: string;
  timelock: number;
  initiator: string;
  participant: string;
  amount: string;
  token: string;
}
