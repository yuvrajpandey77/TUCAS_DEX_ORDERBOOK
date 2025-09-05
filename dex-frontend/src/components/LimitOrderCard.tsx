import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, ChevronDown, AlertCircle, Info, Calculator, TrendingUp, TrendingDown, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDEXStore } from '@/store/dex-store';
import { useWallet } from '@/hooks/useWallet';
import { dexService } from '@/services/dex-service';
import { useTokenApproval } from '@/hooks/use-token-approval';
import { useOrderMatching } from '@/hooks/use-order-matching';
import { ethers } from 'ethers';

const LimitOrderCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [isProcessingSell, setIsProcessingSell] = useState(false);
  const { toast } = useToast();
  const { selectedPair } = useDEXStore();
  const { isConnected, signer } = useWallet();
  const { ensureApproval, getApprovalState } = useTokenApproval();
  const { matchingState, checkImmediateFill } = useOrderMatching();

  // Calculate estimated values
  const calculateEstimatedValues = () => {
    if (!fromAmount || !limitPrice) return null;
    
    const from = parseFloat(fromAmount);
    const price = parseFloat(limitPrice);
    
    if (isNaN(from) || isNaN(price) || price <= 0) return null;
    
    // For buy orders: fromAmount is quote token (USDC), toAmount is base token (MONAD)
    // For sell orders: fromAmount is base token (MONAD), toAmount is quote token (USDC)
    const estimatedReceive = (from / price).toFixed(6);
    const totalValue = from.toFixed(2);
    const fee = (from * 0.003).toFixed(4); // 0.3% trading fee
    
    return {
      estimatedReceive,
      totalValue,
      priceImpact: '0.01%', // Mock value
      fee,
    };
  };

  const estimatedValues = calculateEstimatedValues();

  const handlePlaceBuyOrder = async () => {
    if (!fromAmount || !toAmount || !limitPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before placing your order.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !signer || !selectedPair) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet and select a trading pair.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBuy(true);

    try {
      // Calculate required approval amount (quote token for buy orders)
      const requiredAmount = ethers.parseEther(fromAmount).toString();
      
      // Ensure tokens are approved for trading (skip for native tokens)
      if (selectedPair.quoteToken !== '0x0000000000000000000000000000000000000000') {
        const isApproved = await ensureApproval(selectedPair.quoteToken, requiredAmount);
        
        if (!isApproved) {
          toast({
            title: "Approval Required",
            description: "Please approve tokens before placing your order.",
            variant: "destructive",
          });
          return;
        }
      }

      // Initialize DEX service
      await dexService.initialize(signer);

      // Convert amounts to wei
      const amountWei = ethers.parseEther(toAmount);
      const priceWei = ethers.parseEther(limitPrice);

      // Place limit buy order
      const txHash = await dexService.placeLimitOrder(
        selectedPair.baseToken,
        selectedPair.quoteToken,
        amountWei.toString(),
        priceWei.toString(),
        true // isBuy
      );

      toast({
        title: "Buy Order Placed Successfully! 🎉",
        description: `Successfully placed buy order for ${toAmount} MONAD at ${limitPrice} USDC per MONAD. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Clear form
      setFromAmount('');
      setToAmount('');
      setLimitPrice('');

    } catch (error) {
      console.error('Error placing buy order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : 'Failed to place buy order',
        variant: "destructive",
      });
    } finally {
      setIsProcessingBuy(false);
    }
  };

  const handlePlaceSellOrder = async () => {
    if (!fromAmount || !toAmount || !limitPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before placing your order.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !signer || !selectedPair) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet and select a trading pair.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingSell(true);

    try {
      // Calculate required approval amount (base token for sell orders)
      const requiredAmount = ethers.parseEther(fromAmount).toString();
      
      // Ensure tokens are approved for trading (skip for native tokens)
      if (selectedPair.baseToken !== '0x0000000000000000000000000000000000000000') {
        const isApproved = await ensureApproval(selectedPair.baseToken, requiredAmount);
        
        if (!isApproved) {
          toast({
            title: "Approval Required",
            description: "Please approve tokens before placing your order.",
            variant: "destructive",
          });
          return;
        }
      }

      // Initialize DEX service
      await dexService.initialize(signer);

      // Convert amounts to wei
      const amountWei = ethers.parseEther(fromAmount);
      const priceWei = ethers.parseEther(limitPrice);

      // Place limit sell order
      const txHash = await dexService.placeLimitOrder(
        selectedPair.baseToken,
        selectedPair.quoteToken,
        amountWei.toString(),
        priceWei.toString(),
        false // isBuy = false for sell
      );

      toast({
        title: "Sell Order Placed Successfully! 🎉",
        description: `Successfully placed sell order for ${fromAmount} MONAD at ${limitPrice} USDC per MONAD. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Clear form
      setFromAmount('');
      setToAmount('');
      setLimitPrice('');

    } catch (error) {
      console.error('Error placing sell order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : 'Failed to place sell order',
        variant: "destructive",
      });
    } finally {
      setIsProcessingSell(false);
    }
  };

  // Check immediate fill when order parameters change
  React.useEffect(() => {
    if (isConnected && fromAmount && limitPrice && selectedPair) {
      const timeoutId = setTimeout(() => {
        checkImmediateFill(fromAmount, limitPrice, true); // Check for buy orders
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [fromAmount, limitPrice, isConnected, selectedPair, checkImmediateFill]);

  // Show loading state while no trading pair is selected
  if (!selectedPair) {
    return (
      <Card className="w-full card-glass border-border/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-400" />
            Limit Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
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
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-400" />
            Limit Order
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Set your desired price and amount for precise trading control
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Buy/Sell Tabs */}
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="buy" className="text-green-400 data-[state=active]:text-green-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-red-400 data-[state=active]:text-red-400 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-6">
            {/* You Pay */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">You pay</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-background/50">
                    <div className="w-6 h-6 rounded-full bg-blue-500" />
                    <span className="font-medium">USDC</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Limit Price */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Limit price</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">USDC per MONAD</span>
                </div>
              </div>
            </div>

            {/* You Receive */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">You receive</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-background/50">
                    <div className="w-6 h-6 rounded-full bg-purple-600" />
                    <span className="font-medium">MONAD</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            {estimatedValues && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Order Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estimated Receive</p>
                    <p className="font-semibold text-foreground">{estimatedValues.estimatedReceive} MONAD</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-foreground">${estimatedValues.totalValue}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price Impact</p>
                    <p className="font-semibold text-green-400">{estimatedValues.priceImpact}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee (0.3%)</p>
                    <p className="font-semibold text-foreground">${estimatedValues.fee}</p>
                  </div>
                </div>
                
                {/* Immediate Fill Check */}
                {isConnected && fromAmount && limitPrice && (
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Immediate Fill Check</span>
                      {matchingState.isChecking ? (
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : matchingState.canFill ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Can Fill</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">No Immediate Fill</span>
                        </div>
                      )}
                    </div>
                    {matchingState.fillAmount && matchingState.fillPrice && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div>Fill Amount: {matchingState.fillAmount} MONAD</div>
                        <div>Fill Price: ${matchingState.fillPrice}</div>
                        {matchingState.estimatedSlippage && (
                          <div>Slippage: {matchingState.estimatedSlippage}%</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Token Approval Status */}
            {isConnected && selectedPair && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Token Approval Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">USDC Approval:</span>
                    <div className="flex items-center space-x-1">
                      {getApprovalState(selectedPair.quoteToken).isApproved ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className={getApprovalState(selectedPair.quoteToken).isApproved ? "text-green-600" : "text-yellow-600"}>
                        {getApprovalState(selectedPair.quoteToken).isApproved ? "Approved" : "Not Approved"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">MONAD Approval:</span>
                    <div className="flex items-center space-x-1">
                      {getApprovalState(selectedPair.baseToken).isApproved ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className={getApprovalState(selectedPair.baseToken).isApproved ? "text-green-600" : "text-yellow-600"}>
                        {getApprovalState(selectedPair.baseToken).isApproved ? "Approved" : "Not Approved"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handlePlaceBuyOrder}
              disabled={isProcessingBuy || !isConnected}
              className="w-full mt-6 h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingBuy ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : !isConnected ? (
                "Connect Wallet to Trade"
              ) : (
                "Place Buy Order"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            {/* You Pay */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">You pay</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-background/50">
                    <div className="w-6 h-6 rounded-full bg-purple-600" />
                    <span className="font-medium">MONAD</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Limit Price */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Limit price</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">USDC per MONAD</span>
                </div>
              </div>
            </div>

            {/* You Receive */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">You receive</Label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 border border-border/20">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 flex-1"
                  />
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-background/50">
                    <div className="w-6 h-6 rounded-full bg-blue-500" />
                    <span className="font-medium">USDC</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            {estimatedValues && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Order Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estimated Receive</p>
                    <p className="font-semibold text-foreground">${estimatedValues.estimatedReceive}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-foreground">{estimatedValues.totalValue} MONAD</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price Impact</p>
                    <p className="font-semibold text-red-400">{estimatedValues.priceImpact}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee (0.3%)</p>
                    <p className="font-semibold text-foreground">${estimatedValues.fee}</p>
                  </div>
                </div>
                
                {/* Immediate Fill Check */}
                {isConnected && fromAmount && limitPrice && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Immediate Fill Check</span>
                      {matchingState.isChecking ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : matchingState.canFill ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Can Fill</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">No Immediate Fill</span>
                        </div>
                      )}
                    </div>
                    {matchingState.fillAmount && matchingState.fillPrice && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div>Fill Amount: {matchingState.fillAmount} MONAD</div>
                        <div>Fill Price: ${matchingState.fillPrice}</div>
                        {matchingState.estimatedSlippage && (
                          <div>Slippage: {matchingState.estimatedSlippage}%</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Token Approval Status */}
            {isConnected && selectedPair && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Token Approval Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">USDC Approval:</span>
                    <div className="flex items-center space-x-1">
                      {getApprovalState(selectedPair.quoteToken).isApproved ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className={getApprovalState(selectedPair.quoteToken).isApproved ? "text-green-600" : "text-yellow-600"}>
                        {getApprovalState(selectedPair.quoteToken).isApproved ? "Approved" : "Not Approved"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">MONAD Approval:</span>
                    <div className="flex items-center space-x-1">
                      {getApprovalState(selectedPair.baseToken).isApproved ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className={getApprovalState(selectedPair.baseToken).isApproved ? "text-green-600" : "text-yellow-600"}>
                        {getApprovalState(selectedPair.baseToken).isApproved ? "Approved" : "Not Approved"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handlePlaceSellOrder}
              disabled={isProcessingSell || !isConnected}
              className="w-full mt-6 h-12 text-base font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingSell ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : !isConnected ? (
                "Connect Wallet to Trade"
              ) : (
                "Place Sell Order"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Additional Information */}
        <div className="mt-6 p-4 bg-accent/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Limit Orders:</strong> Set your desired price and wait for the market to reach it.</p>
              <p><strong>No Slippage:</strong> Orders execute exactly at your specified price.</p>
              <p><strong>Partial Fills:</strong> Orders may be filled partially based on available liquidity.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LimitOrderCard;