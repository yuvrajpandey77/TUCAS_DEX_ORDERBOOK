import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDEXStore } from '@/store/dex-store';
import { formatAddress, formatTokenAmount } from '@/lib/utils';
import { Wallet, Menu, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Coins, RefreshCw, Loader2 } from 'lucide-react';
import ConnectWallet from './ConnectWallet';
import WalletDebugInfo from './WalletDebugInfo';
import { useWallet } from '@/hooks/useWallet';
import { walletService } from '@/services/wallet-service';

interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
  isNative: boolean;
}

interface BalanceLoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  retryCount: number;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnectWalletOpen, setIsConnectWalletOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [_, setUserBalances] = useState<{ [key: string]: string }>({});
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [balanceLoadingState, setBalanceLoadingState] = useState<BalanceLoadingState>({
    isLoading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0
  });
  
  const { selectedPair } = useDEXStore();
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'wrong-network' | 'error'>('checking');
  
  // Use the new wallet hook for enhanced functionality
  const {
    isConnected,
    address: account,
    // nativeBalance,
    // tokenBalances: newTokenBalances,
    fetchAllBalances,
    disconnectWallet,
    // error: walletError,
    // clearError: clearWalletError,
    isLoading,
    isAutoReconnecting,
  } = useWallet();
  
  const location = useLocation();
  const tokenDropdownRef = useRef<HTMLDivElement>(null);
  
  // Avoid brief button swap flashes during route changes or wallet rehydration
  const shouldShowDisconnectButton = isConnected;
  const shouldShowConnectButton = !isConnected && !isLoading && !isAutoReconnecting;

  // Check network status (Polygon Amoy)
  React.useEffect(() => {
    const provider = walletService.getProvider();
    if (!isConnected || !provider) {
      setNetworkStatus('checking');
      return;
    }

    const checkNetwork = async () => {
      try {
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();
        if (chainId === '80002' || chainId === '0x13882') {
          setNetworkStatus('connected');
        } else {
          setNetworkStatus('wrong-network');
        }
      } catch (error) {
        console.error('Network check failed:', error);
        setNetworkStatus('error');
      }
    };

    checkNetwork();

    const eth = (window as any).ethereum;
    const handleChainChanged = () => checkNetwork();
    if (eth && eth.on) eth.on('chainChanged', handleChainChanged);
    return () => {
      if (eth && eth.removeListener) eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected]);

  // Fetch all user balances when connected
  useEffect(() => {
    const fetchAllUserBalances = async () => {
      if (!account) return;
      
      const signer = walletService.getSigner();
      if (!signer) return;

      try {
        setBalanceLoadingState(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }));
        
        
        // Use the new wallet service for fetching balances
        if (account) {
          try {
            const allBalances = await fetchAllBalances([], account);
            
            // Convert to the old format for backward compatibility
            const balances: TokenBalance[] = [];
            
            // Add native balance
            if (allBalances.native) {
              balances.push({
                address: '0x0000000000000000000000000000000000000000',
                symbol: allBalances.native.symbol,
                balance: allBalances.native.balance,
                decimals: 18,
                isNative: true
              });
            }
            
            // Add token balances
            allBalances.tokens.forEach(token => {
              balances.push({
                address: token.address || '',
                symbol: token.symbol,
                balance: token.balance,
                decimals: token.decimals,
                isNative: false
              });
            });
            
            setTokenBalances(balances);
            
            // Update the old userBalances format for backward compatibility
            const balanceMap: { [key: string]: string } = {};
            balances.forEach(token => {
              balanceMap[token.address] = token.balance;
            });
            setUserBalances(balanceMap);
            
            setBalanceLoadingState(prev => ({
              ...prev,
              isLoading: false,
              error: null,
              lastUpdated: new Date(),
              retryCount: 0
            }));
            
          } catch (error) {
            console.error('Error fetching balances with new service:', error);
            // Fallback to old method if new service fails
            throw error;
          }
        }
      } catch (error) {
        console.error('Navbar: Failed to fetch user balances:', error);
        setBalanceLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load balances. Please try again.',
          retryCount: prev.retryCount + 1
        }));
        
        // Set some test data for debugging
        setTokenBalances([
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'MATIC',
            balance: '1000000000000000000000', // 1000 MATIC
            decimals: 18,
            isNative: true
          }
        ]);
      }
    };

    if (isConnected && account) {
      fetchAllUserBalances();
    }
  }, [isConnected, account, selectedPair, fetchAllBalances]);

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'wrong-network':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
    }
  };

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'connected':
        return 'Polygon Amoy';
      case 'wrong-network':
        return 'Wrong Network';
      case 'error':
        return 'Network Error';
      default:
        return 'Checking...';
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
    };

    if (isTokenDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTokenDropdownOpen]);

  const refreshBalances = async () => {
    if (!isConnected || !account) return;
    
    const signer = walletService.getSigner();
    if (!signer) return;
    
    try {
      setBalanceLoadingState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      // Use the new wallet service to refresh balances
      if (account) {
        const allBalances = await fetchAllBalances([], account);
        
        // Convert to the old format for backward compatibility
        const balances: TokenBalance[] = [];
        
        // Add native balance
        if (allBalances.native) {
          balances.push({
            address: '0x0000000000000000000000000000000000000000',
            symbol: allBalances.native.symbol,
            balance: allBalances.native.balance,
            decimals: 18,
            isNative: true
          });
        }
        
        // Add token balances
        allBalances.tokens.forEach(token => {
          balances.push({
            address: token.address || '',
            symbol: token.symbol,
            balance: token.balance,
            decimals: token.decimals,
            isNative: false
          });
        });
        
        setTokenBalances(balances);
        
        // Update the old userBalances format for backward compatibility
        const balanceMap: { [key: string]: string } = {};
        balances.forEach(token => {
          balanceMap[token.address] = token.balance;
        });
        setUserBalances(balanceMap);
        
        setBalanceLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          retryCount: 0
        }));
        
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error);
      setBalanceLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh balances. Please try again.',
        retryCount: prev.retryCount + 1
      }));
    }
  };

  // Get the primary balance to show in the header (native token or first available)
  const getPrimaryBalance = () => {
    const nativeToken = tokenBalances.find(token => token.isNative);
    if (nativeToken && nativeToken.balance !== '0') {
      return { symbol: nativeToken.symbol, balance: nativeToken.balance };
    }
    
    const firstToken = tokenBalances.find(token => token.balance !== '0');
    if (firstToken) {
      return { symbol: firstToken.symbol, balance: firstToken.balance };
    }
    
    // Default to MATIC for Polygon network, or ETH for other networks
    const currentChainId = walletService.getState().chainId;
    const defaultSymbol = currentChainId === '80002' || currentChainId === '0x13882' ? 'MATIC' : 'ETH';
    return { symbol: defaultSymbol, balance: '0' };
  };

  const primaryBalance = getPrimaryBalance();

  // Skeleton loading component for balance display
  const BalanceSkeleton = () => (
    <div className="flex items-center space-x-2 animate-pulse">
      <div className="w-4 h-4 bg-muted rounded"></div>
      <div className="w-20 h-4 bg-muted rounded"></div>
    </div>
  );

  // Error state component
  const BalanceError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex items-center space-x-2 text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span className="text-xs">{error}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="h-4 w-4 p-0 hover:bg-destructive/10"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );

  // Format last updated time
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <nav className="bg-background/20 backdrop-blur-xl border-b border-white/10 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out shadow-lg shadow-black/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[auto,1fr,auto] items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/tucas.webp" 
                alt="Tucas DEX Logo" 
                className="w-16 h-16 rounded-lg"
              />
              <span className="text-xl font-bold text-foreground font-heading">Tucas</span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center justify-center gap-3">
            <Link
              to="/swap"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/swap') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              Swap
            </Link>
            <Link
              to="/trading"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/trading') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              Advanced Trading
            </Link>
            <Link
              to="/limit"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/limit') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              Limit Trading
            </Link>
            <Link
              to="/explore"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/explore') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              Explore
            </Link>
            <Link
              to="/pool"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/pool') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              Pool
            </Link>
          </div>

          {/* Right: Balance / Connect */}
          <div className="hidden md:flex items-center justify-end space-x-4 w-[360px]">
            {/* User Token Balance + Network Status (stacked) */}
            {isConnected && (
              <div className="relative" ref={tokenDropdownRef}>
                <button
                  onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:scale-105 border border-white/20 w-[200px]"
                  disabled={balanceLoadingState.isLoading}
                >
                  <Coins className="h-4 w-4 text-primary transition-transform duration-300" />
                  <span className="text-sm font-medium">
                    {balanceLoadingState.isLoading ? (
                      <BalanceSkeleton />
                    ) : balanceLoadingState.error ? (
                      <BalanceError 
                        error={balanceLoadingState.error} 
                        onRetry={refreshBalances}
                      />
                    ) : primaryBalance.balance !== '0' ? (
                      `${formatTokenAmount(primaryBalance.balance)} ${primaryBalance.symbol}`
                    ) : (
                      `0.000 ${primaryBalance.symbol}`
                    )}
                  </span>
                  <div className="flex items-center space-x-1 transition-transform duration-300">
                    {balanceLoadingState.isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {isTokenDropdownOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </button>

                {/* Network status below balance toggle */}
                {/* <div className="mt-1 h-5 flex items-center space-x-2 text-xs text-muted-foreground">
                  <div>{getNetworkStatusIcon()}</div>
                  <span>{getNetworkStatusText()}</span>
                  {networkStatus === 'wrong-network' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await walletService.switchToPolygonNetwork();
                        } catch (e) {
                          console.error('Failed to switch network', e);
                        }
                      }}
                      className="h-6 px-2"
                    >
                      Switch
                    </Button>
                  )}
                </div> */}
                
                {isTokenDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-background/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl shadow-black/10 py-3 z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="px-4 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-foreground">Your Balances</h3>
                        {balanceLoadingState.lastUpdated && (
                          <span className="text-xs text-muted-foreground">
                            {formatLastUpdated(balanceLoadingState.lastUpdated)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-4 py-2 space-y-2 max-h-60 overflow-y-auto">
                      {balanceLoadingState.isLoading ? (
                        // Skeleton loading for balance list
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex justify-between items-center py-1 animate-pulse">
                            <div className="flex items-center space-x-2">
                              <div className="w-12 h-4 bg-muted rounded"></div>
                              <div className="w-8 h-3 bg-muted rounded"></div>
                            </div>
                            <div className="w-16 h-4 bg-muted rounded"></div>
                          </div>
                        ))
                      ) : balanceLoadingState.error ? (
                        <div className="text-center py-4">
                          <div className="text-sm text-destructive mb-2">
                            {balanceLoadingState.error}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshBalances}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      ) : tokenBalances.length === 0 ? (
                        <div className="text-center py-4">
                          <div className="text-sm text-muted-foreground">
                            No tokens found
                          </div>
                        </div>
                      ) : (
                        tokenBalances.map((token, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{token.symbol}</span>
                              {token.isNative && (
                                <Badge variant="outline" className="text-xs">Native</Badge>
                              )}
                            </div>
                            <span className="text-sm font-mono">
                              {formatTokenAmount(token.balance)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-border/20">
                      <div className="text-xs text-muted-foreground">
                        {formatAddress(account || '')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {shouldShowDisconnectButton ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={disconnectWallet}
                  className="border-border/20 transition-all duration-300 ease-in-out transform hover:scale-105 w-[120px]"
                >
                  Disconnect
                </Button>
              </div>
            ) : shouldShowConnectButton ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    setIsConnectWalletOpen(true);
                  }}
                  disabled={isLoading}
                  className="transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 w-4 mr-2 transition-transform duration-300" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden justify-self-end">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary p-2 transition-all duration-300 ease-in-out transform hover:scale-110"
            >
              <div className="transition-transform duration-300">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 backdrop-blur-xl bg-background/20 transition-all duration-300 ease-in-out">
          <div className="px-2 pt-2 pb-3 space-y-2">
            <Link
              to="/trading"
              className={`block px-3 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/trading') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-white/10 backdrop-blur-sm text-foreground hover:bg-white/20 border border-white/20'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Advanced Trading
            </Link>
            <Link
              to="/limit"
              className={`block px-3 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/limit') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-white/10 backdrop-blur-sm text-foreground hover:bg-white/20 border border-white/20'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Limit Trading
            </Link>
            <Link
              to="/explore"
              className={`block px-3 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/explore') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-white/10 backdrop-blur-sm text-foreground hover:bg-white/20 border border-white/20'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/pool"
              className={`block px-3 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isActiveRoute('/pool') 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-white/10 backdrop-blur-sm text-foreground hover:bg-white/20 border border-white/20'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pool
            </Link>
            
            <div className="px-3 pt-3 space-y-2">
              {/* Network Status for Mobile */}
              {isConnected && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground px-3 py-2">
                  {getNetworkStatusIcon()}
                  <span>{getNetworkStatusText()}</span>
                </div>
              )}
              
              {/* User Token Balance for Mobile */}
              {isConnected && (
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Your Balances</span>
                    </div>
                    {balanceLoadingState.lastUpdated && (
                      <span className="text-xs text-muted-foreground">
                        {formatLastUpdated(balanceLoadingState.lastUpdated)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 pl-6">
                    {balanceLoadingState.isLoading ? (
                      // Skeleton loading for mobile
                      Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="flex justify-between items-center text-xs animate-pulse">
                          <div className="flex items-center space-x-1">
                            <div className="w-8 h-3 bg-muted rounded"></div>
                            <div className="w-6 h-2 bg-muted rounded"></div>
                          </div>
                          <div className="w-12 h-3 bg-muted rounded"></div>
                        </div>
                      ))
                    ) : balanceLoadingState.error ? (
                      <div className="text-xs text-destructive">
                        {balanceLoadingState.error}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refreshBalances}
                          className="ml-2 h-4 w-4 p-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : tokenBalances.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No tokens found
                      </div>
                    ) : (
                      tokenBalances.map((token, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-muted-foreground">{token.symbol}</span>
                            {token.isNative && (
                              <Badge variant="outline" className="text-xs">Native</Badge>
                            )}
                          </div>
                          <span className="font-medium">
                            {formatTokenAmount(token.balance)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {isConnected ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {formatAddress(account || '')}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm" 
                    onClick={disconnectWallet}
                  >
                    Disconnect
                  </Button>
                  
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="default" 
                    className="w-full" 
                    size="sm" 
                    onClick={() => {
                      setIsConnectWalletOpen(true);
                    }}
                    disabled={isLoading || isAutoReconnecting}
                  >
                    {isAutoReconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reconnecting...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                  
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet Modal */}
      <ConnectWallet 
        isOpen={isConnectWalletOpen} 
        onClose={() => setIsConnectWalletOpen(false)} 
      />

      {/* Wallet Debug Modal */}
      <WalletDebugInfo 
        isOpen={isDebugModalOpen} 
        onClose={() => setIsDebugModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;