import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LimitOrderCard from '@/components/LimitOrderCard';
import OrderBook from '@/components/OrderBook';
import UserOrders from '@/components/UserOrders';
import DebugPanel from '@/components/DebugPanel';
import ContractStatus from '@/components/ContractStatus';
import TradingPairSelector from '@/components/TradingPairSelector';

import SecurityAudit from '@/components/SecurityAudit';
import FloatingOrbs from '@/components/FloatingOrbs';
import { useDEXStore } from '@/store/dex-store';
import { useMarketData } from '@/hooks/use-market-data';
import { useRealTimePrice } from '@/hooks/use-real-time-price';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3 } from 'lucide-react';

const Limit = () => {
  const { selectedPair, setSelectedPair, tradingPairs } = useDEXStore();
  const { marketData, isLoading: marketDataLoading } = useMarketData();
  const { 
    currentPrice, 
    priceStats, 
    getPriceChangeDirection, 
    getFormattedPriceChange,
    getMarketSentiment,
    isPriceAtExtreme 
  } = useRealTimePrice();

  // Initialize trading pair if not selected
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0]);
    }
  }, [selectedPair, setSelectedPair, tradingPairs]);

  // Add console log to verify page is loading
  useEffect(() => {
    console.log('Limit page loaded successfully');
    console.log('Selected pair:', selectedPair);
  }, [selectedPair]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Orbs */}
      <FloatingOrbs />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 font-heading">Limit Trading</h1>
              <p className="text-sm text-muted-foreground">
                Place limit orders with precise price control
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live Trading
              </Badge>
              {selectedPair && (
                <Badge variant="outline" className="text-xs">
                  {selectedPair.baseTokenSymbol}/{selectedPair.quoteTokenSymbol}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Card className="card-glass border-border/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Last Price</p>
                  {currentPrice ? (
                    <div className="flex items-center space-x-2">
                      <p className={`text-lg font-bold ${currentPrice.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        ${currentPrice.price}
                      </p>
                      {isPriceAtExtreme() && (
                        <Badge variant="destructive" className="text-xs">EXTREME</Badge>
                      )}
                    </div>
                  ) : marketDataLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-green-400">${marketData.lastPrice}</p>
                  )}
                </div>
                {currentPrice ? (
                  getPriceChangeDirection() === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-glass border-border/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  {currentPrice ? (
                    <div className="flex items-center space-x-2">
                      <p className={`text-lg font-bold ${currentPrice.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {getFormattedPriceChange().percent}
                      </p>
                      <Badge 
                        variant={getMarketSentiment() === 'bullish' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {getMarketSentiment().toUpperCase()}
                      </Badge>
                    </div>
                  ) : marketDataLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <p className={`text-lg font-bold ${marketData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {marketData.priceChangePercent24h}%
                    </p>
                  )}
                </div>
                {currentPrice ? (
                  getPriceChangeDirection() === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )
                ) : marketDataLoading ? (
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                ) : (
                  marketData.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-glass border-border/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  {currentPrice ? (
                    <p className="text-lg font-bold text-foreground">${currentPrice.volume24h}</p>
                  ) : marketDataLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-foreground">${marketData.volume24h}</p>
                  )}
                </div>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-glass border-border/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Orders</p>
                  {marketDataLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-foreground">{marketData.activeOrders}</p>
                  )}
                </div>
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Trading Interface - Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column - Compact Trading Interface (3 columns) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Contract Status - Compact */}
            <div className="h-100">
              <ContractStatus />
            </div>
            
            {/* Trading Pair Selector - With all sections */}
            <div className="h-100 ">
              <TradingPairSelector />
            </div>
            
            {/* Security Audit - Below Trading Pair Selector */}
            <div className="h-32">
              <SecurityAudit />
            </div>
          </div>

          {/* Center Column - Limit Order (5 columns) */}
          <div className="lg:col-span-5">
            <LimitOrderCard />
          </div>

          {/* Right Column - Order Book (4 columns) */}
          <div className="lg:col-span-4">
            <OrderBook />
          </div>
        </div>

        {/* Bottom Section - User Orders Full Width */}
        <div className="mt-6">
          {/* User Orders - Full Width */}
          <div className="w-full">
            <UserOrders />
          </div>
        </div>

        {/* Additional Security Section */}
        <div className="mt-6">
          <DebugPanel />
        </div>

        {/* Trading Statistics & Market Depth */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trading Statistics */}
          <Card className="card-glass border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                Trading Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-accent/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                  <p className="text-sm font-semibold text-foreground">1,234</p>
                </div>
                <div className="p-2 bg-accent/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-semibold text-green-400">98.5%</p>
                </div>
                <div className="p-2 bg-accent/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Fill Time</p>
                  <p className="text-sm font-semibold text-foreground">2.3s</p>
                </div>
                <div className="p-2 bg-accent/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Min Order Size</p>
                  <p className="text-sm font-semibold text-foreground">0.001</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Depth Chart Placeholder */}
          <Card className="card-glass border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                Market Depth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-accent/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Market depth chart</p>
                  <p className="text-xs">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Information */}
        <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-border/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Trading Features</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Limit orders with precise price control</li>
                <li>• Real-time order book updates</li>
                <li>• Order cancellation and management</li>
                <li>• Secure wallet integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Security</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Smart contract audited</li>
                <li>• Non-custodial trading</li>
                <li>• Transparent order matching</li>
                <li>• Gas fee optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Support</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 24/7 trading availability</li>
                <li>• Real-time market data</li>
                <li>• Advanced order types</li>
                <li>• Professional trading tools</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Limit;