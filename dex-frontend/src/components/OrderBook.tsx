import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDEXStore } from '@/store/dex-store';
import { useOrderBook } from '@/hooks/use-order-book';
import { RefreshCw, AlertCircle, Info, TrendingUp, TrendingDown, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OrderBook = () => {
  const { selectedPair, userOrders } = useDEXStore();
  const { orderBookData, isLoading, error, lastPrice, fetchOrderBook, isUsingMockData } = useOrderBook();

  const handleRefresh = () => {
    fetchOrderBook();
  };

  // Check if an order is a user order
  const isUserOrder = (orderId: string) => {
    return userOrders.some(userOrder => userOrder.id === orderId);
  };

  // Calculate spread and depth
  const calculateSpread = () => {
    if (orderBookData.sellOrders.length > 0 && orderBookData.buyOrders.length > 0) {
      const lowestAsk = parseFloat(orderBookData.sellOrders[0].price);
      const highestBid = parseFloat(orderBookData.buyOrders[0].price);
      const spread = lowestAsk - highestBid;
      const spreadPercentage = (spread / lowestAsk) * 100;
      return { spread: spread.toFixed(4), percentage: spreadPercentage.toFixed(2) };
    }
    return null;
  };

  const spread = calculateSpread();

  // Show loading state while no trading pair is selected
  if (!selectedPair) {
    return (
      <Card className="w-full card-glass border-border/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
            Order Book
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full card-glass border-border/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Order Book
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {selectedPair.baseTokenSymbol}/{selectedPair.quoteTokenSymbol}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-6">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrderBook}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Market Stats */}
            <div className="p-4 border-b border-border/20 bg-accent/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Last Price</p>
                  <p className="text-lg font-bold text-green-400">
                    {isLoading ? (
                      <div className="h-6 bg-muted animate-pulse rounded"></div>
                    ) : (
                      `$${parseFloat(lastPrice).toFixed(4)}`
                    )}
                  </p>
                </div>
                {spread && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Spread</p>
                    <p className="text-sm font-semibold text-foreground">
                      ${spread.spread} ({spread.percentage}%)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-3 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/20 bg-accent/5">
              <div className="flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-red-400" />
                Price ({selectedPair.quoteTokenSymbol})
              </div>
              <div className="text-right flex items-center justify-end">
                <BarChart3 className="h-3 w-3 mr-1 text-blue-400" />
                Amount ({selectedPair.baseTokenSymbol})
              </div>
              <div className="text-right flex items-center justify-end">
                <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                Total ({selectedPair.quoteTokenSymbol})
              </div>
            </div>

            {/* Sell Orders */}
            <div className="px-6 py-3">
              <div className="text-xs text-red-400 mb-3 font-medium flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                SELL ORDERS ({orderBookData.sellOrders.length})
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 py-1">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : orderBookData.sellOrders.length > 0 ? (
                <div className="space-y-1">
                  {orderBookData.sellOrders.slice(0, 6).map((order, index) => {
                    const isUser = isUserOrder(order.id);
                    return (
                      <div 
                        key={order.id || index} 
                        className={`grid grid-cols-3 gap-4 py-1.5 text-sm hover:bg-red-500/10 transition-colors cursor-pointer group ${
                          isUser ? 'bg-red-500/5 border-l-2 border-red-400' : ''
                        }`}
                      >
                        <div className="text-red-400 font-mono font-medium group-hover:text-red-300 flex items-center">
                          ${parseFloat(order.price).toFixed(4)}
                          {isUser && <User className="h-3 w-3 ml-1 text-blue-400" />}
                        </div>
                        <div className="text-right text-foreground font-mono group-hover:text-foreground/80">
                          {parseFloat(order.amount).toFixed(4)}
                        </div>
                        <div className="text-right text-muted-foreground font-mono group-hover:text-muted-foreground/80">
                          ${parseFloat(order.total).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No sell orders available
                </div>
              )}
            </div>

            {/* Current Price Highlight */}
            <div className="px-6 py-4 border-y border-border/20 bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground font-mono">
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `$${parseFloat(lastPrice).toFixed(4)}`
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Current Market Price</div>
              </div>
            </div>

            {/* Buy Orders */}
            <div className="px-6 py-3">
              <div className="text-xs text-green-400 mb-3 font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                BUY ORDERS ({orderBookData.buyOrders.length})
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 py-1">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : orderBookData.buyOrders.length > 0 ? (
                <div className="space-y-1">
                  {orderBookData.buyOrders.slice(0, 6).map((order, index) => {
                    const isUser = isUserOrder(order.id);
                    return (
                      <div 
                        key={order.id || index} 
                        className={`grid grid-cols-3 gap-4 py-1.5 text-sm hover:bg-green-500/10 transition-colors cursor-pointer group ${
                          isUser ? 'bg-green-500/5 border-l-2 border-green-400' : ''
                        }`}
                      >
                        <div className="text-green-400 font-mono font-medium group-hover:text-green-300 flex items-center">
                          ${parseFloat(order.price).toFixed(4)}
                          {isUser && <User className="h-3 w-3 ml-1 text-blue-400" />}
                        </div>
                        <div className="text-right text-foreground font-mono group-hover:text-foreground/80">
                          {parseFloat(order.amount).toFixed(4)}
                        </div>
                        <div className="text-right text-muted-foreground font-mono group-hover:text-muted-foreground/80">
                          ${parseFloat(order.total).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No buy orders available
                </div>
              )}
            </div>

            {/* Market Depth Summary */}
            <div className="p-4 bg-accent/10 border-t border-border/20">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Total Sell Volume</p>
                  <p className="font-semibold text-foreground">
                    {orderBookData.sellOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0).toFixed(4)} {selectedPair.baseTokenSymbol}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Buy Volume</p>
                  <p className="font-semibold text-foreground">
                    {orderBookData.buyOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0).toFixed(4)} {selectedPair.baseTokenSymbol}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderBook;