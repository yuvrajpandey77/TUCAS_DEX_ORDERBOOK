import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { yellowNetworkService } from '@/services/yellow-network-service';
import { yellowWalletService } from '@/services/yellow-wallet-service';
import { useYellowNetwork } from '@/components/YellowNetworkProvider';
import { Button } from '@/components/ui/button';
import { ArrowDown, ChevronDown, Settings, RefreshCw, Zap, Globe, Shield } from 'lucide-react';
import TokenSelectorModal from './TokenSelectorModal';
import { SwapParams, SwapResult } from '@/config/yellow-network';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logo: string;
  chain?: string;
}

const YellowSwapCard = () => {
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isManualSwap, setIsManualSwap] = useState(false);
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [slippage] = useState(0.5);
  
  const [sellToken, setSellToken] = useState<Token>({
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH on Ethereum Sepolia
    logo: '⬟',
    chain: 'ethereum-sepolia'
  });
  
  const [buyToken, setBuyToken] = useState<Token | null>({
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Official USDC on Ethereum Sepolia testnet
    logo: '🪙',
    chain: 'ethereum-sepolia'
  });
  
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenModalType, setTokenModalType] = useState<'sell' | 'buy'>('buy');

  // Yellow Network state
  const { isConnected, error } = useYellowNetwork();
  const [isInitializing] = useState(false);

  const handleTokenSelect = (token: Token) => {
    if (tokenModalType === 'sell') {
      if (buyToken && token.address === buyToken.address) {
        alert('Cannot select the same token for both buy and sell');
        return;
      }
      setSellToken(token);
    } else {
      if (sellToken && token.address === sellToken.address) {
        alert('Cannot select the same token for both buy and sell');
        return;
      }
      setBuyToken(token);
    }
    setIsTokenModalOpen(false);
  };

  const openTokenModal = (type: 'sell' | 'buy') => {
    setTokenModalType(type);
    setIsTokenModalOpen(true);
  };

  const swapTokens = () => {
    if (buyToken) {
      setIsManualSwap(true);
      
      const tempToken = sellToken;
      setSellToken(buyToken);
      setBuyToken(tempToken);
      
      const tempAmount = sellAmount;
      setSellAmount(buyAmount);
      setBuyAmount(tempAmount);
      
      setTimeout(() => {
        setIsManualSwap(false);
      }, 100);
    }
  };

  // Calculate buy amount using Yellow Network
  const calculateBuyAmount = async (sellAmt: string) => {
    if (!sellAmt || sellAmt === '0' || !buyToken || !sellToken) {
      setBuyAmount('0');
      return;
    }

    setIsCalculating(true);
    try {
      // Get market data from Yellow Network
      const marketData = await yellowNetworkService.getMarketData(`${sellToken.symbol}/${buyToken.symbol}`);
      
      if (marketData) {
        setCurrentPrice(parseFloat(marketData.price));
        setPriceImpact(0.1); // Mock price impact
        
        // Calculate buy amount using Yellow Network price
        const calculatedAmount = parseFloat(sellAmt) * parseFloat(marketData.price);
        setBuyAmount(calculatedAmount.toFixed(6));
      } else {
        // Fallback calculation
        const fallbackRate = 2000; // 1 ETH = 2000 USDC
        const calculatedAmount = parseFloat(sellAmt) * fallbackRate;
        setBuyAmount(calculatedAmount.toFixed(6));
        setCurrentPrice(fallbackRate);
      }
      
    } catch (error) {
      console.error('Failed to get market data:', error);
      // Fallback to static calculation
      const fallbackRate = 2000;
      const calculatedAmount = parseFloat(sellAmt) * fallbackRate;
      setBuyAmount(calculatedAmount.toFixed(6));
      setCurrentPrice(fallbackRate);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSellAmountChange = (value: string) => {
    setSellAmount(value);
    if (!isManualSwap) {
      calculateBuyAmount(value);
    }
  };

  // Recalculate when tokens change
  useEffect(() => {
    if (sellAmount && sellAmount !== '0' && !isManualSwap) {
      calculateBuyAmount(sellAmount);
    }
  }, [sellToken, buyToken, isManualSwap]);

  // Initial price fetch
  useEffect(() => {
    calculateBuyAmount('1');
  }, []);

  const executeSwap = async () => {
    if (isSwapping) return;
    
    if (!sellAmount || sellAmount === '0') {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!sellToken || !buyToken) {
      alert('Please select both tokens');
      return;
    }
    
    if (sellToken.address === buyToken.address) {
      alert('Cannot swap token with itself');
      return;
    }

    setIsSwapping(true);
    setLastTxHash(null);
    
    try {
      // Check wallet connection
      const walletState = yellowWalletService.getState();
      if (!walletState.isConnected || !walletState.signer) {
        await yellowWalletService.connect();
        return;
      }

      // Check Yellow Network connection
      if (!walletState.isYellowNetworkConnected) {
        alert('Yellow Network is not connected. Please wait for initialization or refresh the page.');
        setIsSwapping(false);
        return;
      }

      // Show user confirmation
      const confirmed = window.confirm(
        `Confirm Yellow Network swap:\n${sellAmount} ${sellToken.symbol} → ${buyAmount} ${buyToken.symbol}\n\nThis will execute through Yellow Network's state channels for instant settlement.`
      );
      
      if (!confirmed) {
        setIsSwapping(false);
        return;
      }

      // Prepare swap parameters
      const swapParams: SwapParams = {
        fromToken: sellToken.address,
        toToken: buyToken.address,
        amount: ethers.parseEther(sellAmount).toString(),
        slippage: slippage,
        recipient: walletState.address || '',
        sourceChain: sellToken.chain || 'ethereum',
        targetChain: buyToken.chain || 'ethereum',
      };

      // Execute swap through Yellow Network
      const result: SwapResult = await yellowNetworkService.executeSwap(swapParams);
      
      setLastTxHash(result.txHash);
      
      // Show success message
      alert(`✅ Yellow Network swap successful!\n\nTransaction: ${result.txHash}\nRoute: ${result.route.join(' → ')}\nPrice Impact: ${result.priceImpact}%\nFee: ${ethers.formatEther(result.fee)} $YELLOW`);
      
      // Reset amounts
      setSellAmount('0');
      setBuyAmount('0');
      
    } catch (error) {
      console.error('Swap failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Swap failed. Please try again.';
      alert(`❌ Yellow Network swap failed: ${errorMessage}`);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <>
      <div className="swap-card w-full max-w-md mx-auto bg-background backdrop-blur-xl border border-white/10 rounded-[28px]">
        {/* Top nav inside card */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Yellow Swap
            </span>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Limit</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Buy</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Sell</button>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent/60 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Yellow Network Status */}
        <div className="px-6 py-3 border-b border-white/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                Yellow Network: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {isInitializing && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Initializing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <div className="relative space-y-6">
            {/* Sell Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">You sell</span>
                <div className="text-xs text-muted-foreground">
                  Balance: 0.00 {sellToken.symbol}
                </div>
              </div>
              
              <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-200">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={sellAmount}
                    onChange={(e) => handleSellAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="token-input flex-1 text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                  />
                  <Button 
                    variant="ghost" 
                    onClick={() => openTokenModal('sell')}
                    className="flex items-center space-x-2 rounded-xl px-4 py-3 bg-background/80 border border-border/60 hover:bg-accent/60 hover:border-border transition-all duration-200 min-w-[120px]"
                  >
                    <span className="text-xl">{sellToken.logo}</span>
                    <span className="font-semibold text-sm">{sellToken.symbol}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {sellToken.chain && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>{sellToken.chain}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center items-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={swapTokens}
                className="relative z-10 rounded-full bg-background border-2 border-border hover:border-primary/50 hover:bg-accent/60 p-3 shadow-lg transition-all duration-200 hover:scale-105"
              >
                <ArrowDown className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </div>

            {/* Buy Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">You buy</span>
                {currentPrice && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      1 {sellToken.symbol} = ${currentPrice.toFixed(4)} {buyToken?.symbol}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => calculateBuyAmount(sellAmount)}
                      disabled={isCalculating}
                      className="h-6 w-6 p-0 hover:bg-accent/60 rounded-full"
                    >
                      <RefreshCw className={`h-3 w-3 ${isCalculating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-200">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={isCalculating ? 'Calculating...' : buyAmount}
                    readOnly
                    placeholder="0.00"
                    className="token-input flex-1 text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 cursor-not-allowed"
                  />
                  <Button 
                    variant="ghost" 
                    onClick={() => openTokenModal('buy')}
                    className={`flex items-center space-x-2 rounded-xl px-4 py-3 transition-all duration-200 min-w-[120px] ${
                      buyToken 
                        ? 'bg-background/80 border border-border/60 hover:bg-accent/60 hover:border-border' 
                        : 'bg-accent/60 text-accent-foreground border border-border/40 hover:bg-accent/80'
                    }`}
                  >
                    {buyToken ? (
                      <>
                        <span className="text-xl">{buyToken.logo}</span>
                        <span className="font-semibold text-sm">{buyToken.symbol}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-sm">Select token</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                {buyToken && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>{buyToken.chain}</span>
                    </div>
                    {buyAmount !== '0' && (
                      <div className="text-sm text-muted-foreground">
                        ≈ ${(parseFloat(buyAmount || '0') * 1).toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Details */}
            {currentPrice && buyToken && (
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Price Impact:</span>
                  <span className={priceImpact < 1 ? 'text-green-400' : priceImpact < 3 ? 'text-yellow-400' : 'text-red-400'}>
                    {priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Route:</span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Yellow Network
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span>~0.1% (State Channel)</span>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {lastTxHash && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400 font-medium">✅ Yellow Network swap successful!</p>
                <p className="text-xs text-green-300 mt-1">
                  Hash: <span className="font-mono">{lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}</span>
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400 font-medium">❌ Yellow Network Error</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            )}

            {/* Swap Button */}
            <div className="mt-8 space-y-3">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={sellAmount === '0' || isCalculating || isSwapping || !buyToken || !isConnected}
                onClick={executeSwap}
              >
                {isSwapping ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Swapping via Yellow Network...</span>
                  </div>
                ) : sellAmount === '0' ? (
                  'Enter an amount'
                ) : !buyToken ? (
                  'Select a token to buy'
                ) : !isConnected ? (
                  'Connect to Yellow Network'
                ) : (
                  `Swap ${sellToken.symbol} for ${buyToken.symbol}`
                )}
              </Button>
              
              {/* Additional Info */}
              <div className="text-center space-y-2">
                <div className="text-xs text-muted-foreground">
                  Powered by Yellow Network's state channels for instant settlement
                </div>
                <div className="text-xs text-muted-foreground">
                  Cross-chain • Non-custodial • High-speed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TokenSelectorModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelectToken={handleTokenSelect}
      />
    </>
  );
};

export default YellowSwapCard;
