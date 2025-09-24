import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  pair: string;
  timeframe?: string;
  height?: number;
  poolAddress?: string; // Uniswap V3 pool id for live data
}

const CandlestickChart = ({ pair, timeframe = '1h', height = 400, poolAddress }: CandlestickChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load live candles from backend
  useEffect(() => {
    let isCancelled = false;
    const marketBase = (import.meta as any).env?.VITE_MARKET_DATA_URL || 'http://localhost:4001';
    const interval = timeframe.toLowerCase() === '1d' ? '1d' : '1h';
    const pool = poolAddress?.toLowerCase();
    if (!pool) return;

    const fetchCandles = async () => {
      try {
        setIsLoading(true);
        const resp = await fetch(`${marketBase}/candles?pool=${pool}&interval=${interval}&limit=300`);
        if (!resp.ok) throw new Error('Failed to fetch candles');
        const json = await resp.json();
        if (!isCancelled) {
          setCandleData(json.candles || []);
          setIsLoading(false);
        }
      } catch (e) {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchCandles();
    const id = setInterval(fetchCandles, 30000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [pair, timeframe, poolAddress]);

  // WebSocket live ticks → bin into candles
  useEffect(() => {
    if (!poolAddress) return;
    const base = (import.meta as any).env?.VITE_MARKET_DATA_URL || 'http://localhost:4001';
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      return;
    }
    const wsPort = (Number(url.port || '4001') + 1).toString();
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${url.hostname}:${wsPort}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'subscribe', pool: poolAddress }));
    });

    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        if (msg.type !== 'tick' || typeof msg.price !== 'number' || typeof msg.ts !== 'number') return;
        setCandleData((prev) => {
          if (prev.length === 0) return prev;
          const bucketMs = timeframe.toLowerCase() === '1d' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
          const ts = Math.floor(msg.ts / bucketMs) * bucketMs;
          const last = prev[prev.length - 1];
          if (last.timestamp === ts) {
            // update current candle
            const updated: CandleData = {
              ...last,
              high: Math.max(last.high, msg.price),
              low: Math.min(last.low, msg.price),
              close: msg.price,
            };
            return [...prev.slice(0, -1), updated];
          } else if (ts > last.timestamp) {
            // push new candle seeded from previous close
            const newCandle: CandleData = {
              timestamp: ts,
              open: last.close,
              high: msg.price,
              low: msg.price,
              close: msg.price,
              volume: last.volume, // volume live not computed here; subgraph REST fills it periodically
            };
            return [...prev, newCandle];
          }
          return prev;
        });
      } catch {}
    });

    return () => {
      try { ws.close(); } catch {}
      wsRef.current = null;
    };
  }, [poolAddress, timeframe]);

  // Draw candlestick chart
  useEffect(() => {
    if (!canvasRef.current || candleData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    if (candleData.length === 0) return;

    // Calculate price range
    const prices = candleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;

    const visibleCandles = Math.floor(chartWidth / 8);
    const startIndex = Math.max(0, candleData.length - visibleCandles);
    const visibleData = candleData.slice(startIndex);

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw candlesticks
    visibleData.forEach((candle, index) => {
      const x = padding + (index * chartWidth) / visibleData.length + chartWidth / visibleData.length / 2;
      const candleWidth = (chartWidth / visibleData.length) * 0.8;
      
      // Calculate Y positions
      const openY = padding + chartHeight - ((candle.open - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const closeY = padding + chartHeight - ((candle.close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const highY = padding + chartHeight - ((candle.high - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const lowY = padding + chartHeight - ((candle.low - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

      const isGreen = candle.close >= candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(openY - closeY);
      
      if (bodyHeight > 0) {
        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji - draw a line
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, openY);
        ctx.stroke();
      }
    });

    // Draw price labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (priceRange + pricePadding * 2) * (1 - i / 4);
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    const timeLabels = 5;
    for (let i = 0; i < timeLabels; i++) {
      const dataIndex = Math.floor((visibleData.length - 1) * i / (timeLabels - 1));
      const candle = visibleData[dataIndex];
      const x = padding + (dataIndex * chartWidth) / visibleData.length + chartWidth / visibleData.length / 2;
      const time = new Date(candle.timestamp);
      ctx.fillText(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), x, height - 10);
    }

  }, [candleData, zoom]);

  // Handle mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candleData.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    
    const visibleCandles = Math.floor(chartWidth / 8);
    const startIndex = Math.max(0, candleData.length - visibleCandles);
    const visibleData = candleData.slice(startIndex);
    
    const candleIndex = Math.floor(((x - padding) / chartWidth) * visibleData.length);
    
    if (candleIndex >= 0 && candleIndex < visibleData.length) {
      setHoveredCandle(visibleData[candleIndex]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  const currentPrice = candleData.length > 0 ? candleData[candleData.length - 1].close : 0;
  const priceChange = candleData.length > 1 
    ? ((currentPrice - candleData[candleData.length - 2].close) / candleData[candleData.length - 2].close) * 100 
    : 0;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''} border border-border/20`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {pair} Chart
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {timeframe}
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className={`font-mono font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLoading(true)}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative" style={{ height: `${height}px` }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ height: `${height}px` }}
              />
              
              {/* Hover tooltip */}
              {hoveredCandle && (
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">
                      {new Date(hoveredCandle.timestamp).toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">O:</span>
                        <span className="ml-1 font-mono">${hoveredCandle.open.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">H:</span>
                        <span className="ml-1 font-mono text-green-400">${hoveredCandle.high.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">L:</span>
                        <span className="ml-1 font-mono text-red-400">${hoveredCandle.low.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">C:</span>
                        <span className={`ml-1 font-mono ${hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400'}`}>
                          ${hoveredCandle.close.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Vol:</span>
                      <span className="ml-1 font-mono">{hoveredCandle.volume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandlestickChart;
