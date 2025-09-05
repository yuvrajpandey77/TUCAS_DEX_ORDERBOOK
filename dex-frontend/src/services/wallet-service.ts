import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { ETH_NETWORK_CONFIG } from '@/config/network';

// Extend the Window interface to include MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      providers?: Array<{
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
        isMetaMask?: boolean;
      }>;
    };
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: string | null;
  networkName: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface WalletError {
  code: string;
  message: string;
  userMessage: string;
}

export class WalletService {
  private state: WalletState = {
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    networkName: null,
    error: null,
    isLoading: false,
  };

  private listeners: Set<(state: WalletState) => void> = new Set();
  private cleanupListeners: (() => void) | null = null;

  // Singleton pattern
  private static instance: WalletService;
  
  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  constructor() {
    // Auto-reconnect on page load if wallet was previously connected
    this.autoReconnect();
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<WalletState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Check if MetaMask is available
   */
  isMetaMaskAvailable(): boolean {
    if (typeof window === 'undefined' || !window.ethereum) return false;
    
    // Direct MetaMask detection
    if (window.ethereum.isMetaMask) return true;
    
    // Check in providers array if multiple wallets are installed
    if (Array.isArray(window.ethereum.providers)) {
      return window.ethereum.providers.some(provider => provider?.isMetaMask);
    }
    
    return false;
  }

  /**
   * Get MetaMask provider explicitly
   */
  private getMetaMaskProvider(): any {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    
    // If ethereum itself is MetaMask
    if (window.ethereum.isMetaMask) {
      return window.ethereum;
    }
    
    // If multiple providers are injected, find MetaMask explicitly
    if (Array.isArray(window.ethereum.providers)) {
      return window.ethereum.providers.find(provider => provider?.isMetaMask) || null;
    }
    
    return null;
  }

  /**
   * Auto-reconnect on page load
   */
  private async autoReconnect(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Check if we have a stored connection
      const storedConnection = localStorage.getItem('wallet_connection');
      if (!storedConnection) return;

      const { address, chainId } = JSON.parse(storedConnection);
      
      // Check if MetaMask is still available
      if (!this.isMetaMaskAvailable()) {
        this.clearStoredConnection();
        return;
      }

      console.log('Attempting auto-reconnect...');
      this.updateState({ isLoading: true, error: null });

      // Get MetaMask provider
      const provider = this.getMetaMaskProvider();
      if (!provider) {
        this.clearStoredConnection();
        this.updateState({ isLoading: false });
        return;
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        this.clearStoredConnection();
        this.updateState({ isLoading: false });
        return;
      }

      const currentAddress = accounts[0];
      
      // Check if the address matches
      if (currentAddress.toLowerCase() !== address.toLowerCase()) {
        // Address changed, update stored connection
        this.storeConnection(currentAddress, chainId);
      }

      // Create provider and signer
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();

      // Get network information
      const network = await browserProvider.getNetwork();
      const currentChainId = network.chainId.toString();
      const networkName = this.getNetworkName(currentChainId);

      this.updateState({
        isConnected: true,
        address: currentAddress,
        provider: browserProvider,
        signer,
        chainId: currentChainId,
        networkName,
        isLoading: false,
        error: null,
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('Auto-reconnect successful');

    } catch (error) {
      console.log('Auto-reconnect failed:', error);
      this.clearStoredConnection();
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Store connection information
   */
  private storeConnection(address: string, chainId: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('wallet_connection', JSON.stringify({
      address,
      chainId,
      timestamp: Date.now()
    }));
  }

  /**
   * Clear stored connection
   */
  private clearStoredConnection(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('wallet_connection');
  }

  /**
   * Connect to MetaMask wallet
   */
  async connect(): Promise<string> {
    try {
      this.updateState({ isLoading: true, error: null });

      // Check if MetaMask is available
      if (!this.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Get MetaMask provider
      const provider = this.getMetaMaskProvider();
      if (!provider) {
        throw new Error('MetaMask is not available. Please install MetaMask.');
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your MetaMask wallet.');
      }

      const address = accounts[0];
      
      // Create provider and signer
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();

      // Get network information
      const network = await browserProvider.getNetwork();
      const chainId = network.chainId.toString();
      const networkName = this.getNetworkName(chainId);

      this.updateState({
        isConnected: true,
        address,
        provider: browserProvider,
        signer,
        chainId,
        networkName,
        isLoading: false,
        error: null,
      });

      // Store connection
      this.storeConnection(address, chainId);

      // Set up event listeners
      this.setupEventListeners();

      // Try to switch to Polygon Amoy
      try {
        await this.switchToPolygonNetwork();
      } catch (switchError) {
        console.warn('Failed to switch to Polygon Amoy:', switchError);
        // Don't fail the connection if network switch fails
      }

      return address;

    } catch (error) {
      const walletError = this.handleError(error);
      this.updateState({
        isConnected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        networkName: null,
        isLoading: false,
        error: walletError.userMessage,
      });
      throw walletError;
    }
  }

  /**
   * Switch to Polygon Amoy network
   */
  async switchToPolygonNetwork(): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available. Please install MetaMask wallet.');
    }

    const provider = this.getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask is not available.');
    }

    try {
      // Try to switch to Polygon Amoy network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ETH_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [ETH_NETWORK_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Polygon Amoy to your wallet. Please add it manually.');
        }
      } else {
        throw new Error('Failed to switch to Polygon Amoy. Please switch manually.');
      }
    }
  }


  /**
   * Disconnect wallet
   */
  disconnect(): void {
    // Clear stored connection
    this.clearStoredConnection();
    
    // Clean up event listeners
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }

    this.updateState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      networkName: null,
      error: null,
      isLoading: false,
    });
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    if (!this.state.isConnected || !this.state.provider || !this.state.signer) {
      return false;
    }

    try {
      await this.state.signer.getAddress();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current address
   */
  async getAddress(): Promise<string | null> {
    if (!this.state.isConnected || !this.state.signer) {
      return null;
    }

    try {
      return await this.state.signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Get provider
   */
  getProvider(): BrowserProvider | null {
    return this.state.provider;
  }

  /**
   * Get signer
   */
  getSigner(): JsonRpcSigner | null {
    return this.state.signer;
  }

  /**
   * Setup event listeners for wallet changes
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        // User disconnected
        this.disconnect();
      } else if (accounts[0] !== this.state.address) {
        // Account changed
        const newAddress = accounts[0];
        this.updateState({ address: newAddress });
        this.storeConnection(newAddress, this.state.chainId || '');
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      this.updateState({ 
        chainId,
        networkName: this.getNetworkName(chainId),
      });
      // Update stored connection with new chain ID
      if (this.state.address) {
        this.storeConnection(this.state.address, chainId);
      }
    };

    const handleDisconnect = () => {
      this.disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Store cleanup function
    this.cleanupListeners = () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }

  /**
   * Get network name from chain ID
   */
  private getNetworkName(chainId: string): string {
    const networkMap: { [key: string]: string } = {
      '1': 'Ethereum Mainnet',
      '3': 'Ropsten',
      '4': 'Rinkeby',
      '5': 'Goerli',
      '42': 'Kovan',
      '56': 'BSC',
      '97': 'BSC Testnet',
      '137': 'Polygon',
      '80001': 'Polygon Mumbai (Deprecated)',
      '80002': 'Polygon Amoy',
      '43114': 'Avalanche',
      '250': 'Fantom',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '0x13881': 'Polygon Mumbai (Deprecated)',
      '0x13882': 'Polygon Amoy',
    };

    return networkMap[chainId] || 'Unknown Network';
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: unknown): WalletError {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.includes('User rejected') || message.includes('user rejected')) {
      return {
        code: 'USER_REJECTED',
        message,
        userMessage: 'Connection was rejected. Please try again and approve the connection.',
      };
    }
    
    if (message.includes('already pending')) {
      return {
        code: 'ALREADY_PENDING',
        message,
        userMessage: 'A connection request is already pending. Please check your wallet.',
      };
    }
    
    if (message.includes('not installed') || message.includes('No Ethereum provider')) {
      return {
        code: 'NO_PROVIDER',
        message,
        userMessage: 'MetaMask is not installed. Please install MetaMask to continue.',
      };
    }
    
    if (message.includes('locked') || message.includes('unlock')) {
      return {
        code: 'WALLET_LOCKED',
        message,
        userMessage: 'Wallet is locked. Please unlock your wallet and try again.',
      };
    }
    
    if (message.includes('No accounts found')) {
      return {
        code: 'NO_ACCOUNTS',
        message,
        userMessage: 'No accounts found. Please create or import an account in your wallet.',
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message,
      userMessage: 'Failed to connect wallet. Please try again.',
    };
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance(); 