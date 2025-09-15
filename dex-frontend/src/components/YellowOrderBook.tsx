import { useState, useEffect } from 'react';
import { yellowNetworkService } from '@/services/yellow-network-service';
import { useYellowNetwork } from '@/components/YellowNetworkProvider';
import { OrderBook } from '@/config/yellow-network';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Globe, Shield } from 'lucide-react';

interface YellowOrderBookProps {
  selectedPair: string;
}

const YellowOrderBook = ({ selectedPair }: YellowOrderBookProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [orderBook, setOrderBook] = useState<OrderBook>({
    pair: selectedPair,
    buyOrders: [],
    sellOrders: [],
    lastUpdate: 0,
    totalBidVolume: '0',
    totalAskVolume: '0',
    bestBid: '0',
    bestAsk: '0',
    spread: '0',
  });
  
  const { isConnected } = useYellowNetwork();

  // Initialize with mock data
  useEffect(() => {
    const mockOrderBook: OrderBook = {
      pair: selectedPair,
      buyOrders: [
        { id: '1', pair: selectedPair, side: 'buy', type: 'limit', amount: '1.5', price: '1950', status: 'pending', createdAt: Date.now(), trader: '0xTrader1', stateChannelId: 'mock-channel-1' },
        { id: '2', pair: selectedPair, side: 'buy', type: 'limit', amount: '2.0', price: '1940', status: 'pending', createdAt: Date.now(), trader: '0xTrader2', stateChannelId: 'mock-channel-1' },
        { id: '3', pair: selectedPair, side: 'buy', type: 'limit', amount: '1.0', price: '1930', status: 'pending', createdAt: Date.now(), trader: '0xTrader3', stateChannelId: 'mock-channel-1' },
        { id: '4', pair: selectedPair, side: 'buy', type: 'limit', amount: '3.0', price: '1920', status: 'pending', createdAt: Date.now(), trader: '0xTrader4', stateChannelId: 'mock-channel-1' },
      ],
      sellOrders: [
        { id: '5', pair: selectedPair, side: 'sell', type: 'limit', amount: '1.0', price: '2000', status: 'pending', createdAt: Date.now(), trader: '0xTrader5', stateChannelId: 'mock-channel-1' },
        { id: '6', pair: selectedPair, side: 'sell', type: 'limit', amount: '1.5', price: '2010', status: 'pending', createdAt: Date.now(), trader: '0xTrader6', stateChannelId: 'mock-channel-1' },
        { id: '7', pair: selectedPair, side: 'sell', type: 'limit', amount: '2.0', price: '2020', status: 'pending', createdAt: Date.now(), trader: '0xTrader7', stateChannelId: 'mock-channel-1' },
        { id: '8', pair: selectedPair, side: 'sell', type: 'limit', amount: '1.0', price: '2030', status: 'pending', createdAt: Date.now(), trader: '0xTrader8', stateChannelId: 'mock-channel-1' },
      ],
      lastUpdate: Date.now(),
      totalBidVolume: '7.5',
      totalAskVolume: '5.5',
      bestBid: '1950',
      bestAsk: '2000',
      spread: '50',
    };
    
    setOrderBook(mockOrderBook);
  }, [selectedPair]);

  // Load order book data
  const loadOrderBook = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const data = await yellowNetworkService.getOrderBook(selectedPair);
      setOrderBook(data);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to load order book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = yellowNetworkService.subscribeToOrderBook(selectedPair, (updatedOrderBook) => {
      setOrderBook(updatedOrderBook);
      setLastUpdate(Date.now());
    });

    // Load initial data
    loadOrderBook();

    return unsubscribe;
  }, [selectedPair, isConnected]);

  // Format price for display
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (num >= 1) {
      return num.toFixed(2);
    } else {
      return num.toFixed(6);
    }
  };

  // Format amount for display
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(2);
    }
  };

  // Calculate spread percentage
  const spreadPercentage = orderBook.bestBid !== '0' && orderBook.bestAsk !== '0' 
    ? ((parseFloat(orderBook.bestAsk) - parseFloat(orderBook.bestBid)) / parseFloat(orderBook.bestBid)) * 100
    : 0;

  return (
    <div className="yellow-orderbook w-full bg-background backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold">Yellow Network Order Book</span>
          </div>
          <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {selectedPair}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadOrderBook}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="divide-y divide-white/10">
        {/* Sell Orders (Asks) */}
        <div className="space-y-1 p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Price ({selectedPair.split('/')[1]})</span>
            <span>Amount ({selectedPair.split('/')[0]})</span>
            <span>Total</span>
          </div>
          
          {orderBook.sellOrders.length > 0 ? (
            orderBook.sellOrders.slice(0, 8).map((order, index) => (
              <div
                key={order.id}
                className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/5 transition-colors"
                style={{
                  background: `linear-gradient(to right, rgba(239, 68, 68, 0.1) ${(index / 8) * 100}%, transparent ${(index / 8) * 100}%)`
                }}
              >
                <span className="text-red-400 font-mono text-sm">
                  {formatPrice(order.price)}
                </span>
                <span className="text-foreground font-mono text-sm">
                  {formatAmount(order.amount)}
                </span>
                <span className="text-muted-foreground font-mono text-sm">
                  {formatAmount((parseFloat(order.price) * parseFloat(order.amount)).toString())}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sell orders available</p>
              <p className="text-xs">Orders will appear here when available</p>
            </div>
          )}
        </div>

        {/* Spread Information */}
        <div className="px-4 py-3 bg-muted/20 border-y border-white/10">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Spread:</span>
              <span className="font-mono">
                {orderBook.bestBid !== '0' && orderBook.bestAsk !== '0' 
                  ? `${formatPrice(orderBook.bestBid)} - ${formatPrice(orderBook.bestAsk)}`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="text-muted-foreground">
              {spreadPercentage > 0 ? `${spreadPercentage.toFixed(2)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div className="space-y-1 p-4">
          {orderBook.buyOrders.length > 0 ? (
            orderBook.buyOrders.slice(0, 8).map((order, index) => (
              <div
                key={order.id}
                className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/5 transition-colors"
                style={{
                  background: `linear-gradient(to right, rgba(34, 197, 94, 0.1) ${(index / 8) * 100}%, transparent ${(index / 8) * 100}%)`
                }}
              >
                <span className="text-green-400 font-mono text-sm">
                  {formatPrice(order.price)}
                </span>
                <span className="text-foreground font-mono text-sm">
                  {formatAmount(order.amount)}
                </span>
                <span className="text-muted-foreground font-mono text-sm">
                  {formatAmount((parseFloat(order.price) * parseFloat(order.amount)).toString())}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No buy orders available</p>
              <p className="text-xs">Orders will appear here when available</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-muted/10">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Total Bid: {formatAmount(orderBook.totalBidVolume)}</span>
            <span>Total Ask: {formatAmount(orderBook.totalAskVolume)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span>Last update: {new Date(lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YellowOrderBook;
