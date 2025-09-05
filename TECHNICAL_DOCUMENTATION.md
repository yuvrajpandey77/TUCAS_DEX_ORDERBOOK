# 🔧 Tucas DEX - Technical Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Services](#backend-services)
4. [Smart Contracts](#smart-contracts)
5. [API Integration](#api-integration)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)
9. [Security Implementation](#security-implementation)
10. [Deployment Guide](#deployment-guide)

## 🏗️ Architecture Overview

### **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (React/Vite)  │◄──►│   Services      │◄──►│   (Polygon)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   0x API        │    │   Smart         │
│   Wallet        │    │   CoinGecko     │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI/UX Development |
| **Build Tool** | Vite | Fast Development & Building |
| **Styling** | Tailwind CSS + Shadcn UI | Component Styling |
| **State Management** | React Hooks + TanStack Query | Data & State Management |
| **Blockchain** | Ethers.js v6 | Blockchain Interaction |
| **API** | 0x Swap API + CoinGecko | Price Feeds & Swaps |
| **Network** | Polygon Mumbai | Testnet Environment |

## 🎨 Frontend Architecture

### **Component Hierarchy**

```
App.tsx
├── Navbar.tsx
│   ├── ConnectWallet.tsx
│   └── WalletStatus.tsx
├── Routes
│   ├── Index.tsx (Landing)
│   └── Swap.tsx
│       └── SwapCard.tsx
│           ├── TokenSelectorModal.tsx
│           └── PriceDisplay.tsx
└── FloatingOrbs.tsx (Background)
```

### **Key Components**

#### **1. SwapCard.tsx**
```typescript
interface SwapCardProps {
  onSwap: (swapData: SwapData) => void;
  isLoading?: boolean;
}

// Main swap interface component
// Handles token selection, amount input, price calculation
// Integrates with MetaMask for transaction signing
```

#### **2. ConnectWallet.tsx**
```typescript
interface ConnectWalletProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simplified MetaMask-only wallet connection
// Handles network switching to Polygon Mumbai
// Provides user feedback and error handling
```

#### **3. TokenSelectorModal.tsx**
```typescript
interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  selectedToken?: Token;
  excludeToken?: Token;
}

// Token selection interface
// Shows available tokens with balances
// Prevents selecting same token for buy/sell
```

### **State Management**

#### **Wallet State (wallet-service.ts)**
```typescript
interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: string | null;
  networkName: string | null;
  isLoading: boolean;
  error: string | null;
}
```

#### **Swap State (SwapCard.tsx)**
```typescript
interface SwapState {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  price: number;
  isLoading: boolean;
  error: string | null;
}
```

## 🔌 Backend Services

### **1. Wallet Service (wallet-service.ts)**

#### **Core Methods**
```typescript
class WalletService {
  // Connect to MetaMask
  async connect(): Promise<string>
  
  // Disconnect wallet
  disconnect(): void
  
  // Switch to Polygon Mumbai
  async switchToPolygonNetwork(): Promise<void>
  
  // Get current network
  getCurrentNetwork(): string | null
  
  // Check if connected
  isConnected(): boolean
}
```

#### **Provider Detection**
```typescript
private getMetaMaskProvider(): any {
  // Check if MetaMask is available
  if (window.ethereum?.isMetaMask) {
    return window.ethereum;
  }
  
  // Check in providers array if multiple wallets installed
  if (window.ethereum?.providers) {
    for (const provider of window.ethereum.providers) {
      if (provider.isMetaMask) {
        return provider;
      }
    }
  }
  
  return null;
}
```

### **2. Aggregator Service (aggregator-service.ts)**

#### **Price Fetching**
```typescript
class AggregatorService {
  // Get real-time price
  async getRealTimePrice(
    sellToken: string, 
    buyToken: string, 
    amount: string
  ): Promise<number>
  
  // Execute swap
  async executeSwap(swapData: SwapData): Promise<SwapResult>
  
  // Get quote from 0x API
  private async getQuote(params: QuoteParams): Promise<Quote>
}
```

#### **API Integration**
```typescript
// 0x Swap API Configuration
const baseUrl = 'https://mumbai.api.0x.org';
const apiKey = process.env.VITE_0X_API_KEY;

// CoinGecko API for MATIC price
const coingeckoUrl = 'https://api.coingecko.com/api/v3/simple/price';
```

### **3. Token Service (token-service.ts)**

#### **Token Operations**
```typescript
class TokenService {
  // Get token balance
  async getTokenBalance(
    tokenAddress: string, 
    userAddress: string
  ): Promise<string>
  
  // Get native token balance (MATIC)
  async getNativeBalance(userAddress: string): Promise<string>
  
  // Get token symbol
  getTokenSymbol(tokenAddress: string): string
}
```

## 🔗 Smart Contracts

### **Contract Architecture**

```
DEX Contract (Polygon Mumbai)
├── Token Swapping
├── Liquidity Management
├── Price Calculation
└── Fee Collection
```

### **Key Functions**

#### **Swap Function**
```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut
) external returns (uint256 amountOut) {
    // Validate inputs
    require(tokenIn != address(0), "Invalid token in");
    require(tokenOut != address(0), "Invalid token out");
    require(amountIn > 0, "Invalid amount");
    
    // Execute swap logic
    // Calculate output amount
    // Transfer tokens
    // Emit events
}
```

### **Contract Addresses (Mumbai)**

| Contract | Address | Purpose |
|----------|---------|---------|
| DEX | `0x...` | Main swap contract |
| USDC | `0x0FA8781a83E46826621b3BC094Ea2A0212e71B23` | USD Coin |
| USDT | `0xBD21A10F619BE90d6066c941b04e340bbF4C8d0b` | Tether USD |
| WMATIC | `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889` | Wrapped MATIC |

## 🌐 API Integration

### **1. 0x Swap API**

#### **Configuration**
```typescript
const config = {
  baseUrl: 'https://mumbai.api.0x.org',
  apiKey: process.env.VITE_0X_API_KEY,
  chainId: 80001, // Polygon Mumbai
  network: 'mumbai'
};
```

#### **Quote Endpoint**
```typescript
const getQuote = async (params: {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
}) => {
  const response = await fetch(
    `${baseUrl}/swap/v1/quote?${new URLSearchParams(params)}`,
    { headers: { '0x-api-key': apiKey } }
  );
  return response.json();
};
```

### **2. CoinGecko API**

#### **Price Data**
```typescript
const getPrice = async (tokenId: string) => {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
  );
  const data = await response.json();
  return data[tokenId].usd;
};
```

## 🔄 State Management

### **React Hooks**

#### **useWallet Hook**
```typescript
const useWallet = () => {
  const [state, setState] = useState<WalletState>(initialState);
  
  const connect = useCallback(async () => {
    // Connect to MetaMask
  }, []);
  
  const disconnect = useCallback(() => {
    // Disconnect wallet
  }, []);
  
  return { ...state, connect, disconnect };
};
```

#### **useSwap Hook**
```typescript
const useSwap = () => {
  const [swapData, setSwapData] = useState<SwapData>(initialSwapData);
  
  const executeSwap = useCallback(async () => {
    // Execute swap transaction
  }, [swapData]);
  
  return { swapData, setSwapData, executeSwap };
};
```

### **TanStack Query**

#### **Price Queries**
```typescript
const usePrice = (sellToken: string, buyToken: string, amount: string) => {
  return useQuery({
    queryKey: ['price', sellToken, buyToken, amount],
    queryFn: () => aggregatorService.getRealTimePrice(sellToken, buyToken, amount),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000
  });
};
```

## ⚠️ Error Handling

### **Error Types**

```typescript
interface WalletError {
  code: string;
  message: string;
  userMessage: string;
  details?: string;
}

// Common error codes
const ERROR_CODES = {
  USER_REJECTED: 'ACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONTRACT_ERROR: 'CONTRACT_ERROR'
};
```

### **Error Handling Strategy**

1. **User-Friendly Messages**: Convert technical errors to user-friendly messages
2. **Retry Logic**: Implement retry for network errors
3. **Fallback Options**: Provide alternative actions when possible
4. **Logging**: Log errors for debugging while protecting user privacy

### **Error Boundaries**

```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

## 🚀 Performance Optimization

### **Code Splitting**

```typescript
// Lazy load components
const SwapPage = lazy(() => import('./pages/Swap'));
const ConnectWallet = lazy(() => import('./components/ConnectWallet'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <SwapPage />
</Suspense>
```

### **Memoization**

```typescript
// Memoize expensive calculations
const calculatedPrice = useMemo(() => {
  return calculatePrice(sellAmount, price);
}, [sellAmount, price]);

// Memoize callbacks
const handleSwap = useCallback(() => {
  executeSwap(swapData);
}, [swapData, executeSwap]);
```

### **Caching Strategy**

```typescript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3
    }
  }
});
```

## 🔒 Security Implementation

### **Input Validation**

```typescript
// Validate token addresses
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate amounts
const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
};
```

### **Transaction Security**

```typescript
// Validate transaction before sending
const validateTransaction = (tx: TransactionRequest): boolean => {
  if (!tx.to || !tx.value || !tx.data) {
    throw new Error('Invalid transaction parameters');
  }
  
  if (tx.value < 0) {
    throw new Error('Invalid transaction value');
  }
  
  return true;
};
```

### **Network Validation**

```typescript
// Ensure correct network
const validateNetwork = (chainId: string): boolean => {
  const expectedChainId = '80001'; // Polygon Mumbai
  return chainId === expectedChainId;
};
```

## 🚀 Deployment Guide

### **Frontend Deployment**

#### **1. Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethers: ['ethers'],
          ui: ['@radix-ui/react-dialog']
        }
      }
    }
  }
});
```

#### **2. Environment Variables**
```bash
# Production environment
VITE_0X_API_KEY=your_production_api_key
VITE_COINGECKO_API_KEY=your_coingecko_key
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_CHAIN_ID=137
```

#### **3. Deployment Commands**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### **Smart Contract Deployment**

#### **1. Deployment Script**
```bash
#!/bin/bash
# deploy-contracts.sh

# Set environment variables
export PRIVATE_KEY=$PRIVATE_KEY
export RPC_URL=$RPC_URL
export CHAIN_ID=80001

# Deploy DEX contract
forge create contracts/DEX.sol:DEX \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "0x..." "0x..." \
  --verify

# Deploy token contracts
forge create contracts/TestToken.sol:TestToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "Test USDC" "USDC" 6 \
  --verify
```

#### **2. Contract Verification**
```bash
# Verify on Polygonscan
forge verify-contract \
  --chain-id 80001 \
  --num-of-optimizations 200 \
  --watch \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  <CONTRACT_ADDRESS> \
  contracts/DEX.sol:DEX
```

### **CI/CD Pipeline**

#### **GitHub Actions Workflow**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: dex-frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd dex-frontend
        npm ci
    
    - name: Build
      run: |
        cd dex-frontend
        npm run build
      env:
        VITE_0X_API_KEY: ${{ secrets.VITE_0X_API_KEY }}
        VITE_COINGECKO_API_KEY: ${{ secrets.VITE_COINGECKO_API_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: dex-frontend
```

## 📊 Monitoring & Analytics

### **Error Tracking**
```typescript
// Error logging service
class ErrorLogger {
  static log(error: Error, context: string) {
    console.error(`[${context}]`, error);
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }
}
```

### **Performance Monitoring**
```typescript
// Performance metrics
const trackSwap = (duration: number, success: boolean) => {
  // Track swap performance
  analytics.track('swap_completed', {
    duration,
    success,
    timestamp: Date.now()
  });
};
```

## 🔧 Development Tools

### **Debugging**
```typescript
// Debug mode
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug info:', { state, props });
}
```

### **Testing**
```typescript
// Component testing
import { render, screen } from '@testing-library/react';
import { SwapCard } from './SwapCard';

test('renders swap interface', () => {
  render(<SwapCard onSwap={jest.fn()} />);
  expect(screen.getByText('Swap')).toBeInTheDocument();
});
```

---

**This technical documentation provides a comprehensive overview of the Tucas DEX architecture, implementation details, and deployment procedures.**
