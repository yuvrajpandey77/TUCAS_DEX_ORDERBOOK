import { BrowserProvider, JsonRpcSigner, ethers } from 'ethers';

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

export class SimplifiedWalletService {
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
  private static instance: SimplifiedWalletService;
  
  public static getInstance(): SimplifiedWalletService {
    if (!SimplifiedWalletService.instance) {
      SimplifiedWalletService.instance = new SimplifiedWalletService();
    }
    return SimplifiedWalletService.instance;
  }

  constructor() {
    // Auto-reconnect on page load
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
   * Get MetaMask provider
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
   * Get network name from chain ID
   */
  private getNetworkName(chainId: string): string {
    const networks: Record<string, string> = {
      '1': 'Ethereum Mainnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon',
      '80002': 'Polygon Amoy',
    };
    return networks[chainId] || `Chain ${chainId}`;
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

    } catch (error) {
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

      return address;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      this.updateState({
        isConnected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        networkName: null,
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Switch to Ethereum Mainnet
   */
  async switchToMainnet(): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed');
    }

    const provider = this.getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask is not available');
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // 1 in hex (Ethereum Mainnet)
      });
    } catch (error: any) {
      // If the chain doesn't exist, add it (though mainnet should always exist)
      if (error.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              rpcUrls: ['https://ethereum.publicnode.com'],
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://etherscan.io'],
            }],
          });
        } catch (addError) {
          throw new Error('Failed to add Ethereum Mainnet network');
        }
      } else {
        throw new Error('Failed to switch to Ethereum Mainnet network');
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
   * Get current chain ID
   */
  async getChainId(): Promise<string | null> {
    if (!this.state.isConnected || !this.state.provider) {
      return null;
    }

    try {
      const network = await this.state.provider.getNetwork();
      return network.chainId.toString();
    } catch {
      return null;
    }
  }

  /**
   * Setup event listeners for wallet changes
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const provider = this.getMetaMaskProvider();
    if (!provider) return;

    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        this.disconnect();
      } else {
        // User switched accounts
        const newAddress = accounts[0];
        this.updateState({ address: newAddress });
        this.storeConnection(newAddress, this.state.chainId || '1');
      }
    };

    // Handle chain changes
    const handleChainChanged = (chainId: string) => {
      const networkName = this.getNetworkName(chainId);
      this.updateState({ 
        chainId, 
        networkName 
      });
      this.storeConnection(this.state.address || '', chainId);
    };

    // Handle disconnect
    const handleDisconnect = () => {
      this.disconnect();
    };

    // Add event listeners
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    // Store cleanup function
    this.cleanupListeners = () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }

  /**
   * Reconnect wallet (useful for retry scenarios)
   */
  async reconnect(): Promise<string> {
    this.disconnect();
    return this.connect();
  }

  /**
   * Check if wallet is on the correct network
   */
  isOnCorrectNetwork(): boolean {
    return this.state.chainId === '1' || this.state.chainId === '0x1';
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(): string | null {
    return this.state.error;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Get native ETH balance
   */
  async getNativeBalance(address: string): Promise<string> {
    if (!this.state.provider) {
      throw new Error('Provider not available');
    }
    
    try {
      const balance = await this.state.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching native balance:', error);
      return '0';
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    if (!this.state.provider) {
      throw new Error('Provider not available');
    }

    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) external view returns (uint256)', 'function decimals() external view returns (uint8)'],
        this.state.provider
      );

      const [balance, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals()
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }
}

// Export singleton instance
export const simplifiedWalletService = SimplifiedWalletService.getInstance();
