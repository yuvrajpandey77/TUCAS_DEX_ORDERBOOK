import { useState, useCallback, useEffect } from 'react';
import { useDEXStore } from '@/store/dex-store';
import { marketDataService, PriceData, MarketStats } from '@/services/market-data-service';

interface MarketData {
  lastPrice: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  volume24h: string;
  activeOrders: number;
  isPositive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Mock market data for when contract is not available
const getMockMarketData = (): MarketData => ({
  lastPrice: '1.2345',
  priceChange24h: '+0.1234',
  priceChangePercent24h: '+2.45',
  volume24h: '1.2M',
  activeOrders: 156,
  isPositive: true,
  isLoading: false,
  error: null,
  lastUpdated: new Date()
});

export const useMarketData = () => {
  const { selectedPair, isConnected, signer } = useDEXStore();
  const [marketData, setMarketData] = useState<MarketData>(getMockMarketData());

  const fetchMarketData = useCallback(async () => {
    if (!selectedPair) {
      setMarketData(prev => ({ ...prev, error: 'No trading pair selected' }));
      return;
    }

    try {
      setMarketData(prev => ({ ...prev, isLoading: true, error: null }));

      if (isConnected && signer) {
        try {
          // Get price data from market data service
          const priceData = await marketDataService.getPriceFromOrderBook(
            selectedPair.baseToken,
            selectedPair.quoteToken,
            signer
          );

          // Get market statistics
          const marketStats = await marketDataService.getMarketStats(
            selectedPair.baseToken,
            selectedPair.quoteToken,
            signer
          );

          setMarketData({
            lastPrice: priceData.price,
            priceChange24h: priceData.change24h,
            priceChangePercent24h: priceData.changePercent24h,
            volume24h: priceData.volume24h,
            activeOrders: marketStats.activeOrders,
            isPositive: parseFloat(priceData.changePercent24h) >= 0,
            isLoading: false,
            error: null,
            lastUpdated: new Date()
          });

        } catch (contractError) {
          
          const errorMessage = contractError instanceof Error ? contractError.message.toLowerCase() : '';
          let error = 'Using demo data - contract not available';
          
          if (errorMessage.includes('not deployed')) {
            error = 'DEX contract not deployed - using demo data';
          } else if (errorMessage.includes('circuit breaker')) {
            error = 'MetaMask circuit breaker active - using demo data';
          }

          setMarketData({
            ...getMockMarketData(),
            error,
            isLoading: false
          });
        }
      } else {
        // Use mock data when not connected
        setMarketData({
          ...getMockMarketData(),
          error: 'Using demo data - connect wallet for real data',
          isLoading: false
        });
      }

    } catch (error) {
      setMarketData({
        ...getMockMarketData(),
        error: error instanceof Error ? error.message : 'Failed to fetch market data',
        isLoading: false
      });
    }
  }, [selectedPair, isConnected, signer]);

  // Fetch market data on component mount and when selected pair changes
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Set up polling to refresh market data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return {
    marketData,
    fetchMarketData,
    isLoading: marketData.isLoading,
    error: marketData.error
  };
}; 