import { useState, useEffect, useCallback } from 'react';
import { walletService, type WalletState } from '@/services/wallet-service';
import { tokenService, type NativeTokenBalance, type TokenBalance } from '@/services/token-service';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedWalletState extends WalletState {
  nativeBalance: NativeTokenBalance | null;
  tokenBalances: TokenBalance[];
  isAutoReconnecting: boolean;
}

export const useWallet = () => {
  const { toast } = useToast();
  // Initialize from the current wallet service state to avoid a one-frame mismatch on mount
  const [state, setState] = useState<EnhancedWalletState>(() => {
    const base = walletService.getState();
    return {
      ...base,
      nativeBalance: null,
      tokenBalances: [],
      isAutoReconnecting: false,
    };
  });

  // Subscribe to wallet service state changes
  useEffect(() => {
    const unsubscribe = walletService.subscribe((walletState) => {
      setState(prev => {
        const wasAutoReconnecting = prev.isAutoReconnecting;
        const newState = {
          ...prev,
          ...walletState,
          // Don't show auto-reconnection as loading to user
          isLoading: walletState.isLoading && !prev.isAutoReconnecting,
        };

        // Show success toast for auto-reconnection
        if (wasAutoReconnecting && walletState.isConnected && walletState.address) {
          toast({
            title: "Wallet Reconnected",
            description: `Successfully reconnected: ${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`,
            variant: "default",
          });
        }

        return newState;
      });
    });

    return unsubscribe;
  }, [toast]);

  // Check for auto-reconnection on mount
  useEffect(() => {
    const checkAutoReconnection = async () => {
      try {
        setState(prev => ({ ...prev, isAutoReconnecting: true }));
        
        // Check if we have a stored connection
        const storedConnection = localStorage.getItem('wallet_connection');
        if (storedConnection) {
          
          // The wallet service will handle the auto-reconnection
          // We just need to wait a bit for it to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
      } finally {
        setState(prev => ({ ...prev, isAutoReconnecting: false }));
      }
    };

    checkAutoReconnection();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      const address = await walletService.connect();
      
      
      // Show success toast
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to wallet: ${address.slice(0, 6)}...${address.slice(-4)}`,
        variant: "default",
      });
      
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      
      // Show error toast
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    walletService.disconnect();
    setState(prev => ({
      ...prev,
      nativeBalance: null,
      tokenBalances: [],
    }));
    
    // Show disconnect toast
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
      variant: "default",
    });
  }, [toast]);

  // Fetch native token balance
  const fetchNativeBalance = useCallback(async (address?: string) => {
    if (!state.isConnected && !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await tokenService.getBalance(address || state.address || undefined);
      
      setState(prev => ({
        ...prev,
        nativeBalance: balance,
        error: null,
      }));
      
      return balance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch native balance';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.isConnected, state.address]);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async (tokenAddresses: string[], userAddress?: string) => {
    if (!state.isConnected && !userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const balances = await tokenService.getMultipleTokenBalances(
        tokenAddresses, 
        userAddress || state.address || undefined
      );
      
      setState(prev => ({
        ...prev,
        tokenBalances: balances,
        error: null,
      }));
      
      return balances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token balances';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.isConnected, state.address]);

  // Fetch all balances
  const fetchAllBalances = useCallback(async (tokenAddresses: string[] = [], userAddress?: string) => {
    if (!state.isConnected && !userAddress) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const allBalances = await tokenService.getAllBalances(
        tokenAddresses, 
        userAddress || state.address || undefined
      );
      
      setState(prev => ({
        ...prev,
        nativeBalance: allBalances.native,
        tokenBalances: allBalances.tokens,
        isLoading: false,
        error: null,
      }));
      
      return allBalances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balances';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [state.isConnected, state.address]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset wallet state
  const resetWallet = useCallback(() => {
    walletService.disconnect();
    setState(prev => ({
      ...prev,
      nativeBalance: null,
      tokenBalances: [],
    }));
  }, []);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    fetchNativeBalance,
    fetchTokenBalances,
    fetchAllBalances,
    clearError,
    resetWallet,
  };
}; 