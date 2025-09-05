import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDEXStore } from '@/store/dex-store';
import { CheckCircle, AlertCircle, ChevronDown, TrendingUp, BarChart3, Info } from 'lucide-react';

const TradingPairSelector = () => {
  const { selectedPair, setSelectedPair, tradingPairs } = useDEXStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handlePairSelect = (pair: any) => {
    setSelectedPair(pair);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mock market data for demonstration
  const getMarketData = () => ({
    price: 0.1234,
    change24h: 2.45,
    volume24h: 1250000,
  });

  const marketData = getMarketData();

  if (tradingPairs.length === 0) {
    return (
      <Card className="w-full card-glass border-border/20 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
            Trading Pair
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-xs">No pairs configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full card-glass border-border/20 h-full bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
          Trading Pair
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {/* Trading Pair Selector */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            className="w-full justify-between h-8 text-xs bg-background hover:bg-accent transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center space-x-2">
              {selectedPair && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                </div>
              )}
              <span className="text-xs font-medium">
                {selectedPair 
                  ? `${selectedPair.baseTokenSymbol}/${selectedPair.quoteTokenSymbol}`
                  : "Select pair"
                }
              </span>
            </div>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
              {tradingPairs.map((pair, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between border-b border-border/20 last:border-b-0 transition-colors duration-150"
                  onClick={() => handlePairSelect(pair)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div className="w-3 h-3 rounded-full bg-purple-600" />
                    </div>
                    <span className="text-xs font-medium">{pair.baseTokenSymbol}/{pair.quoteTokenSymbol}</span>
                  </div>
                  <Badge variant={pair.isActive ? "default" : "secondary"} className="text-xs h-5">
                    {pair.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Pair Info - Minimal */}
        {selectedPair && (
          <div className="space-y-2">
            {/* Pair Status & Market Data */}
            <div className="p-2 bg-background rounded-lg border border-border/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <div className="w-4 h-4 rounded-full bg-purple-600" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {selectedPair.baseTokenSymbol}/{selectedPair.quoteTokenSymbol}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {selectedPair.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <Badge variant="default" className="text-xs h-4 px-1">
                        Active
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        Inactive
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              {/* Market Data - Compact */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-semibold text-foreground">${marketData.price.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">24h</p>
                  <p className={`font-semibold ${marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Volume</p>
                  <p className="font-semibold text-foreground">${(marketData.volume24h / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>

            {/* Quick Limits */}
            <div className="p-2 bg-background rounded-lg border border-border/20">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-foreground">Trading Limits</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground text-xs">Min Order</p>
                  <p className="font-semibold text-foreground">{selectedPair.minOrderSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Precision</p>
                  <p className="font-semibold text-foreground">{selectedPair.pricePrecision}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fee</p>
                  <p className="font-semibold text-foreground">0.1%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Slippage</p>
                  <p className="font-semibold text-foreground">0.5%</p>
                </div>
                             </div>
             </div>

             {/* Network Information */}
             <div className="p-2 bg-background rounded-lg border border-border/20">
               <div className="flex items-center space-x-2 mb-1">
                 <Info className="h-3 w-3 text-purple-500" />
                 <span className="text-xs font-medium text-foreground">Network Info</span>
               </div>
               
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div>
                   <p className="text-muted-foreground text-xs">Network</p>
                   <p className="font-semibold text-foreground">Monad Testnet</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground text-xs">Chain ID</p>
                   <p className="font-semibold text-foreground">10143</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground text-xs">Base Token</p>
                   <p className="font-mono text-xs truncate">{selectedPair.baseToken.slice(0, 8)}...{selectedPair.baseToken.slice(-6)}</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground text-xs">Quote Token</p>
                   <p className="font-mono text-xs truncate">{selectedPair.quoteToken.slice(0, 8)}...{selectedPair.quoteToken.slice(-6)}</p>
                 </div>
               </div>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };

export default TradingPairSelector; 