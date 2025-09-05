export interface TradingPair {
  baseToken: string
  quoteToken: string
  baseTokenSymbol: string
  quoteTokenSymbol: string
  isActive: boolean
  minOrderSize: string
  pricePrecision: string
}

/**
 * Default trading pairs for Polygon (Amoy/Mainnet placeholder)
 */
const DEFAULT_TRADING_PAIRS: TradingPair[] = [
  {
    baseToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC (mainnet)
    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
    baseTokenSymbol: 'USDC',
    quoteTokenSymbol: 'ETH',
    isActive: true,
    minOrderSize: '1000000', // 1 USDC
    pricePrecision: '1000000000000000000', // 1 ETH precision
  },
  {
    baseToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH (mainnet)
    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
    baseTokenSymbol: 'WETH',
    quoteTokenSymbol: 'ETH',
    isActive: true,
    minOrderSize: '100000000000000000', // 0.1 WETH
    pricePrecision: '1000000000000000000', // 1 ETH precision
  },
  {
    baseToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI (mainnet)
    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
    baseTokenSymbol: 'DAI',
    quoteTokenSymbol: 'ETH',
    isActive: true,
    minOrderSize: '1000000000000000000000', // 1000 DAI
    pricePrecision: '1000000000000000000', // 1 ETH precision
  },
  {
    baseToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (mainnet)
    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
    baseTokenSymbol: 'WBTC',
    quoteTokenSymbol: 'ETH',
    isActive: true,
    minOrderSize: '100000000', // 1 WBTC (8 decimals)
    pricePrecision: '1000000000000000000', // 1 ETH precision
  }
]

/**
 * Load trading pairs from environment variables
 * Environment variable: VITE_TRADING_PAIRS
 * Format: JSON array of TradingPair objects
 */
export const getTradingPairs = (): TradingPair[] => {
  try {
    const pairsJson = import.meta.env.VITE_TRADING_PAIRS
    
    if (!pairsJson) {
      console.warn('No trading pairs configured in environment (VITE_TRADING_PAIRS), using defaults')
      return DEFAULT_TRADING_PAIRS
    }
    
    const pairs = JSON.parse(pairsJson) as TradingPair[]
    
    // Validate and filter active pairs
    const validPairs = pairs.filter(pair => {
      if (!pair.baseToken || !pair.quoteToken || !pair.baseTokenSymbol || !pair.quoteTokenSymbol) {
        console.warn('Invalid trading pair configuration:', pair)
        return false
      }
      
      if (!pair.isActive) {
        console.log('Skipping inactive trading pair:', `${pair.baseTokenSymbol}/${pair.quoteTokenSymbol}`)
        return false
      }
      
      return true
    })
    
    console.log(`Loaded ${validPairs.length} active trading pairs from environment`)
    
    // If no valid pairs from environment, use defaults
    if (validPairs.length === 0) {
      console.warn('No valid trading pairs from environment, using defaults')
      return DEFAULT_TRADING_PAIRS
    }
    
    return validPairs
  } catch (error) {
    console.error('Failed to parse trading pairs from environment:', error)
    console.warn('Using default trading pairs due to parsing error')
    return DEFAULT_TRADING_PAIRS
  }
}

/**
 * Get a specific trading pair by base and quote tokens
 */
export const getTradingPair = (baseToken: string, quoteToken: string): TradingPair | null => {
  const pairs = getTradingPairs()
  return pairs.find(pair => 
    pair.baseToken.toLowerCase() === baseToken.toLowerCase() && 
    pair.quoteToken.toLowerCase() === quoteToken.toLowerCase()
  ) || null
}

/**
 * Get the first available trading pair
 */
export const getDefaultTradingPair = (): TradingPair | null => {
  const pairs = getTradingPairs()
  return pairs.length > 0 ? pairs[0] : null
}

/**
 * Validate a trading pair configuration
 */
export const validateTradingPair = (pair: TradingPair): boolean => {
  return !!(
    pair.baseToken &&
    pair.quoteToken &&
    pair.baseTokenSymbol &&
    pair.quoteTokenSymbol &&
    pair.isActive &&
    pair.minOrderSize &&
    pair.pricePrecision
  )
} 