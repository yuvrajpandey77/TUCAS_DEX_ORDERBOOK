import { ethers } from 'ethers';
import { dexService } from './dex-service';

export interface PriceUpdate {
  price: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
  isPositive: boolean;
}

export interface PriceAlert {
  id: string;
  type: 'high' | 'low' | 'volatility' | 'volume';
  message: string;
  timestamp: number;
  price: string;
  threshold: string;
}

export class RealTimePriceService {
  private subscribers: Map<string, (update: PriceUpdate) => void> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private priceHistory: Map<string, PriceUpdate[]> = new Map();
  private alerts: PriceAlert[] = [];
  private readonly UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly MAX_HISTORY = 100; // Keep last 100 price points

  // Subscribe to real-time price updates
  subscribe(
    pairId: string,
    callback: (update: PriceUpdate) => void
  ): () => void {
    this.subscribers.set(pairId, callback);
    
    // Start polling if not already started
    if (!this.intervals.has(pairId)) {
      this.startPolling(pairId);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(pairId);
      if (this.subscribers.size === 0) {
        this.stopPolling(pairId);
      }
    };
  }

  // Start polling for price updates
  private startPolling(pairId: string) {
    const interval = setInterval(async () => {
      try {
        const update = await this.getLatestPrice(pairId);
        if (update) {
          // Store in history
          const history = this.priceHistory.get(pairId) || [];
          history.push(update);
          if (history.length > this.MAX_HISTORY) {
            history.shift();
          }
          this.priceHistory.set(pairId, history);
          
          // Notify subscribers
          const callback = this.subscribers.get(pairId);
          if (callback) {
            callback(update);
          }
          
          // Check for alerts
          this.checkAlerts(pairId, update);
        }
      } catch (error) {
        console.error('Error polling price updates:', error);
      }
    }, this.UPDATE_INTERVAL);
    
    this.intervals.set(pairId, interval);
  }

  // Stop polling for price updates
  private stopPolling(pairId: string) {
    const interval = this.intervals.get(pairId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(pairId);
    }
  }

  // Get latest price from order book
  private async getLatestPrice(pairId: string): Promise<PriceUpdate | null> {
    try {
      // Parse pair ID to get token addresses
      const [baseToken, quoteToken] = pairId.split('-');
      
      // For demo purposes, we'll simulate price updates
      // In a real implementation, you would fetch from the order book
      const basePrice = 1.2345;
      const randomChange = (Math.random() - 0.5) * 0.02; // ±1% change
      const currentPrice = basePrice + randomChange;
      
      const priceChange = randomChange;
      const priceChangePercent = (priceChange / basePrice * 100).toFixed(2);
      const isPositive = priceChange >= 0;
      
      // Simulate volume
      const volume = (Math.random() * 1000000 + 500000).toFixed(0);
      const volumeFormatted = parseFloat(volume) > 1000000 
        ? `${(parseFloat(volume) / 1000000).toFixed(1)}M`
        : `${(parseFloat(volume) / 1000).toFixed(1)}K`;
      
      return {
        price: currentPrice.toFixed(4),
        change24h: priceChange.toFixed(4),
        changePercent24h: `${isPositive ? '+' : ''}${priceChangePercent}`,
        volume24h: volumeFormatted,
        high24h: (currentPrice * 1.02).toFixed(4),
        low24h: (currentPrice * 0.98).toFixed(4),
        timestamp: Date.now(),
        isPositive
      };
    } catch (error) {
      console.error('Error getting latest price:', error);
      return null;
    }
  }

  // Check for price alerts
  private checkAlerts(pairId: string, update: PriceUpdate) {
    const history = this.priceHistory.get(pairId) || [];
    if (history.length < 2) return;
    
    const currentPrice = parseFloat(update.price);
    const previousPrice = parseFloat(history[history.length - 2].price);
    const priceChange = Math.abs(currentPrice - previousPrice) / previousPrice;
    
    // High volatility alert
    if (priceChange > 0.05) { // 5% change
      this.addAlert({
        id: `volatility-${Date.now()}`,
        type: 'volatility',
        message: `High volatility detected: ${(priceChange * 100).toFixed(2)}% change`,
        timestamp: Date.now(),
        price: update.price,
        threshold: '5%'
      });
    }
    
    // High price alert
    if (currentPrice > 1.5) {
      this.addAlert({
        id: `high-${Date.now()}`,
        type: 'high',
        message: 'Price reached 24h high',
        timestamp: Date.now(),
        price: update.price,
        threshold: '1.5'
      });
    }
    
    // Low price alert
    if (currentPrice < 1.0) {
      this.addAlert({
        id: `low-${Date.now()}`,
        type: 'low',
        message: 'Price reached 24h low',
        timestamp: Date.now(),
        price: update.price,
        threshold: '1.0'
      });
    }
  }

  // Add price alert
  private addAlert(alert: PriceAlert) {
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
    
    // Notify subscribers about the alert
    this.subscribers.forEach((callback, pairId) => {
      // You could emit alert events here
      console.log('Price alert:', alert);
    });
  }

  // Get price history for a pair
  getPriceHistory(pairId: string, hours: number = 24): PriceUpdate[] {
    const history = this.priceHistory.get(pairId) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return history.filter(update => update.timestamp >= cutoff);
  }

  // Get recent alerts
  getRecentAlerts(minutes: number = 60): PriceAlert[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  // Get price statistics
  getPriceStats(pairId: string): {
    averagePrice: string;
    volatility: string;
    totalVolume: string;
    priceRange: { high: string; low: string };
  } {
    const history = this.priceHistory.get(pairId) || [];
    if (history.length === 0) {
      return {
        averagePrice: '0.0000',
        volatility: '0.00',
        totalVolume: '0',
        priceRange: { high: '0.0000', low: '0.0000' }
      };
    }
    
    const prices = history.map(update => parseFloat(update.price));
    const averagePrice = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(4);
    
    // Calculate volatility
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const volatility = (Math.sqrt(variance) / mean * 100).toFixed(2);
    
    // Calculate volume
    const totalVolume = history.reduce((sum, update) => {
      const volume = parseFloat(update.volume24h.replace(/[KM]/g, ''));
      const multiplier = update.volume24h.includes('M') ? 1000000 : 1000;
      return sum + (volume * multiplier);
    }, 0);
    
    const priceRange = {
      high: Math.max(...prices).toFixed(4),
      low: Math.min(...prices).toFixed(4)
    };
    
    return {
      averagePrice,
      volatility: `${volatility}%`,
      totalVolume: this.formatVolume(totalVolume),
      priceRange
    };
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

  // Clear all data
  clear() {
    this.subscribers.clear();
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.priceHistory.clear();
    this.alerts = [];
  }
}

// Create singleton instance
export const realTimePriceService = new RealTimePriceService(); 