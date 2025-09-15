import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ChevronDown, Settings, RefreshCw, Zap, Globe, ExternalLink } from 'lucide-react';
import TokenSelectorModal from './TokenSelectorModal';
import { useUniswapV3, useSwapQuote, useSwap, useTokenApproval, useTokenApprovalStatus } from '@/hooks/useUniswapV3';
import { TOKENS, UNISWAP_V3_CONFIG } from '@/config/uniswap-v3';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logo: string;
  decimals?: number;
}

const UniswapSwapCard = () => {
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [isManualSwap, setIsManualSwap] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  
  const [sellToken, setSellToken] = useState<Token>({
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    logo: '⬟',
    decimals: 18
  });
  
  const [buyToken, setBuyToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKENS.USDC.address,
    logo: '🪙',
    decimals: TOKENS.USDC.decimals
  });
  
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenModalType, setTokenModalType] = useState<'sell' | 'buy'>('buy');

  // Uniswap V3 hooks
  const { 
    isConnected, 
    address, 
    connectWallet, 
    tokenBalances, 
    isLoadingBalances,
    createSwapParams,
    formatTokenAmount,
    parseTokenAmount
  } = useUniswapV3();

  // Swap quote
  const swapParams = createSwapParams(
    sellToken.address,
    buyToken.address,
    sellAmount,
    slippage * 100 // Convert to basis points
  );

  const { data: quote, isLoading: isLoadingQuote, error: quoteError } = useSwapQuote(swapParams);
  
  // Debug logging
  console.log('SwapCard Debug:', {
    sellAmount,
    swapParams,
    quote: quote ? {
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      isFallback: quote.isFallback
    } : null,
    isLoadingQuote,
    quoteError
  });
  
  // Swap execution
  const swapMutation = useSwap();
  
  // Token approval
  const approvalMutation = useTokenApproval();
  const { data: isApproved } = useTokenApprovalStatus(
    sellToken.address,
    UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
    address
  );

  // Note: TokenSelectorModal uses its own popular tokens list

  // Update buy amount when quote changes
  useEffect(() => {
    if (quote && !isManualSwap) {
      setBuyAmount(quote.outputAmount);
    }
  }, [quote, isManualSwap]);

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

  // Handle amount input
  const handleSellAmountChange = useCallback((value: string) => {
    setSellAmount(value);
    setIsManualSwap(true);
  }, []);

  const handleBuyAmountChange = useCallback((value: string) => {
    setBuyAmount(value);
    setIsManualSwap(true);
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
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    if (!quote) {
      alert('Please get a quote first');
      return;
    }

    // Check if we're using fallback quotes (should not happen on mainnet)
    if (quote.isFallback) {
      alert('⚠️ Warning: Using fallback quotes. This is NOT real market data. Please ensure you are connected to Ethereum mainnet and the pool has sufficient liquidity.');
      return;
    }

    try {
      // Check if token needs approval (ETH doesn't need approval)
      if (sellToken.address !== '0x0000000000000000000000000000000000000000' && !isApproved) {
        const amount = parseTokenAmount(sellAmount, sellToken.decimals || 18);
        await approvalMutation.mutateAsync({
          tokenAddress: sellToken.address,
          spender: UNISWAP_V3_CONFIG.SWAP_ROUTER_ADDRESS,
          amount: amount
        });
      }

      // Execute swap
      const tx = await swapMutation.mutateAsync(swapParams);
      
      if (tx) {
        alert(`Swap successful! Transaction: ${tx.hash}`);
        // Reset amounts
        setSellAmount('0');
        setBuyAmount('0');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [
    isConnected, 
    address, 
    connectWallet, 
    quote, 
    sellToken, 
    isApproved, 
    approvalMutation, 
    swapMutation, 
    swapParams, 
    sellAmount, 
    parseTokenAmount
  ]);

  // Swap tokens
  const swapTokens = useCallback(() => {
    const tempToken = sellToken;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount('0');
    setBuyAmount('0');
  }, [sellToken, buyToken]);

  // Get quote
  const getQuote = useCallback(() => {
    if (parseFloat(sellAmount) > 0) {
      setIsManualSwap(false);
    }
  }, [sellAmount]);

  const isLoading = isLoadingQuote || swapMutation.isPending || approvalMutation.isPending;
  const canSwap = isConnected && quote && parseFloat(sellAmount) > 0 && !isLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2 border-blue-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Uniswap V3 Swap
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Globe className="w-3 h-3 mr-1" />
                Sepolia
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
              <span className="text-sm font-medium text-gray-600">To</span>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">
                  Balance: {isLoadingBalances ? '...' : `${getTokenBalance(buyToken.address)} ${buyToken.symbol}`}
                </span>
                {quote && (
                  <span className="text-xs text-blue-600">
                    You'll receive: {quote.outputAmount} {buyToken.symbol}
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
                className="text-right text-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quote Information */}
          {quote && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price Impact</span>
                <span className={`font-medium ${parseFloat(quote.priceImpact) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {quote.priceImpact}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Minimum Received</span>
                <span className="font-medium">{quote.minimumReceived} {buyToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Gas Estimate</span>
                <span className="font-medium">{quote.gasEstimate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Route</span>
                <span className="font-medium">{quote.route.join(' → ')}</span>
              </div>
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                <span className="font-medium">✅ Mainnet Mode:</span> Connected to Ethereum mainnet with real Uniswap V3 pools and liquidity.
              </div>
            </div>
          )}

          {/* Error Display */}
          {quoteError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {quoteError instanceof Error ? quoteError.message : 'Failed to get quote'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-2">
                {parseFloat(sellAmount) > 0 && !quote && (
                  <Button
                    onClick={getQuote}
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
                        {approvalMutation.isPending ? 'Approving...' : 'Swapping...'}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Swap
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

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

export default UniswapSwapCard;
