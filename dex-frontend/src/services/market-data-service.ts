import { ethers } from 'ethers';
import { dexService } from './dex-service';

export interface PriceData {
  price: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

export interface MarketStats {
  totalVolume: string;
  totalTrades: number;
  activeOrders: number;
  averagePrice: string;
  priceVolatility: string;
}

export class MarketDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Get price data from order book
  async getPriceFromOrderBook(
    baseToken: string,
    quoteToken: string,
    signer: ethers.JsonRpcSigner
  ): Promise<PriceData> {
    try {
      await dexService.initialize(signer);
      
      const orderBook = await dexService.getOrderBook(baseToken, quoteToken);
      
      // Calculate mid price from order book
      let midPrice = '0.0000';
      if (orderBook.buyOrders.length > 0 && orderBook.sellOrders.length > 0) {
        const bestBuyPrice = parseFloat(ethers.formatEther(orderBook.buyOrders[0].price));
        const bestSellPrice = parseFloat(ethers.formatEther(orderBook.sellOrders[0].price));
        midPrice = ((bestBuyPrice + bestSellPrice) / 2).toFixed(4);
      } else if (orderBook.buyOrders.length > 0) {
        midPrice = ethers.formatEther(orderBook.buyOrders[0].price);
      } else if (orderBook.sellOrders.length > 0) {
        midPrice = ethers.formatEther(orderBook.sellOrders[0].price);
      }

      // Calculate 24h volume from orders
      const totalVolume = orderBook.buyOrders.reduce((sum, order) => {
        return sum + parseFloat(ethers.formatEther(order.amount));
      }, 0) + orderBook.sellOrders.reduce((sum, order) => {
        return sum + parseFloat(ethers.formatEther(order.amount));
      }, 0);

      // For demo purposes, simulate price change
      const basePrice = 1.2345;
      const currentPrice = parseFloat(midPrice);
      const priceChange = currentPrice - basePrice;
      const priceChangePercent = ((priceChange / basePrice) * 100).toFixed(2);

      return {
        price: midPrice,
        change24h: priceChange.toFixed(4),
        changePercent24h: priceChangePercent,
        volume24h: this.formatVolume(totalVolume),
        high24h: (currentPrice * 1.02).toFixed(4),
        low24h: (currentPrice * 0.98).toFixed(4),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting price from order book:', error);
      throw error;
    }
  }

  // Get market statistics
  async getMarketStats(
    baseToken: string,
    quoteToken: string,
    signer: ethers.JsonRpcSigner
  ): Promise<MarketStats> {
    try {
      await dexService.initialize(signer);
      
      const orderBook = await dexService.getOrderBook(baseToken, quoteToken);
      
      // Calculate total volume
      const totalVolume = orderBook.buyOrders.reduce((sum, order) => {
        return sum + parseFloat(ethers.formatEther(order.amount));
      }, 0) + orderBook.sellOrders.reduce((sum, order) => {
        return sum + parseFloat(ethers.formatEther(order.amount));
      }, 0);

      // Count active orders
      const activeOrders = orderBook.buyOrders.length + orderBook.sellOrders.length;

      // Calculate average price
      const allPrices = [
        ...orderBook.buyOrders.map(order => parseFloat(ethers.formatEther(order.price))),
        ...orderBook.sellOrders.map(order => parseFloat(ethers.formatEther(order.price)))
      ];
      
      const averagePrice = allPrices.length > 0 
        ? (allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length).toFixed(4)
        : '0.0000';

      // Calculate price volatility (simplified)
      const prices = allPrices.filter(price => price > 0);
      const volatility = prices.length > 1 
        ? this.calculateVolatility(prices).toFixed(2)
        : '0.00';

      return {
        totalVolume: this.formatVolume(totalVolume),
        totalTrades: activeOrders,
        activeOrders,
        averagePrice,
        priceVolatility: `${volatility}%`
      };
    } catch (error) {
      console.error('Error getting market stats:', error);
      throw error;
    }
  }

  // Get historical price data (simulated for demo)
  async getHistoricalPrices(
    baseToken: string,
    quoteToken: string,
    hours: number = 24
  ): Promise<{ timestamp: number; price: string }[]> {
    try {
      // Simulate historical data
      const data = [];
      const basePrice = 1.2345;
      const now = Date.now();
      
      for (let i = hours; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const randomChange = (Math.random() - 0.5) * 0.1; // ±5% change
        const price = (basePrice + randomChange).toFixed(4);
        
        data.push({
          timestamp,
          price
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error getting historical prices:', error);
      throw error;
    }
  }

  // Get price alerts (simulated)
  async getPriceAlerts(
    baseToken: string,
    quoteToken: string
  ): Promise<{ type: 'high' | 'low' | 'volatility'; message: string; timestamp: number }[]> {
    try {
      // Simulate price alerts
      const alerts = [];
      const now = Date.now();
      
      // Random alerts
      if (Math.random() > 0.7) {
        alerts.push({
          type: 'high' as const,
          message: 'Price reached 24h high',
          timestamp: now - 1000 * 60 * 30 // 30 minutes ago
        });
      }
      
      if (Math.random() > 0.8) {
        alerts.push({
          type: 'volatility' as const,
          message: 'High volatility detected',
          timestamp: now - 1000 * 60 * 15 // 15 minutes ago
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error getting price alerts:', error);
      throw error;
    }
  }

  // Get trading pair information
  async getTradingPairInfo(
    baseToken: string,
    quoteToken: string,
    signer: ethers.JsonRpcSigner
  ): Promise<{
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    isActive: boolean;
    minOrderSize: string;
    pricePrecision: string;
  }> {
    try {
      await dexService.initialize(signer);
      
      // Check if these are placeholder addresses
      const isPlaceholderAddress = (address: string) => {
        const placeholderPatterns = [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901',
          '0x3456789012345678901234567890123456789012',
          '0x4567890123456789012345678901234567890123'
        ]
        return placeholderPatterns.includes(address.toLowerCase())
      }
      
      let isActive = false;
      try {
        isActive = await dexService.isTradingPairActive(baseToken, quoteToken);
      } catch (error) {
        // If using placeholder addresses, assume active for demo
        if (isPlaceholderAddress(baseToken) || isPlaceholderAddress(quoteToken)) {
          console.log('Using placeholder addresses, assuming trading pair is active for demo')
          isActive = true;
        } else {
          console.error('Error checking trading pair status:', error);
          isActive = false;
        }
      }
      
      return {
        baseTokenSymbol: 'ETH', // This would come from token contract
        quoteTokenSymbol: 'USDC', // This would come from token contract
        isActive,
        minOrderSize: '1.0',
        pricePrecision: '0.0001'
      };
    } catch (error) {
      console.error('Error getting trading pair info:', error);
      throw error;
    }
  }

  // Format volume for display
  private formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    } else {
      return volume.toFixed(0);
    }
  }

  // Calculate price volatility
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const standardDeviation = Math.sqrt(variance);
    
    return (standardDeviation / mean) * 100;
  }

  // Cache management
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance
export const marketDataService = new MarketDataService(); 