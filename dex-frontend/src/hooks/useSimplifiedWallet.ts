import { useState, useEffect } from 'react';
import { simplifiedWalletService, WalletState } from '@/services/simplified-wallet-service';

export const useSimplifiedWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>(simplifiedWalletService.getState());

  useEffect(() => {
    const unsubscribe = simplifiedWalletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  const connect = async () => {
    try {
      return await simplifiedWalletService.connect();
    } catch (error) {
      throw error;
    }
  };

  const disconnect = () => {
    simplifiedWalletService.disconnect();
  };

  const reconnect = async () => {
    try {
      return await simplifiedWalletService.reconnect();
    } catch (error) {
      throw error;
    }
  };

  const switchToMainnet = async () => {
    try {
      return await simplifiedWalletService.switchToMainnet();
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    simplifiedWalletService.clearError();
  };

  return {
    // State
    isConnected: walletState.isConnected,
    address: walletState.address,
    provider: walletState.provider,
    signer: walletState.signer,
    chainId: walletState.chainId,
    networkName: walletState.networkName,
    error: walletState.error,
    isLoading: walletState.isLoading,

    // Computed
    isMetaMaskAvailable: simplifiedWalletService.isMetaMaskAvailable(),
    isOnCorrectNetwork: simplifiedWalletService.isOnCorrectNetwork(),
    formattedAddress: walletState.address ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}` : null,

    // Actions
    connect,
    disconnect,
    reconnect,
    switchToMainnet,
    clearError,
  };
};
