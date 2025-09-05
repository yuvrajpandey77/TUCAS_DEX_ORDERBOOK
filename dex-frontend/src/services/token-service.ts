import { ethers, BrowserProvider, JsonRpcSigner, Contract, formatEther } from 'ethers';

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address?: string;
}

export interface NativeTokenBalance {
  balance: string;
  formatted: string;
  symbol: string;
}

export class TokenService {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  /**
   * Initialize the provider and signer
   */
  async initializeProvider(): Promise<boolean> {
    try {
      console.log('Initializing provider...');
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        console.error('MetaMask not detected');
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
      }

      console.log('MetaMask detected, checking connection status...');
      console.log('MetaMask object:', window.ethereum);

      console.log('MetaMask detected, requesting accounts...');

      // Request account access - this should trigger the MetaMask popup
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      console.log('Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        console.error('No accounts returned from MetaMask');
        throw new Error('No accounts found. Please connect your wallet.');
      }

      console.log('Creating provider and signer...');
      // Create provider and signer
      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      console.log('Provider initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Wallet connection was rejected by user. Please try again.');
        } else if (error.message.includes('MetaMask')) {
          throw new Error('MetaMask connection failed. Please check if MetaMask is unlocked and try again.');
        } else if (error.message.includes('already pending')) {
          throw new Error('A connection request is already pending. Please check MetaMask.');
        } else if (error.message.includes('not installed')) {
          throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
        } else if (error.message.includes('locked')) {
          throw new Error('MetaMask is locked. Please unlock MetaMask and try again.');
        }
      }
      
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current provider
   */
  getProvider(): BrowserProvider | null {
    return this.provider;
  }

  /**
   * Get the current signer
   */
  getSigner(): JsonRpcSigner | null {
    return this.signer;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  /**
   * Get native token balance (ETH, BNB, etc.)
   */
  async getBalance(address?: string): Promise<NativeTokenBalance> {
    try {
      // Ensure provider is available
      if (!this.isProviderAvailable()) {
        const initialized = await this.initializeProvider();
        if (!initialized) {
          throw new Error('No provider available. Please connect your wallet.');
        }
      }

      // Get the address to check balance for
      const targetAddress = address || await this.signer!.getAddress();
      
      // Get balance
      const balance = await this.provider!.getBalance(targetAddress);
      
      // Get network info for symbol
      const network = await this.provider!.getNetwork();
      const symbol = this.getNativeTokenSymbol(Number(network.chainId));

      return {
        balance: balance.toString(),
        formatted: formatEther(balance),
        symbol
      };
    } catch (error) {
      console.error('Error fetching native token balance:', error);
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress?: string): Promise<TokenBalance> {
    try {
      if (!this.isProviderAvailable()) {
        const initialized = await this.initializeProvider();
        if (!initialized) {
          throw new Error('No provider available. Please connect your wallet.');
        }
      }

      const targetAddress = userAddress || await this.signer!.getAddress();
      
      // ERC-20 ABI for balanceOf and decimals
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      const tokenContract = new Contract(tokenAddress, erc20Abi, this.provider!);
      
      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(targetAddress),
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);

      return {
        symbol,
        balance: balance.toString(),
        decimals,
        address: tokenAddress
      };
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw new Error(`Failed to fetch token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple token balances
   */
  async getMultipleTokenBalances(tokenAddresses: string[], userAddress?: string): Promise<TokenBalance[]> {
    try {
      if (!this.isProviderAvailable()) {
        const initialized = await this.initializeProvider();
        if (!initialized) {
          throw new Error('No provider available. Please connect your wallet.');
        }
      }

      const targetAddress = userAddress || await this.signer!.getAddress();
      
      const balancePromises = tokenAddresses.map(async (address) => {
        try {
          return await this.getTokenBalance(address, targetAddress);
        } catch (error) {
          console.error(`Error fetching balance for token ${address}:`, error);
          return null;
        }
      });

      const balances = await Promise.all(balancePromises);
      return balances.filter((balance): balance is TokenBalance => balance !== null);
    } catch (error) {
      console.error('Error fetching multiple token balances:', error);
      throw new Error(`Failed to fetch token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all balances (native + tokens)
   */
  async getAllBalances(tokenAddresses: string[] = [], userAddress?: string): Promise<{
    native: NativeTokenBalance;
    tokens: TokenBalance[];
  }> {
    try {
      if (!this.isProviderAvailable()) {
        const initialized = await this.initializeProvider();
        if (!initialized) {
          throw new Error('No provider available. Please connect your wallet.');
        }
      }

      const [nativeBalance, tokenBalances] = await Promise.all([
        this.getBalance(userAddress),
        this.getMultipleTokenBalances(tokenAddresses, userAddress)
      ]);

      return {
        native: nativeBalance,
        tokens: tokenBalances
      };
    } catch (error) {
      console.error('Error fetching all balances:', error);
      throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get native token symbol based on chain ID
   */
  private getNativeTokenSymbol(chainId: number): string {
    const symbolMap: { [key: number]: string } = {
      1: 'ETH',    // Ethereum Mainnet
      3: 'ETH',    // Ropsten
      4: 'ETH',    // Rinkeby
      5: 'ETH',    // Goerli
      42: 'ETH',   // Kovan
      56: 'BNB',   // BSC
      97: 'BNB',   // BSC Testnet
      137: 'MATIC', // Polygon
      80001: 'MATIC', // Mumbai (Deprecated)
      80002: 'MATIC', // Amoy
      43114: 'AVAX', // Avalanche
      250: 'FTM',  // Fantom
      42161: 'ETH', // Arbitrum
      10: 'ETH',   // Optimism
    };

    return symbolMap[chainId] || 'ETH';
  }

  /**
   * Connect wallet and return account address
   */
  async connectWallet(): Promise<string> {
    try {
      console.log('Connecting wallet...');
      
      const initialized = await this.initializeProvider();
      if (!initialized) {
        throw new Error('Failed to initialize wallet provider');
      }

      if (!this.signer) {
        throw new Error('No signer available after initialization');
      }

      const address = await this.signer.getAddress();
      console.log('Wallet connected successfully, address:', address);
      
      // Verify the connection by checking if we can get the address
      if (!address) {
        throw new Error('Failed to get wallet address after connection');
      }
      
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Wallet connection was rejected. Please try again and approve the connection in MetaMask.');
        } else if (error.message.includes('already pending')) {
          throw new Error('A connection request is already pending. Please check MetaMask and try again.');
        } else if (error.message.includes('not installed')) {
          throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
        } else if (error.message.includes('locked')) {
          throw new Error('MetaMask is locked. Please unlock MetaMask and try again.');
        } else if (error.message.includes('No accounts found')) {
          throw new Error('No accounts found. Please make sure you have accounts in MetaMask and try again.');
        }
      }
      
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current account address
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      if (!this.isProviderAvailable()) {
        return null;
      }
      return await this.signer!.getAddress();
    } catch (error) {
      console.error('Error getting current address:', error);
      return null;
    }
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      if (!this.isProviderAvailable()) {
        return false;
      }
      await this.signer!.getAddress();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const tokenService = new TokenService();

// Export default instance
export default tokenService;

// Backward compatibility function for existing code
export const createTokenService = (tokenAddress: string) => {
  // For backward compatibility, return a simple object that matches the old interface
  return {
    async initialize(_signer: any) {
      // Don't re-initialize if already initialized
      console.log('createTokenService: initialize called for token:', tokenAddress)
      // The token service is already initialized by the wallet service
    },
    async getBalance(accountAddress: string): Promise<string> {
      console.log('createTokenService: getBalance called for:', { tokenAddress, accountAddress })
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token
        console.log('createTokenService: fetching native token balance')
        const balance = await tokenService.getBalance(accountAddress);
        console.log('createTokenService: native balance result:', balance)
        return balance.balance;
      } else {
        // ERC-20 token
        console.log('createTokenService: fetching ERC-20 token balance')
        const balance = await tokenService.getTokenBalance(tokenAddress, accountAddress);
        console.log('createTokenService: ERC-20 balance result:', balance)
        return balance.balance;
      }
    },
    async getAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
      console.log('createTokenService: getAllowance called for:', { tokenAddress, ownerAddress, spenderAddress })
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native tokens don't need allowance
        return ethers.MaxUint256.toString();
      } else {
        // ERC-20 token allowance
        try {
          const erc20Abi = [
            'function allowance(address owner, address spender) view returns (uint256)'
          ];
          
          if (!tokenService.getProvider()) {
            throw new Error('Provider not available');
          }
          
          const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, tokenService.getProvider());
          const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
          console.log('createTokenService: allowance result:', allowance.toString())
          return allowance.toString();
        } catch (error) {
          console.error('Error getting allowance:', error)
          return '0';
        }
      }
    },
    async approve(spenderAddress: string, amount: string): Promise<string> {
      console.log('createTokenService: approve called for:', { tokenAddress, spenderAddress, amount })
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native tokens don't need approval
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
      } else {
        // ERC-20 token approval
        try {
          const erc20Abi = [
            'function approve(address spender, uint256 amount) returns (bool)'
          ];
          
          const signer = tokenService.getSigner();
          if (!signer) {
            throw new Error('Signer not available');
          }
          
          const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
          const tx = await tokenContract.approve(spenderAddress, amount);
          const receipt = await tx.wait();
          console.log('createTokenService: approval transaction:', receipt.transactionHash)
          return receipt.transactionHash;
        } catch (error) {
          console.error('Error approving tokens:', error)
          throw error;
        }
      }
    },
    async getSymbol(): Promise<string> {
      console.log('createTokenService: getSymbol called for token:', tokenAddress)
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        return 'ETH'; // Native token symbol
      } else {
        try {
          const balance = await tokenService.getTokenBalance(tokenAddress);
          return balance.symbol;
        } catch (error) {
          console.error('Error getting token symbol:', error)
          return 'UNKNOWN';
        }
      }
    },
    async getDecimals(): Promise<number> {
      console.log('createTokenService: getDecimals called for token:', tokenAddress)
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        return 18; // Native tokens have 18 decimals
      } else {
        try {
          const balance = await tokenService.getTokenBalance(tokenAddress);
          return balance.decimals;
        } catch (error) {
          console.error('Error getting token decimals:', error)
          return 18; // Default to 18 decimals
        }
      }
    },
    isNative(): boolean {
      return tokenAddress === '0x0000000000000000000000000000000000000000';
    }
  };
}; 