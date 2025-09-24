import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import LimitOrderCard from '@/components/LimitOrderCard';
import CandlestickChart from '@/components/CandlestickChart';
import { POOL_ADDRESSES } from '@/config/uniswap-v3';
import { useYellowNetwork } from '@/components/YellowNetworkProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, BarChart3, Clock, Target, Settings } from 'lucide-react';

const Limit = () => {
  const [selectedPair] = useState('ETH/USDC');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<string>('0');
  const [showChart, setShowChart] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  // No local tabs; using on-chain LimitOrderCard
  const { isConnected, error } = useYellowNetwork();
  const marketBase = (import.meta as any).env?.VITE_MARKET_DATA_URL || 'http://localhost:4001';
  const [ticker, setTicker] = useState<{ price: number; changePercent24h: number; volume24h: number } | null>(null);

  useEffect(() => {
    // Use WS live ticks for real-time price; fall back to initial REST fetch for volume
    const pool = POOL_ADDRESSES.ETH_USDC;
    let url: URL;
    try { url = new URL(marketBase); } catch { return; }
    const wsPort = (Number(url.port || '4001') + 1).toString();
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${url.hostname}:${wsPort}`;

    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'subscribe', pool }));
    });
    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        if (msg.type === 'tick' && typeof msg.price === 'number') {
          setTicker((prev) => ({
            price: msg.price,
            changePercent24h: prev?.changePercent24h ?? 0,
            volume24h: prev?.volume24h ?? 0,
          }));
        }
      } catch {}
    });

    // initial 24h stats via REST
    (async () => {
      try {
        const res = await fetch(`${marketBase}/ticker?pool=${pool}`);
        if (!res.ok) return;
        const json = await res.json();
        setTicker({ price: json.price, changePercent24h: json.changePercent24h, volume24h: json.volume24h });
      } catch {}
    })();

    return () => { try { ws.close(); } catch {} };
  }, [marketBase]);

  const TickerStat = () => (
    <div className="flex items-center space-x-2">
      <p className={`text-2xl font-bold ${((ticker?.changePercent24h || 0) >= 0) ? 'text-green-400' : 'text-red-400'}`}>
        ${ticker ? ticker.price.toFixed(6) : '0.000000'}
      </p>
      {ticker && (
        <span className={`text-sm ${ticker.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {ticker.changePercent24h >= 0 ? '▲' : '▼'}
        </span>
      )}
    </div>
  );

  const TickerChange = () => (
    <p className={`text-2xl font-bold ${((ticker?.changePercent24h || 0) >= 0) ? 'text-green-400' : 'text-red-400'}`}>
      {ticker ? `${ticker.changePercent24h >= 0 ? '+' : ''}${ticker.changePercent24h.toFixed(2)}%` : '+0.00%'}
    </p>
  );

  const TickerVolume = () => (
    <p className="text-2xl font-bold text-foreground">${ticker ? ticker.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}</p>
  );

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
                  <TickerStat />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <TickerChange />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <TickerVolume />
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
              poolAddress={POOL_ADDRESSES.ETH_USDC}
            />
          </div>
        )}

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Limit Order UI (on-chain) */}
          <div className="lg:col-span-2">
            <LimitOrderCard />
          </div>

          {/* Right Column - Order Book & Market Data */}
          <div className="space-y-6">
            {/* Order Book - replace with on-chain orderbook later if available */}

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