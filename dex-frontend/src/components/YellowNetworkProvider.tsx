import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { yellowNetworkService } from '@/services/yellow-network-service';
import { yellowWalletService } from '@/services/yellow-wallet-service';

interface YellowNetworkContextType {
  isInitialized: boolean;
  isConnected: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const YellowNetworkContext = createContext<YellowNetworkContextType | null>(null);

export const useYellowNetwork = () => {
  const context = useContext(YellowNetworkContext);
  if (!context) {
    throw new Error('useYellowNetwork must be used within a YellowNetworkProvider');
  }
  return context;
};

interface YellowNetworkProviderProps {
  children: React.ReactNode;
}

export const YellowNetworkProvider: React.FC<YellowNetworkProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializationAttempted = useRef(false);

  const initialize = async () => {
    try {
      setError(null);
      
      // Initialize in mock mode for now
      // In a real implementation, this would connect to wallet and initialize services
      console.log('Initializing Yellow Network in mock mode...');
      
      setIsInitialized(true);
      setIsConnected(true);
      
      console.log('Yellow Network initialized successfully (mock mode)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Yellow Network';
      setError(errorMessage);
      console.error('Yellow Network initialization failed:', err);
      
      // Still mark as initialized in mock mode
      setIsInitialized(true);
      setIsConnected(false);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      // Connect wallet
      await yellowWalletService.connect();
      
      // Initialize Yellow Network if not already done
      if (!isInitialized) {
        await initialize();
      }
      
      setIsConnected(true);
      
      console.log('Yellow Network connected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Yellow Network';
      setError(errorMessage);
      console.error('Yellow Network connection failed:', err);
    }
  };

  const disconnect = async () => {
    try {
      // Disconnect wallet
      await yellowWalletService.disconnect();
      
      // Cleanup Yellow Network service
      await yellowNetworkService.cleanup();
      
      setIsConnected(false);
      setError(null);
      
      console.log('Yellow Network disconnected successfully');
    } catch (err) {
      console.error('Yellow Network disconnection failed:', err);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      initialize();
    }
    
    // Cleanup on unmount
    return () => {
      yellowNetworkService.cleanup();
    };
  }, []);

  const value: YellowNetworkContextType = {
    isInitialized,
    isConnected,
    error,
    initialize,
    connect,
    disconnect,
  };

  return (
    <YellowNetworkContext.Provider value={value}>
      {children}
    </YellowNetworkContext.Provider>
  );
};
