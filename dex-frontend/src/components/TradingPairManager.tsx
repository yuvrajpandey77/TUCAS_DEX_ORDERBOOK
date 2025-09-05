import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDEXStore } from '@/store/dex-store';
import { dexService } from '@/services/dex-service';
import { ethers } from 'ethers';
import { Plus, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TradingPair {
  baseToken: string;
  quoteToken: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  minOrderSize: string;
  pricePrecision: string;
  isActive: boolean;
}

const TradingPairManager = () => {
  const { isConnected, signer, account } = useDEXStore();
  const { toast } = useToast();
  const [isAddingPair, setIsAddingPair] = useState(false);
  const [isCheckingPairs, setIsCheckingPairs] = useState(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [formData, setFormData] = useState({
    baseToken: '',
    quoteToken: '',
    minOrderSize: '',
    pricePrecision: ''
  });

  const handleAddTradingPair = async () => {
    if (!isConnected || !signer || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to add trading pairs",
        variant: "destructive",
      });
      return;
    }

    if (!formData.baseToken || !formData.quoteToken || !formData.minOrderSize || !formData.pricePrecision) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAddingPair(true);

    try {
      await dexService.initialize(signer);

      // Convert values to wei
      const minOrderSizeWei = ethers.parseEther(formData.minOrderSize);
      const pricePrecisionWei = ethers.parseEther(formData.pricePrecision);

      const txHash = await dexService.addTradingPair(
        formData.baseToken,
        formData.quoteToken,
        minOrderSizeWei.toString(),
        pricePrecisionWei.toString()
      );

      toast({
        title: "Trading Pair Added Successfully! 🎉",
        description: `Trading pair added. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Clear form
      setFormData({
        baseToken: '',
        quoteToken: '',
        minOrderSize: '',
        pricePrecision: ''
      });

      // Refresh pairs list
      await checkTradingPairs();

    } catch (error) {
      console.error('Error adding trading pair:', error);
      toast({
        title: "Failed to Add Trading Pair",
        description: error instanceof Error ? error.message : 'Failed to add trading pair',
        variant: "destructive",
      });
    } finally {
      setIsAddingPair(false);
    }
  };

  const checkTradingPairs = async () => {
    if (!isConnected || !signer) return;

    try {
      setIsCheckingPairs(true);
      await dexService.initialize(signer);

      // For now, we'll use predefined pairs since the contract doesn't have a view function for all pairs
      const predefinedPairs: TradingPair[] = [
        {
          baseToken: '0x0000000000000000000000000000000000000000', // Native ETH
          quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
          baseTokenSymbol: 'ETH',
          quoteTokenSymbol: 'ETH',
          minOrderSize: '1.0',
          pricePrecision: '0.0001',
          isActive: true
        }
      ];

      // Check if each pair is active on the contract
      const activePairs: TradingPair[] = [];
      
      // Helper function to check if address is placeholder
      const isPlaceholderAddress = (address: string) => {
        const placeholderPatterns = [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901',
          '0x3456789012345678901234567890123456789012',
          '0x4567890123456789012345678901234567890123'
        ]
        return placeholderPatterns.includes(address.toLowerCase())
      }
      
      for (const pair of predefinedPairs) {
        try {
          const isActive = await dexService.isTradingPairActive(pair.baseToken, pair.quoteToken);
          activePairs.push({
            ...pair,
            isActive
          });
        } catch (error) {
          console.error(`Error checking pair ${pair.baseTokenSymbol}/${pair.quoteTokenSymbol}:`, error);
          
          // If using placeholder addresses, assume active for demo
          if (isPlaceholderAddress(pair.baseToken) || isPlaceholderAddress(pair.quoteToken)) {
            console.log(`Using placeholder addresses for ${pair.baseTokenSymbol}/${pair.quoteTokenSymbol}, assuming active for demo`)
            activePairs.push({
              ...pair,
              isActive: true
            });
          } else {
            activePairs.push({
              ...pair,
              isActive: false
            });
          }
        }
      }

      setPairs(activePairs);

    } catch (error) {
      console.error('Error checking trading pairs:', error);
      toast({
        title: "Error",
        description: "Failed to check trading pairs",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPairs(false);
    }
  };

  React.useEffect(() => {
    if (isConnected) {
      checkTradingPairs();
    }
  }, [isConnected]);

  return (
    <Card className="w-full card-glass border-border/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Settings className="h-5 w-5 mr-2 text-purple-400" />
          Trading Pair Manager
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Add and manage trading pairs on the DEX
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Trading Pair Form */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-foreground">Add New Trading Pair</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseToken" className="text-xs">Base Token Address</Label>
              <Input
                id="baseToken"
                placeholder="0x..."
                value={formData.baseToken}
                onChange={(e) => setFormData(prev => ({ ...prev, baseToken: e.target.value }))}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quoteToken" className="text-xs">Quote Token Address</Label>
              <Input
                id="quoteToken"
                placeholder="0x..."
                value={formData.quoteToken}
                onChange={(e) => setFormData(prev => ({ ...prev, quoteToken: e.target.value }))}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minOrderSize" className="text-xs">Minimum Order Size</Label>
              <Input
                id="minOrderSize"
                type="number"
                placeholder="1.0"
                value={formData.minOrderSize}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderSize: e.target.value }))}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePrecision" className="text-xs">Price Precision</Label>
              <Input
                id="pricePrecision"
                type="number"
                placeholder="0.0001"
                value={formData.pricePrecision}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePrecision: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
          
          <Button
            onClick={handleAddTradingPair}
            disabled={isAddingPair || !isConnected}
            className="w-full"
          >
            {isAddingPair ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding Pair...</span>
              </div>
            ) : !isConnected ? (
              "Connect Wallet to Add Pair"
            ) : (
              "Add Trading Pair"
            )}
          </Button>
        </div>

        {/* Trading Pairs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Active Trading Pairs</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkTradingPairs}
              disabled={isCheckingPairs}
            >
              <Loader2 className={`h-4 w-4 ${isCheckingPairs ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="space-y-2">
            {pairs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trading pairs found</p>
                <p className="text-xs">Add a trading pair to get started</p>
              </div>
            ) : (
              pairs.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-accent/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {pair.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">
                        {pair.baseTokenSymbol}/{pair.quoteTokenSymbol}
                      </span>
                    </div>
                    <Badge variant={pair.isActive ? "default" : "secondary"} className="text-xs">
                      {pair.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Min: {pair.minOrderSize}</div>
                    <div>Precision: {pair.pricePrecision}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Information */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Note:</strong> Only contract owner can add trading pairs.</p>
              <p><strong>Base Token:</strong> The token being traded (e.g., ETH)</p>
              <p><strong>Quote Token:</strong> The token used for pricing (e.g., USDC)</p>
              <p><strong>Min Order Size:</strong> Minimum amount for orders in base token units</p>
              <p><strong>Price Precision:</strong> Minimum price increment in quote token units</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingPairManager; 