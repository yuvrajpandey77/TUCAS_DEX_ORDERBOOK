import { useState, useCallback, useEffect, useRef } from 'react';
import { useDEXStore } from '@/store/dex-store';
import { dexService } from '@/services/dex-service';
import { ethers } from 'ethers';

interface OrderBookOrder {
  id: string;
  price: string;
  amount: string;
  total: string;
  isBuy: boolean;
  isActive: boolean;
  timestamp: number;
  trader: string;
  baseToken: string;
  quoteToken: string;
}

interface OrderBookData {
  buyOrders: OrderBookOrder[];
  sellOrders: OrderBookOrder[];
}

// Enhanced mock data generator with realistic trading patterns
const getMockOrderBook = (baseToken: string, quoteToken: string): OrderBookData => {
  const basePrice = 1.2345; // Realistic base price
  const spread = 0.05; // 5% spread for more realistic trading
  
  // Add more dynamic price variation based on current time
  const timeVariation = (Date.now() % 60000) / 60000; // 0-1 over 1 minute
  const dynamicBasePrice = basePrice + (timeVariation - 0.5) * 0.02; // ±1% variation over time
  
  const buyOrders: OrderBookOrder[] = [];
  const sellOrders: OrderBookOrder[] = [];
  
  // Generate realistic buy orders (below market price)
  for (let i = 0; i < 8; i++) {
    const priceVariation = (Math.random() - 0.5) * 0.03; // ±1.5% variation
    const timeBasedVariation = Math.sin(Date.now() / 1000 + i) * 0.01; // Time-based sine wave
    const price = dynamicBasePrice - (spread * (i + 1) * 0.1) + priceVariation + timeBasedVariation;
    const amount = 0.5 + (Math.random() * 2.5) + (Math.random() * 0.5); // More varied amounts
    const total = price * amount;
    
    buyOrders.push({
      id: `buy-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      price: price.toFixed(4),
      amount: amount.toFixed(4),
      total: total.toFixed(2),
      isBuy: true,
      isActive: true,
      timestamp: Date.now() - (i * 15000), // More frequent updates (15 seconds apart)
      trader: `0x${Math.random().toString(16).slice(2, 42)}`,
      baseToken,
      quoteToken,
    });
  }
  
  // Generate realistic sell orders (above market price)
  for (let i = 0; i < 8; i++) {
    const priceVariation = (Math.random() - 0.5) * 0.03; // ±1.5% variation
    const timeBasedVariation = Math.sin(Date.now() / 1000 + i + 10) * 0.01; // Different phase
    const price = dynamicBasePrice + (spread * (i + 1) * 0.1) + priceVariation + timeBasedVariation;
    const amount = 0.3 + (Math.random() * 1.8) + (Math.random() * 0.3); // More varied amounts
    const total = price * amount;
    
    sellOrders.push({
      id: `sell-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      price: price.toFixed(4),
      amount: amount.toFixed(4),
      total: total.toFixed(2),
      isBuy: false,
      isActive: true,
      timestamp: Date.now() - (i * 15000), // More frequent updates (15 seconds apart)
      trader: `0x${Math.random().toString(16).slice(2, 42)}`,
      baseToken,
      quoteToken,
    });
  }
  
  return {
    buyOrders: buyOrders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
    sellOrders: sellOrders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
  };
};

export const useOrderBook = () => {
  const { selectedPair, isConnected, signer, userOrders } = useDEXStore();
  const [orderBookData, setOrderBookData] = useState<OrderBookData>({
    buyOrders: [],
    sellOrders: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<string>('0');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to integrate user orders into the order book
  const integrateUserOrders = useCallback((baseOrderBook: OrderBookData) => {
    if (!userOrders || userOrders.length === 0) {
      return baseOrderBook;
    }

    const userBuyOrders: OrderBookOrder[] = [];
    const userSellOrders: OrderBookOrder[] = [];

    // Process user orders
    userOrders.forEach((userOrder) => {
      if (userOrder.isActive && 
          userOrder.baseToken === selectedPair?.baseToken && 
          userOrder.quoteToken === selectedPair?.quoteToken) {
        
        const orderBookOrder: OrderBookOrder = {
          id: userOrder.id,
          price: ethers.formatEther(userOrder.price),
          amount: ethers.formatEther(userOrder.amount),
          total: (parseFloat(ethers.formatEther(userOrder.price)) * parseFloat(ethers.formatEther(userOrder.amount))).toFixed(2),
          isBuy: userOrder.isBuy,
          isActive: userOrder.isActive,
          timestamp: userOrder.timestamp,
          trader: userOrder.trader,
          baseToken: userOrder.baseToken,
          quoteToken: userOrder.quoteToken,
        };

        if (userOrder.isBuy) {
          userBuyOrders.push(orderBookOrder);
        } else {
          userSellOrders.push(orderBookOrder);
        }
      }
    });

    // Merge user orders with base order book
    const mergedBuyOrders = [...baseOrderBook.buyOrders, ...userBuyOrders]
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, 10); // Keep top 10

    const mergedSellOrders = [...baseOrderBook.sellOrders, ...userSellOrders]
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      .slice(0, 10); // Keep top 10

    return {
      buyOrders: mergedBuyOrders,
      sellOrders: mergedSellOrders
    };
  }, [userOrders, selectedPair]);

  const fetchOrderBook = useCallback(async () => {
    if (!selectedPair) {
      setError('Please select a trading pair');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let orderBook: OrderBookData;

      // Try to fetch from smart contract if connected
      if (isConnected && signer) {
        try {
          console.log('Fetching order book from smart contract...');
          await dexService.initialize(signer);
          
          // Check if contract is deployed
          const isDeployed = await dexService.isContractDeployed();
          if (!isDeployed) {
            throw new Error('DEX contract is not deployed');
          }
          
          const contractOrderBook = await dexService.getOrderBook(
            selectedPair.baseToken,
            selectedPair.quoteToken
          );

          console.log('Raw order book data:', contractOrderBook);

          // Process and format the orders with proper error handling
          const processedBuyOrders = contractOrderBook.buyOrders
            .filter((order: OrderBookOrder) => {
              try {
                return order.isActive && 
                       parseFloat(order.amount) > 0 && 
                       parseFloat(order.price) > 0;
              } catch {
                return false;
              }
            })
            .map((order: OrderBookOrder) => {
              try {
                const price = ethers.formatEther(order.price);
                const amount = ethers.formatEther(order.amount);
                const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
                
                return {
                  ...order,
                  price,
                  amount,
                  total
                };
              } catch (error) {
                console.error('Error processing buy order:', error);
                return null;
              }
            })
            .filter(Boolean)
            .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
            .slice(0, 10);

          const processedSellOrders = contractOrderBook.sellOrders
            .filter((order: OrderBookOrder) => {
              try {
                return order.isActive && 
                       parseFloat(order.amount) > 0 && 
                       parseFloat(order.price) > 0;
              } catch {
                return false;
              }
            })
            .map((order: OrderBookOrder) => {
              try {
                const price = ethers.formatEther(order.price);
                const amount = ethers.formatEther(order.amount);
                const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
                
                return {
                  ...order,
                  price,
                  amount,
                  total
                };
              } catch (error) {
                console.error('Error processing sell order:', error);
                return null;
              }
            })
            .filter(Boolean)
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, 10);

          orderBook = {
            buyOrders: processedBuyOrders,
            sellOrders: processedSellOrders
          };

          setIsUsingMockData(false);
          console.log('Processed order book data:', orderBook);

        } catch (contractError) {
          console.error('Contract fetch failed, using enhanced mock data:', contractError);
          
          // Use enhanced mock data when contract is not available
          orderBook = getMockOrderBook(selectedPair.baseToken, selectedPair.quoteToken);
          setIsUsingMockData(true);
          
          // Don't show error for demo mode - just use mock data silently
          setError(null);
        }
      } else {
        // Use enhanced mock data when not connected
        orderBook = getMockOrderBook(selectedPair.baseToken, selectedPair.quoteToken);
        setIsUsingMockData(true);
        setError(null); // Don't show error for demo mode
      }

      // Integrate user orders into the order book
      const finalOrderBook = integrateUserOrders(orderBook);
      setOrderBookData(finalOrderBook);

      // Calculate last price (midpoint between best buy and sell)
      if (finalOrderBook.buyOrders.length > 0 && finalOrderBook.sellOrders.length > 0) {
        const bestBuyPrice = parseFloat(finalOrderBook.buyOrders[0].price);
        const bestSellPrice = parseFloat(finalOrderBook.sellOrders[0].price);
        const midPrice = ((bestBuyPrice + bestSellPrice) / 2).toFixed(4);
        setLastPrice(midPrice);
      } else if (finalOrderBook.buyOrders.length > 0) {
        setLastPrice(finalOrderBook.buyOrders[0].price);
      } else if (finalOrderBook.sellOrders.length > 0) {
        setLastPrice(finalOrderBook.sellOrders[0].price);
      } else {
        setLastPrice('0.0000');
      }

      setLastUpdate(Date.now());

    } catch (err) {
      console.error('Error fetching order book:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order book');
      // Fallback to mock data
      const mockData = getMockOrderBook(selectedPair.baseToken, selectedPair.quoteToken);
      const finalMockData = integrateUserOrders(mockData);
      setOrderBookData(finalMockData);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPair, isConnected, signer, integrateUserOrders]);

  // Fetch order book on component mount and when selected pair changes
  useEffect(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  // Set up faster polling to refresh order book every 1.5 seconds for real-time feel
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval with faster updates
    if (selectedPair) {
      intervalRef.current = setInterval(() => {
        fetchOrderBook();
      }, 1500); // 1.5 seconds for more responsive updates
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedPair, fetchOrderBook]);

  return {
    orderBookData,
    isLoading,
    error,
    lastPrice,
    lastUpdate,
    fetchOrderBook,
    isUsingMockData,
  };
}; 