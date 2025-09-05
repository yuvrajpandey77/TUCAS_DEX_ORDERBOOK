import { useState, useEffect, useCallback } from 'react';
import { useDEXStore } from '@/store/dex-store';
import { realTimePriceService, PriceUpdate, PriceAlert } from '@/services/real-time-price-service';

export const useRealTimePrice = () => {
  const { selectedPair, isConnected } = useDEXStore();
  const [currentPrice, setCurrentPrice] = useState<PriceUpdate | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceUpdate[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<PriceAlert[]>([]);
  const [priceStats, setPriceStats] = useState<{
    averagePrice: string;
    volatility: string;
    totalVolume: string;
    priceRange: { high: string; low: string };
  } | null>(null);

  // Get pair ID from selected pair
  const getPairId = useCallback(() => {
    if (!selectedPair) return null;
    return `${selectedPair.baseToken}-${selectedPair.quoteToken}`;
  }, [selectedPair]);

  // Subscribe to real-time price updates
  useEffect(() => {
    const pairId = getPairId();
    if (!pairId || !isConnected) {
      setCurrentPrice(null);
      setPriceHistory([]);
      setRecentAlerts([]);
      setPriceStats(null);
      return;
    }

    // Subscribe to price updates
    const unsubscribe = realTimePriceService.subscribe(pairId, (update: PriceUpdate) => {
      setCurrentPrice(update);
      
      // Update price history
      const history = realTimePriceService.getPriceHistory(pairId, 24);
      setPriceHistory(history);
      
      // Update price stats
      const stats = realTimePriceService.getPriceStats(pairId);
      setPriceStats(stats);
    });

    // Get initial data
    const history = realTimePriceService.getPriceHistory(pairId, 24);
    setPriceHistory(history);
    
    const stats = realTimePriceService.getPriceStats(pairId);
    setPriceStats(stats);

    // Set up alert polling
    const alertInterval = setInterval(() => {
      const alerts = realTimePriceService.getRecentAlerts(60);
      setRecentAlerts(alerts);
    }, 10000); // Check for alerts every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(alertInterval);
    };
  }, [getPairId, isConnected]);

  // Get price change direction
  const getPriceChangeDirection = useCallback(() => {
    if (!currentPrice) return 'neutral';
    return currentPrice.isPositive ? 'up' : 'down';
  }, [currentPrice]);

  // Get formatted price change
  const getFormattedPriceChange = useCallback(() => {
    if (!currentPrice) return { change: '0.00', percent: '0.00%' };
    
    return {
      change: currentPrice.change24h,
      percent: currentPrice.changePercent24h
    };
  }, [currentPrice]);

  // Get price trend (simplified)
  const getPriceTrend = useCallback(() => {
    if (priceHistory.length < 2) return 'neutral';
    
    const recent = priceHistory.slice(-5);
    const prices = recent.map(update => parseFloat(update.price));
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    
    if (change > 0.01) return 'up';
    if (change < -0.01) return 'down';
    return 'neutral';
  }, [priceHistory]);

  // Get volatility level
  const getVolatilityLevel = useCallback(() => {
    if (!priceStats) return 'low';
    
    const volatility = parseFloat(priceStats.volatility.replace('%', ''));
    
    if (volatility > 10) return 'high';
    if (volatility > 5) return 'medium';
    return 'low';
  }, [priceStats]);

  // Get volume trend
  const getVolumeTrend = useCallback(() => {
    if (priceHistory.length < 2) return 'neutral';
    
    const recent = priceHistory.slice(-3);
    const volumes = recent.map(update => {
      const volume = update.volume24h.replace(/[KM]/g, '');
      const multiplier = update.volume24h.includes('M') ? 1000000 : 1000;
      return parseFloat(volume) * multiplier;
    });
    
    const firstVolume = volumes[0];
    const lastVolume = volumes[volumes.length - 1];
    const change = lastVolume - firstVolume;
    
    if (change > firstVolume * 0.1) return 'up';
    if (change < -firstVolume * 0.1) return 'down';
    return 'neutral';
  }, [priceHistory]);

  // Check if price is at extreme levels
  const isPriceAtExtreme = useCallback(() => {
    if (!currentPrice || !priceStats) return false;
    
    const current = parseFloat(currentPrice.price);
    const high = parseFloat(priceStats.priceRange.high);
    const low = parseFloat(priceStats.priceRange.low);
    
    const range = high - low;
    const threshold = range * 0.1; // 10% of range
    
    return current >= (high - threshold) || current <= (low + threshold);
  }, [currentPrice, priceStats]);

  // Get market sentiment
  const getMarketSentiment = useCallback(() => {
    const trend = getPriceTrend();
    const volatility = getVolatilityLevel();
    const volumeTrend = getVolumeTrend();
    const isExtreme = isPriceAtExtreme();
    
    if (trend === 'up' && volumeTrend === 'up' && volatility === 'medium') {
      return 'bullish';
    } else if (trend === 'down' && volumeTrend === 'up' && volatility === 'high') {
      return 'bearish';
    } else if (isExtreme) {
      return 'extreme';
    } else {
      return 'neutral';
    }
  }, [getPriceTrend, getVolatilityLevel, getVolumeTrend, isPriceAtExtreme]);

  return {
    currentPrice,
    priceHistory,
    recentAlerts,
    priceStats,
    getPriceChangeDirection,
    getFormattedPriceChange,
    getPriceTrend,
    getVolatilityLevel,
    getVolumeTrend,
    isPriceAtExtreme,
    getMarketSentiment,
    isConnected
  };
}; 