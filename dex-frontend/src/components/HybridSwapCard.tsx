import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ChevronDown, Settings, RefreshCw, Zap, Globe, Shield, ExternalLink, Layers } from 'lucide-react';
import TokenSelectorModal from './TokenSelectorModal';
import { useUniswapV3, useSwapQuote, useSwap } from '@/hooks/useUniswapV3';
import { useYellowNetwork } from '@/components/YellowNetworkProvider';
import { TOKENS } from '@/config/uniswap-v3';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logo: string;
  decimals?: number;
  chain?: string;
}

type SwapMode = 'uniswap' | 'yellow' | 'hybrid';

const HybridSwapCard = () => {
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [isManualSwap, setIsManualSwap] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [swapMode, setSwapMode] = useState<SwapMode>('hybrid');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  const [sellToken, setSellToken] = useState<Token>({
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    logo: '⬟',
    decimals: 18,
    chain: 'ethereum-mainnet'
  });
  
  const [buyToken, setBuyToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKENS.USDC.address,
    logo: '🪙',
    decimals: TOKENS.USDC.decimals,
    chain: 'ethereum-mainnet'
  });
  
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenModalType, setTokenModalType] = useState<'sell' | 'buy'>('buy');

  // Uniswap V3 hooks
  const { 
    address, 
    connectWallet, 
    tokenBalances, 
    isLoadingBalances,
    createSwapParams,
    formatTokenAmount
  } = useUniswapV3();

  // Yellow Network hooks
  const { isConnected: isYellowConnected, error: yellowError } = useYellowNetwork();

  // Swap quote for Uniswap V3
  const swapParams = createSwapParams(
    sellToken.address,
    buyToken.address,
    sellAmount,
    slippage * 100
  );

  const { data: uniswapQuote, isLoading: isLoadingUniswapQuote, error: uniswapQuoteError } = useSwapQuote(swapParams);
  
  // Swap execution
  const swapMutation = useSwap();

  // Note: TokenSelectorModal uses its own popular tokens list

  // Yellow Network quote calculation
  const [yellowQuote, setYellowQuote] = useState<{
    outputAmount: string;
    priceImpact: string;
    gasEstimate: string;
  } | null>(null);
  const [isLoadingYellowQuote, setIsLoadingYellowQuote] = useState(false);

  // Calculate Yellow Network quote
  const calculateYellowQuote = useCallback(async (amount: string) => {
    if (!amount || amount === '0' || !isYellowConnected) {
      setYellowQuote(null);
      return;
    }

    setIsLoadingYellowQuote(true);
    try {
      // Yellow Network integration not yet implemented
      // For now, disable Yellow Network quotes to avoid mock data
      console.warn('Yellow Network quotes not yet implemented - using Uniswap V3 only');
      setYellowQuote(null);
    } catch (error) {
      console.error('Error calculating Yellow Network quote:', error);
      setYellowQuote(null);
    } finally {
      setIsLoadingYellowQuote(false);
    }
  }, [isYellowConnected]);

  // Update buy amount when quote changes
  useEffect(() => {
    if (!isManualSwap) {
      if (swapMode === 'uniswap' && uniswapQuote) {
        setBuyAmount(uniswapQuote.outputAmount);
      } else if (swapMode === 'yellow' && yellowQuote) {
        setBuyAmount(yellowQuote.outputAmount);
      } else if (swapMode === 'hybrid') {
        // Use the better quote
        if (uniswapQuote && yellowQuote) {
          const uniswapOutput = parseFloat(uniswapQuote.outputAmount);
          const yellowOutput = parseFloat(yellowQuote.outputAmount);
          setBuyAmount(yellowOutput > uniswapOutput ? yellowQuote.outputAmount : uniswapQuote.outputAmount);
        } else if (uniswapQuote) {
          setBuyAmount(uniswapQuote.outputAmount);
        } else if (yellowQuote) {
          setBuyAmount(yellowQuote.outputAmount);
        }
      }
    }
  }, [uniswapQuote, yellowQuote, swapMode, isManualSwap]);

  // Calculate Yellow Network quote when amount changes
  useEffect(() => {
    if (swapMode === 'yellow' || swapMode === 'hybrid') {
      calculateYellowQuote(sellAmount);
    }
  }, [sellAmount, swapMode, calculateYellowQuote]);

  // Handle token selection
  const handleTokenSelect = useCallback((token: Token) => {
    if (tokenModalType === 'sell') {
      if (buyToken && token.address === buyToken.address) {
        alert('Cannot select the same token for both buy and sell');
        return;
      }
      setSellToken(token);
      setSellAmount('0');
      setBuyAmount('0');
    } else {
      if (sellToken && token.address === sellToken.address) {
        alert('Cannot select the same token for both buy and sell');
        return;
      }
      setBuyToken(token);
      setSellAmount('0');
      setBuyAmount('0');
    }
    setIsTokenModalOpen(false);
  }, [tokenModalType, sellToken, buyToken]);

  // Handle amount input - only allow changes to sell amount
  const handleSellAmountChange = useCallback((value: string) => {
    setSellAmount(value);
    // Reset buy amount - it will be updated by the quote
    setBuyAmount('0');
    setIsManualSwap(false); // Let quotes handle the calculation
  }, []);

  // Buy amount is read-only - no manual changes allowed
  const handleBuyAmountChange = useCallback((value: string) => {
    // Do nothing - this field is read-only
    console.log('Buy amount is read-only and calculated automatically');
  }, []);

  // Get token balance
  const getTokenBalance = useCallback((tokenAddress: string) => {
    const balance = tokenBalances[Object.keys(TOKENS).find(key => 
      TOKENS[key as keyof typeof TOKENS].address === tokenAddress
    ) as keyof typeof TOKENS];
    return balance ? formatTokenAmount(balance.balance, balance.decimals || 18) : '0';
  }, [tokenBalances, formatTokenAmount]);

  // Handle swap
  const handleSwap = useCallback(async () => {
    if (!address) {
      await connectWallet();
      return;
    }

    try {
      if (swapMode === 'uniswap' || swapMode === 'hybrid') {
        if (!uniswapQuote) {
          alert('Please get a quote first');
          return;
        }

        const tx = await swapMutation.mutateAsync(swapParams);
        
        if (tx) {
          setLastTxHash(tx.hash);
          alert(`Swap successful! Transaction: ${tx.hash}`);
          setSellAmount('0');
          setBuyAmount('0');
        }
      } else if (swapMode === 'yellow') {
        // Yellow Network swap logic
        if (!yellowQuote) {
          alert('Please get a quote first');
          return;
        }

        // Yellow Network swap not yet implemented
        alert('Yellow Network swaps are not yet implemented. Please use Uniswap V3 for now.');
        return;
      }
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [
    address, 
    connectWallet, 
    swapMode, 
    uniswapQuote, 
    yellowQuote, 
    swapMutation, 
    swapParams
  ]);

  // Swap tokens
  const swapTokens = useCallback(() => {
    const tempToken = sellToken;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount('0');
    setBuyAmount('0');
  }, [sellToken, buyToken]);

  const isLoading = isLoadingUniswapQuote || isLoadingYellowQuote || swapMutation.isPending;
  const canSwap = address && parseFloat(sellAmount) > 0 && !isLoading && 
    ((swapMode === 'uniswap' && uniswapQuote) || 
     (swapMode === 'yellow' && yellowQuote) || 
     (swapMode === 'hybrid' && (uniswapQuote || yellowQuote)));

  const currentQuote = swapMode === 'uniswap' ? uniswapQuote : 
                      swapMode === 'yellow' ? yellowQuote : 
                      swapMode === 'hybrid' ? (yellowQuote && uniswapQuote ? 
                        (parseFloat(yellowQuote.outputAmount) > parseFloat(uniswapQuote.outputAmount) ? yellowQuote : uniswapQuote) : 
                        uniswapQuote || yellowQuote) : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2 border-blue-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Hybrid DEX Swap
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Layers className="w-3 h-3 mr-1" />
                Hybrid
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Swap Mode Selection */}
          <Tabs value={swapMode} onValueChange={(value) => setSwapMode(value as SwapMode)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="uniswap" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Uniswap V3
              </TabsTrigger>
              <TabsTrigger value="yellow" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Yellow Network
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Hybrid
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {showSettings && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Slippage Tolerance</span>
                <span className="text-sm text-gray-600">{slippage}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sell Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">From</span>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">
                  Balance: {isLoadingBalances ? '...' : `${getTokenBalance(sellToken.address)} ${sellToken.symbol}`}
                </span>
                {sellAmount && parseFloat(sellAmount) > 0 && (
                  <span className="text-xs text-orange-600">
                    You're selling: {sellAmount} {sellToken.symbol}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTokenModalType('sell');
                  setIsTokenModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 min-w-[120px]"
              >
                <span className="text-lg">{sellToken.logo}</span>
                <span className="font-medium">{sellToken.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => handleSellAmountChange(e.target.value)}
                className="text-right text-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapTokens}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Buy Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">To</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  Auto-calculated
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">
                  Balance: {isLoadingBalances ? '...' : `${getTokenBalance(buyToken.address)} ${buyToken.symbol}`}
                </span>
                {((swapMode === 'uniswap' && uniswapQuote) || (swapMode === 'yellow' && yellowQuote) || (swapMode === 'hybrid' && (uniswapQuote || yellowQuote))) && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-blue-600">
                      You'll receive: {
                        swapMode === 'uniswap' ? uniswapQuote?.outputAmount :
                        swapMode === 'yellow' ? yellowQuote?.outputAmount :
                        swapMode === 'hybrid' ? (uniswapQuote?.outputAmount || yellowQuote?.outputAmount) : '0'
                      } {buyToken.symbol}
                    </span>
                    <span className="text-xs text-green-600 mt-1">
                      ✅ Mainnet quotes - real liquidity pools
                    </span>
                  </div>
                )}
                {((swapMode === 'uniswap' && isLoadingUniswapQuote) || (swapMode === 'yellow' && isLoadingYellowQuote) || (swapMode === 'hybrid' && (isLoadingUniswapQuote || isLoadingYellowQuote))) && sellAmount && parseFloat(sellAmount) > 0 && (
                  <span className="text-xs text-orange-600">
                    Calculating price...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTokenModalType('buy');
                  setIsTokenModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 min-w-[120px]"
              >
                <span className="text-lg">{buyToken.logo}</span>
                <span className="font-medium">{buyToken.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => handleBuyAmountChange(e.target.value)}
                className="text-right text-lg bg-gray-50 cursor-not-allowed"
                disabled={true} // Always disabled - read-only
                readOnly={true}
                title="This amount is calculated automatically based on current market prices"
              />
            </div>
          </div>

          {/* Quote Information */}
          {currentQuote && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price Impact</span>
                <span className={`font-medium ${parseFloat(currentQuote.priceImpact) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {currentQuote.priceImpact}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Minimum Received</span>
                <span className="font-medium">{currentQuote.outputAmount} {buyToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Gas Estimate</span>
                <span className="font-medium">{currentQuote.gasEstimate}</span>
              </div>
              {swapMode === 'hybrid' && uniswapQuote && yellowQuote && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Best Route</span>
                  <span className="font-medium">
                    {parseFloat(yellowQuote.outputAmount) > parseFloat(uniswapQuote.outputAmount) ? 'Yellow Network' : 'Uniswap V3'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {(uniswapQuoteError || yellowError) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {uniswapQuoteError instanceof Error ? uniswapQuoteError.message : 
                 yellowError || 'Failed to get quote'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!address ? (
              <Button
                onClick={connectWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-2">
                {parseFloat(sellAmount) > 0 && !currentQuote && (
                  <Button
                    onClick={() => setIsManualSwap(false)}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Get Quote
                  </Button>
                )}
                
                {canSwap && (
                  <Button
                    onClick={handleSwap}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Swap via {swapMode === 'uniswap' ? 'Uniswap V3' : 
                                 swapMode === 'yellow' ? 'Yellow Network' : 'Best Route'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          {lastTxHash && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Transaction Hash:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Network: Ethereum Sepolia</span>
              <a
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                View on Etherscan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelectToken={handleTokenSelect}
      />
    </div>
  );
};

export default HybridSwapCard;
