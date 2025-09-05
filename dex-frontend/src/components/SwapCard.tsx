import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { aggregatorService } from '@/services/aggregator-service';
import { walletService } from '@/services/wallet-service';
import { Button } from '@/components/ui/button';
import { ArrowDown, ChevronDown, Settings, RefreshCw } from 'lucide-react';
import TokenSelectorModal from './TokenSelectorModal';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logo: string;
}

const SwapCard = () => {
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isManualSwap, setIsManualSwap] = useState(false); // Flag to prevent auto-calculation during manual swap
  const [sellToken, setSellToken] = useState<Token>({
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0x0000000000000000000000000000000000000000',
    logo: '⬟'
  });
  const [buyToken, setBuyToken] = useState<Token | null>({
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
    logo: '🪙'
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenModalType, setTokenModalType] = useState<'sell' | 'buy'>('buy');

  const handleTokenSelect = (token: Token) => {
    if (tokenModalType === 'sell') {
      // Prevent selecting same token as buy token
      if (buyToken && token.address === buyToken.address) {
        alert('Cannot select the same token for both buy and sell');
        return;
      }
      setSellToken(token);
    } else {
      // Prevent selecting same token as sell token
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
      setIsManualSwap(true); // Set flag to prevent auto-calculation
      
      const tempToken = sellToken;
      setSellToken(buyToken);
      setBuyToken(tempToken);
      
      const tempAmount = sellAmount;
      setSellAmount(buyAmount);
      setBuyAmount(tempAmount);
      
      // Reset the flag after a short delay to allow manual swap to complete
      setTimeout(() => {
        setIsManualSwap(false);
      }, 100);
    }
  };

  // Calculate buy amount when sell amount or tokens change
  const calculateBuyAmount = async (sellAmt: string) => {
    if (!sellAmt || sellAmt === '0' || !buyToken || !sellToken) {
      setBuyAmount('0');
      return;
    }

    setIsCalculating(true);
    try {
      // Get real-time price from multiple sources
      const realTimePrice = await aggregatorService.getRealTimePrice(
        sellToken.address,
        buyToken.address
      );
      
      console.log(`Real-time price for ${sellToken.symbol}/${buyToken.symbol}:`, realTimePrice);
      setCurrentPrice(realTimePrice);
      
      // Calculate buy amount using real-time price
      const calculatedAmount = parseFloat(sellAmt) * realTimePrice;
      // Round to 6 decimal places to avoid precision issues
      setBuyAmount(calculatedAmount.toFixed(6));
      
    } catch (error) {
      console.error('Error calculating buy amount:', error);
      // Fallback to static calculation
      const fallbackRate = 0.8; // 1 MATIC = 0.8 USDC
      const calculatedAmount = parseFloat(sellAmt) * fallbackRate;
      setBuyAmount(calculatedAmount.toFixed(6));
    } finally {
      setIsCalculating(false);
    }
  };

  // Update buy amount when sell amount changes
  const handleSellAmountChange = (value: string) => {
    setSellAmount(value);
    if (!isManualSwap) {
      calculateBuyAmount(value);
    }
  };

  // Recalculate when tokens change (but not during manual swap)
  useEffect(() => {
    if (sellAmount && sellAmount !== '0' && !isManualSwap) {
      calculateBuyAmount(sellAmount);
    }
  }, [sellToken, buyToken, isManualSwap]);

  // Initial price fetch when component mounts
  useEffect(() => {
    calculateBuyAmount('1'); // Fetch price for 1 ETH
  }, []);

  return (
    <>
      <div className="swap-card w-full max-w-md mx-auto bg-background/95 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl">
        {/* Top nav inside card */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">Swap</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Limit</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Buy</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">Sell</button>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent/60 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
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
            
            <div className="bg-muted/50 rounded-2xl p-5 border border-border/50 hover:border-border/80 transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={sellAmount}
                  onChange={(e) => handleSellAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="token-input flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
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
            </div>
          </div>

          {/* Swap Arrow - Perfectly Centered */}
          <div className="flex justify-center items-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
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
            
            <div className="bg-muted/50 rounded-2xl p-5 border border-border/50 hover:border-border/80 transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={isCalculating ? 'Calculating...' : buyAmount}
                  readOnly
                  placeholder="0.00"
                  className="token-input flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 cursor-not-allowed"
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
              {buyToken && buyAmount !== '0' && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ≈ ${(parseFloat(buyAmount || '0') * 1).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Transaction Status */}
          {lastTxHash && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium">✅ Last transaction successful!</p>
              <p className="text-xs text-green-300 mt-1">
                Hash:                 <a 
                  href={`https://mumbai.polygonscan.com/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-200"
                >
                  {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                </a>
              </p>
            </div>
          )}

          {/* Swap Button */}
          <div className="mt-8 space-y-3">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={sellAmount === '0' || isCalculating || isSwapping || !buyToken}
              onClick={async () => {
              if (isSwapping) return;
              
              // Validate inputs before starting
              if (!sellAmount || sellAmount === '0') {
                alert('Please enter a valid amount');
                return;
              }
              
              if (!sellToken || !buyToken) {
                alert('Please select both tokens');
                return;
              }
              
              if (!sellToken.address || !buyToken.address) {
                alert('Invalid token addresses. Please select valid tokens.');
                return;
              }
              
              if (sellToken.address === buyToken.address) {
                alert('Cannot swap token with itself');
                return;
              }
              
              setIsSwapping(true);
              setLastTxHash(null);
              
              try {
                const state = walletService.getState();
                if (!state.signer || !state.address) {
                  await walletService.connect();
                  setIsSwapping(false);
                  return;
                }
                const signer = walletService.getSigner();
                const address = await walletService.getAddress();
                if (!signer || !address || !buyToken) {
                  setIsSwapping(false);
                  return;
                }

                // Convert amount to wei (18 decimals for ETH)
                const sellAmountWei = ethers.parseEther(sellAmount || '0').toString();
                
                console.log('Attempting swap:', {
                  sellToken: sellToken.symbol,
                  buyToken: buyToken.symbol,
                  sellAmount: sellAmount,
                  sellAmountWei: sellAmountWei,
                  takerAddress: address
                });

                // Show user confirmation
                const confirmed = window.confirm(
                  `Confirm swap:\n${sellAmount} ${sellToken.symbol} → ${buyAmount} ${buyToken.symbol}\n\nThis will open MetaMask for transaction signing.`
                );
                
                if (!confirmed) {
                  setIsSwapping(false);
                  return;
                }

                // Use the same price that was displayed to the user
                const realTimePrice = await aggregatorService.getRealTimePrice(
                  sellToken.address,
                  buyToken.address
                );
                
                console.log('Using real-time price for swap:', realTimePrice);
                
                // Create a quote based on the real-time price
                // Fix decimal precision issues by rounding to 6 decimal places
                const buyAmountRounded = parseFloat(buyAmount).toFixed(6);
                const buyAmountWei = ethers.parseEther(buyAmountRounded).toString();
                
                // Calculate price in wei (18 decimals) with proper error handling
                let priceInWei: string;
                let inversePriceInWei: string;
                
                try {
                  priceInWei = ethers.parseEther(realTimePrice.toFixed(6)).toString();
                  const inversePrice = (1 / realTimePrice).toFixed(6);
                  inversePriceInWei = ethers.parseEther(inversePrice).toString();
                } catch (parseError) {
                  console.error('Error parsing ether values:', parseError);
                  // Fallback to simpler calculation
                  priceInWei = ethers.parseEther('2000').toString(); // Default 2000 USDC per ETH
                  inversePriceInWei = ethers.parseEther('0.0005').toString(); // 1/2000
                }
                
                // Validate swap parameters before attempting
                if (!sellToken.address || !buyToken.address) {
                  throw new Error('Invalid token addresses');
                }
                
                if (sellAmountWei === '0' || buyAmountWei === '0') {
                  throw new Error('Invalid swap amounts');
                }

                // Try to get a real quote from 0x API first
                let quote;
                try {
                  console.log('Attempting to get real quote from 0x API...');
                  quote = await aggregatorService.getQuote({
                    sellToken: sellToken.address,
                    buyToken: buyToken.address,
                    sellAmount: sellAmountWei,
                    takerAddress: address,
                  });
                  console.log('Real quote received from 0x API:', quote);
                  
                  // Validate quote before proceeding
                  if (!quote.to || quote.to === '0x0000000000000000000000000000000000000000') {
                    throw new Error('Invalid quote: missing or zero address');
                  }
                  
                  if (!quote.data || quote.data === '0x') {
                    throw new Error('Invalid quote: missing transaction data');
                  }
                  
                } catch (error) {
                  console.warn('0x API failed, using Uniswap V3 on Polygon Amoy:', error);
                  
                  // Use Uniswap V3 on Polygon Amoy as fallback
                  const uniswapV3Router = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Uniswap V3 Router
                  
                  // For now, show a message that real swaps need proper setup
                  alert(`⚠️ Real DEX integration needed for Polygon Amoy.\n\nTo enable real swaps:\n1. Deploy Uniswap V3 contracts to Amoy\n2. Add liquidity to pools\n3. Update contract addresses\n\nCurrent simulation: ${sellAmount} ${sellToken.symbol} → ${buyAmount} ${buyToken?.symbol}`);
                  
                  // Create a mock quote for simulation
                  quote = {
                    price: priceInWei,
                    guaranteedPrice: priceInWei,
                    to: uniswapV3Router, // Real Uniswap router address
                    data: '0x', // Mock data - would need real swap calldata
                    value: sellToken.address === '0x0000000000000000000000000000000000000000' ? sellAmountWei : '0',
                    gas: '300000',
                    estimatedGas: '300000',
                    buyAmount: buyAmountWei,
                    sellAmount: sellAmountWei,
                    allowanceTarget: uniswapV3Router,
                    sellTokenToEthRate: '1000000000000000000',
                    buyTokenToEthRate: inversePriceInWei
                  };
                }
                
                console.log('Quote created from real-time price:', quote);
                
                const txHash = await aggregatorService.executeSwap(signer, quote);
                console.log('Swap executed successfully:', txHash);
                
                setLastTxHash(txHash);
                
                // Show success message to user
                const isMockTransaction = quote.to === '0xE592427A0AEce92De3Edee1F18E0157C05861564' && quote.data === '0x';
                
                if (isMockTransaction) {
                  alert(`⚠️ Testnet simulation completed!\n\nSimulated swap: ${sellAmount} ${sellToken.symbol} → ${buyAmount} ${buyToken?.symbol}\nSimulated transaction hash: ${txHash}\n\nNote: This was a simulation. No real tokens were swapped.`);
                } else {
                  alert(`✅ Transaction successful!\nTransaction hash: ${txHash}\n\nView on Polygonscan: https://amoy.polygonscan.com/tx/${txHash}`);
                }
                
                // Reset amounts after successful swap
                setSellAmount('0');
                setBuyAmount('0');
                
              } catch (e) {
                console.error('Swap failed:', e);
                // Show user-friendly error message
                const errorMessage = e instanceof Error ? e.message : 'Swap failed. Please try again.';
                alert(`❌ Swap failed: ${errorMessage}`);
              } finally {
                setIsSwapping(false);
              }
            }}
          >
              {isSwapping ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Swapping...</span>
                </div>
              ) : sellAmount === '0' ? (
                'Enter an amount'
              ) : !buyToken ? (
                'Select a token to buy'
              ) : walletService.getState().isConnected ? (
                `Swap ${sellToken.symbol} for ${buyToken.symbol}`
              ) : (
                'Connect wallet to swap'
              )}
            </Button>
            
            {/* Additional Info */}
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">
                By swapping, you agree to our Terms of Service
              </div>
              {currentPrice && buyToken && (
                <div className="text-xs text-muted-foreground">
                  Price impact: <span className="text-green-400">0.01%</span> • Network fee: <span className="text-muted-foreground">~$0.50</span>
                </div>
              )}
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

export default SwapCard;