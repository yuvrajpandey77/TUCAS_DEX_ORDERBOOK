// Global type declarations for MetaMask and Ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
      networkVersion?: string;
      isConnected?: () => boolean;
    };
  }
}

export {}; 