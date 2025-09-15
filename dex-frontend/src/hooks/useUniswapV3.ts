import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  uniswapV3Service, 
  type SwapParams, 
  type TokenBalance 
} from '@/services/uniswap-v3-service';
import { TOKENS } from '@/config/uniswap-v3';

// Hook for managing wallet connection
export const useWallet = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setIsConnected(true);

      // Update the service with the new signer
      uniswapV3Service.setSigner(signer);

      return { provider, signer, address };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress('');
    setIsConnected(false);
  }, []);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, [connectWallet]);

  return {
    provider,
    signer,
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
  };
};

// Hook for getting swap quotes
export const useSwapQuote = (params: SwapParams | null) => {
  return useQuery({
    queryKey: ['swapQuote', params],
    queryFn: async () => {
      if (!params) return null;
      console.log('Fetching quote for params:', params);
      return await uniswapV3Service.getSwapQuote(params);
    },
    enabled: !!params && !!params.amountIn && parseFloat(params.amountIn) > 0,
    staleTime: 0, // No stale time - always refetch
    refetchInterval: false, // No automatic refetch
  });
};

// Hook for executing swaps
export const useSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SwapParams) => {
      return await uniswapV3Service.executeSwap(params);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful swap
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['swapQuote'] });
    },
  });
};

// Hook for getting token balances
export const useTokenBalances = (address: string) => {
  return useQuery({
    queryKey: ['tokenBalance', address],
    queryFn: async () => {
      if (!address) return {};
      
      const balances: Record<string, TokenBalance> = {};
      
      for (const [symbol, token] of Object.entries(TOKENS)) {
        const balance = await uniswapV3Service.getTokenBalance(token.address, address);
        if (balance) {
          balances[symbol] = balance;
        }
      }
      
      return balances;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

// Hook for getting pool information
export const usePoolInfo = (pair: 'ETH_USDC' = 'ETH_USDC') => {
  return useQuery({
    queryKey: ['poolInfo', pair],
    queryFn: async () => {
      return await uniswapV3Service.getPoolInfo(pair);
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

// Hook for token approval
export const useTokenApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tokenAddress, 
      spender, 
      amount 
    }: { 
      tokenAddress: string; 
      spender: string; 
      amount: string; 
    }) => {
      return await uniswapV3Service.approveToken(tokenAddress, spender, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenApproval'] });
    },
  });
};

// Hook for checking token approval
export const useTokenApprovalStatus = (tokenAddress: string, spender: string, owner: string) => {
  return useQuery({
    queryKey: ['tokenApproval', tokenAddress, spender, owner],
    queryFn: async () => {
      return await uniswapV3Service.isTokenApproved(tokenAddress, spender, owner);
    },
    enabled: !!tokenAddress && !!spender && !!owner,
    staleTime: 30000, // 30 seconds
  });
};

// Hook for getting gas price
export const useGasPrice = () => {
  return useQuery({
    queryKey: ['gasPrice'],
    queryFn: async () => {
      return await uniswapV3Service.getGasPrice();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

// Hook for getting network information
export const useNetworkInfo = () => {
  return useQuery({
    queryKey: ['networkInfo'],
    queryFn: async () => {
      return await uniswapV3Service.getNetworkInfo();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

// Main hook that combines everything
export const useUniswapV3 = () => {
  const wallet = useWallet();
  const gasPrice = useGasPrice();
  const networkInfo = useNetworkInfo();

  const tokenBalances = useTokenBalances(wallet.address);
  const poolInfo = usePoolInfo();

  // Helper function to create swap params
  const createSwapParams = useCallback((
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance?: number
  ): SwapParams => ({
    tokenIn,
    tokenOut,
    amountIn,
    slippageTolerance: slippageTolerance ?? 50, // Default to 0.5%
    recipient: wallet.address,
  }), [wallet.address]);

  // Helper function to get token by address
  const getTokenByAddress = useCallback((address: string) => {
    return Object.values(TOKENS).find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    );
  }, []);

  // Helper function to format token amount
  const formatTokenAmount = useCallback((amount: string, decimals: number) => {
    return ethers.formatUnits(amount, decimals);
  }, []);

  // Helper function to parse token amount
  const parseTokenAmount = useCallback((amount: string, decimals: number) => {
    return ethers.parseUnits(amount, decimals).toString();
  }, []);

  // Helper function to get token balance by address
  const getTokenBalance = useCallback((tokenAddress: string) => {
    if (!wallet.address || !tokenBalances.data) return '0';
    
    const token = getTokenByAddress(tokenAddress);
    if (!token) return '0';
    
    const balance = tokenBalances.data[token.symbol || 'UNKNOWN'];
    if (!balance) return '0';
    
    return formatTokenAmount(balance.balance, balance.decimals);
  }, [wallet.address, tokenBalances.data, getTokenByAddress, formatTokenAmount]);

  return {
    // Wallet
    ...wallet,
    
    // Data
    tokenBalances: tokenBalances.data || {},
    poolInfo: poolInfo.data,
    gasPrice: gasPrice.data,
    networkInfo: networkInfo.data,
    
    // Loading states
    isLoadingBalances: tokenBalances.isLoading,
    isLoadingPoolInfo: poolInfo.isLoading,
    isLoadingGasPrice: gasPrice.isLoading,
    isLoadingNetworkInfo: networkInfo.isLoading,
    
    // Helper functions
    createSwapParams,
    getTokenByAddress,
    getTokenBalance,
    formatTokenAmount,
    parseTokenAmount,
    
    // Available tokens
    tokens: TOKENS,
  };
};
