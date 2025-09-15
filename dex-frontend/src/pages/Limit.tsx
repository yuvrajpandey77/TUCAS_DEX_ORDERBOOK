import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { YellowOrderForm } from '@/components/trading/yellow-order-form';
import YellowOrderBook from '@/components/YellowOrderBook';
import CandlestickChart from '@/components/CandlestickChart';
import { useYellowNetwork } from '@/components/YellowNetworkProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Zap, BarChart3, Clock, Target, Settings, Calculator } from 'lucide-react';

const Limit = () => {
  const [selectedPair] = useState('ETH/USDC');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<string>('0');
  const [showChart, setShowChart] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  const [activeTab, setActiveTab] = useState('basic');
  const { isConnected, error } = useYellowNetwork();

  // Mock data initialization
  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      const basePrice = 2000 + (Math.random() - 0.5) * 100;
      setCurrentPrice(basePrice);
      setPriceChange((Math.random() - 0.5) * 10);
      setVolume24h((Math.random() * 1000000).toLocaleString());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                Limit Orders
              </h1>
              <p className="text-muted-foreground text-lg">
                Advanced limit order trading with precise price control and execution strategies
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live Trading
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedPair}
              </Badge>
              <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>Yellow Network: {isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>

          {/* Limit Order Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Precise Pricing</p>
                    <p className="text-xs text-muted-foreground">Set exact entry/exit prices</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-500/20 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Time Control</p>
                    <p className="text-xs text-muted-foreground">Set order expiration times</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Advanced Options</p>
                    <p className="text-xs text-muted-foreground">Stop-loss, take-profit, OCO orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Price</p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${currentPrice?.toFixed(2) || '0.00'}
                    </p>
                    {priceChange !== 0 && (
                      priceChange >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold text-foreground">${volume24h}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        {showChart && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Market Chart
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {['15m', '1h', '4h', '1d'].map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                      className="h-8 px-3 text-xs"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChart(!showChart)}
                  className="h-8 w-8 p-0"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CandlestickChart 
              pair={selectedPair} 
              timeframe={timeframe}
              height={400}
            />
          </div>
        )}

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Limit Order Strategies */}
          <div className="lg:col-span-2">
            <Card className="bg-background/20 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Limit Order Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Basic Limit
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced
                    </TabsTrigger>
                    <TabsTrigger value="bracket" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Bracket Orders
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Buy Limit Order */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          Buy Limit Order
                        </h3>
                        <YellowOrderForm 
                          orderType="limit" 
                          side="buy" 
                          tradingPair={selectedPair} 
                        />
                      </div>

                      {/* Sell Limit Order */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-400" />
                          Sell Limit Order
                        </h3>
                        <YellowOrderForm 
                          orderType="limit" 
                          side="sell" 
                          tradingPair={selectedPair} 
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6">
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Limit Orders</h3>
                      <p className="text-muted-foreground mb-4">
                        Stop-limit orders, trailing stops, and conditional orders coming soon
                      </p>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="bracket" className="space-y-6">
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Bracket Orders</h3>
                      <p className="text-muted-foreground mb-4">
                        OCO (One-Cancels-Other) and bracket order strategies coming soon
                      </p>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Book & Market Data */}
          <div className="space-y-6">
            {/* Order Book */}
            <Card className="bg-background/20 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Order Book
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <YellowOrderBook selectedPair={selectedPair} />
              </CardContent>
            </Card>

            {/* Market Data */}
            <Card className="bg-background/20 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Market Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Price</span>
                  <span className={`font-mono font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${currentPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">24h Change</span>
                  <span className={`font-mono font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">24h Volume</span>
                  <span className="font-mono font-semibold text-foreground">${volume24h}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 font-medium">❌ Yellow Network Error</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Limit;