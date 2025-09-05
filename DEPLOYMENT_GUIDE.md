# 🚀 Tucas DEX - Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Smart Contract Deployment](#smart-contract-deployment)
5. [Configuration Updates](#configuration-updates)
6. [Testing Deployment](#testing-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## 🔧 Prerequisites

### **Required Tools**
- Node.js 18+ and npm
- Git
- MetaMask wallet
- Polygon Mumbai testnet access
- 0x API key (for production)
- CoinGecko API key (optional)

### **Required Accounts**
- GitHub account
- Vercel/Netlify account (for frontend)
- Polygonscan account (for contract verification)
- 0x Protocol account (for API access)

## 🌍 Environment Setup

### **1. Clone Repository**
```bash
git clone <your-repo-url>
cd rust-project
```

### **2. Install Dependencies**
```bash
# Frontend dependencies
cd dex-frontend
npm install

# Rust dependencies (if needed)
cd ../..
cargo build
```

### **3. Environment Variables**

Create `.env` file in `dex-frontend/`:
```env
# API Keys
VITE_0X_API_KEY=your_0x_api_key_here
VITE_COINGECKO_API_KEY=your_coingecko_api_key_here

# Network Configuration
VITE_POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_CHAIN_ID=80001
VITE_NETWORK_NAME=Polygon Mumbai

# Contract Addresses (update after deployment)
VITE_DEX_CONTRACT_ADDRESS=0x...
VITE_USDC_CONTRACT_ADDRESS=0x0FA8781a83E46826621b3BC094Ea2A0212e71B23
VITE_USDT_CONTRACT_ADDRESS=0xBD21A10F619BE90d6066c941b04e340bbF4C8d0b
VITE_WMATIC_CONTRACT_ADDRESS=0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889

# Production URLs
VITE_APP_URL=https://your-domain.com
VITE_BLOCK_EXPLORER_URL=https://mumbai.polygonscan.com
```

### **4. Get API Keys**

#### **0x API Key**
1. Visit [0x Protocol](https://0x.org/)
2. Sign up for an account
3. Navigate to API section
4. Generate API key for Mumbai testnet
5. Copy key to `.env` file

#### **CoinGecko API Key (Optional)**
1. Visit [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for free account
3. Generate API key
4. Copy key to `.env` file

## 🎨 Frontend Deployment

### **Option 1: Vercel Deployment**

#### **1. Connect to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd dex-frontend
vercel
```

#### **2. Configure Environment Variables**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env` file
5. Redeploy project

#### **3. Custom Domain (Optional)**
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Enable SSL certificate

### **Option 2: Netlify Deployment**

#### **1. Connect to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd dex-frontend
netlify deploy --prod --dir=dist
```

#### **2. Configure Build Settings**
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18`

#### **3. Environment Variables**
1. Go to Site Settings → Environment Variables
2. Add all variables from `.env` file
3. Redeploy site

### **Option 3: Manual Deployment**

#### **1. Build for Production**
```bash
cd dex-frontend
npm run build
```

#### **2. Upload to Server**
```bash
# Upload dist/ folder to your web server
# Configure web server to serve SPA
# Set up SSL certificate
# Configure domain and DNS
```

## 🔗 Smart Contract Deployment

### **1. Prepare Deployment Environment**

#### **Install Foundry**
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
```

#### **Configure Foundry**
```bash
# Initialize foundry.toml
forge init --force

# Update foundry.toml
cat > foundry.toml << EOF
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = true
evm_version = "london"

[rpc_endpoints]
mumbai = "https://rpc-mumbai.maticvigil.com"
polygon = "https://polygon-rpc.com"

[etherscan]
mumbai = { key = "your_polygonscan_api_key" }
polygon = { key = "your_polygonscan_api_key" }
EOF
```

### **2. Deploy Contracts**

#### **Deploy DEX Contract**
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://rpc-mumbai.maticvigil.com"
export POLYGONSCAN_API_KEY="your_polygonscan_api_key"

# Deploy DEX contract
forge create contracts/DEX.sol:DEX \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23" "0xBD21A10F619BE90d6066c941b04e340bbF4C8d0b" \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

#### **Deploy Test Tokens (if needed)**
```bash
# Deploy USDC test token
forge create contracts/TestToken.sol:TestToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "Test USDC" "USDC" 6 \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY

# Deploy USDT test token
forge create contracts/TestToken.sol:TestToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "Test USDT" "USDT" 6 \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

### **3. Verify Contracts**

#### **Verify on Polygonscan**
```bash
# Verify DEX contract
forge verify-contract \
  --chain-id 80001 \
  --num-of-optimizations 200 \
  --watch \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  <DEX_CONTRACT_ADDRESS> \
  contracts/DEX.sol:DEX
```

## ⚙️ Configuration Updates

### **1. Update Frontend Configuration**

#### **Update Network Configuration**
```typescript
// dex-frontend/src/config/network.ts
export const NETWORK_CONFIG = {
  chainId: '0x13881', // 80001 in hex
  chainName: 'Polygon Mumbai',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com']
};
```

#### **Update Contract Addresses**
```typescript
// dex-frontend/src/config/contracts.ts
export const CONTRACTS = {
  DEX: '0x...', // Your deployed DEX contract address
  USDC: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
  USDT: '0xBD21A10F619BE90d6066c941b04e340bbF4C8d0b',
  WMATIC: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'
};
```

#### **Update Token Configuration**
```typescript
// dex-frontend/src/config/trading-pairs.ts
export const DEFAULT_TRADING_PAIRS = [
  {
    baseToken: 'MATIC',
    quoteToken: 'USDC',
    baseAddress: '0x0000000000000000000000000000000000000000',
    quoteAddress: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23'
  },
  // Add more pairs as needed
];
```

### **2. Update Environment Variables**

#### **Production Environment**
```env
# Update with production values
VITE_0X_API_KEY=your_production_0x_api_key
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_CHAIN_ID=137
VITE_NETWORK_NAME=Polygon Mainnet
VITE_DEX_CONTRACT_ADDRESS=0x...
```

## 🧪 Testing Deployment

### **1. Frontend Testing**

#### **Local Testing**
```bash
cd dex-frontend
npm run dev
# Test on http://localhost:5173
```

#### **Production Testing**
```bash
npm run build
npm run preview
# Test on http://localhost:4173
```

#### **Test Checklist**
- [ ] Wallet connection works
- [ ] Network switching works
- [ ] Token selection works
- [ ] Price calculation works
- [ ] Swap execution works
- [ ] Error handling works
- [ ] Mobile responsiveness works

### **2. Smart Contract Testing**

#### **Test Contract Functions**
```bash
# Test swap function
cast call <DEX_CONTRACT_ADDRESS> \
  "swap(address,address,uint256,uint256)" \
  "0x0000000000000000000000000000000000000000" \
  "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23" \
  "1000000000000000000" \
  "800000" \
  --rpc-url $RPC_URL
```

#### **Test with Frontend**
1. Connect MetaMask to Polygon Mumbai
2. Get test tokens from faucets
3. Try swapping different token pairs
4. Verify transactions on Polygonscan

## ✅ Production Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API keys valid and working
- [ ] Smart contracts deployed and verified
- [ ] Frontend builds without errors
- [ ] Mobile responsiveness tested
- [ ] Error handling tested

### **Deployment**
- [ ] Frontend deployed to hosting service
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CDN configured (if applicable)
- [ ] Monitoring set up

### **Post-Deployment**
- [ ] All features working in production
- [ ] Performance metrics acceptable
- [ ] Error tracking active
- [ ] User feedback collected
- [ ] Documentation updated

## 📊 Monitoring & Maintenance

### **1. Performance Monitoring**

#### **Frontend Monitoring**
```typescript
// Add performance tracking
const trackPerformance = (metric: string, value: number) => {
  // Send to analytics service
  analytics.track(metric, { value, timestamp: Date.now() });
};

// Track page load time
window.addEventListener('load', () => {
  const loadTime = performance.now();
  trackPerformance('page_load_time', loadTime);
});
```

#### **Error Tracking**
```typescript
// Add error tracking
const trackError = (error: Error, context: string) => {
  console.error(`[${context}]`, error);
  
  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
};
```

### **2. Regular Maintenance**

#### **Weekly Tasks**
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Update dependencies if needed
- [ ] Check API key validity

#### **Monthly Tasks**
- [ ] Review user feedback
- [ ] Update documentation
- [ ] Check security updates
- [ ] Backup configuration

#### **Quarterly Tasks**
- [ ] Full security audit
- [ ] Performance optimization
- [ ] Feature updates
- [ ] User experience improvements

### **3. Backup Strategy**

#### **Configuration Backup**
```bash
# Backup environment variables
cp .env .env.backup

# Backup configuration files
tar -czf config-backup.tar.gz dex-frontend/src/config/
```

#### **Code Backup**
```bash
# Create release tag
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Create backup branch
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Frontend Issues**
| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails | Missing dependencies | Run `npm install` |
| API errors | Invalid API keys | Check environment variables |
| Wallet not connecting | Network mismatch | Check network configuration |
| Prices not loading | API rate limits | Check API key limits |

#### **Smart Contract Issues**
| Issue | Cause | Solution |
|-------|-------|----------|
| Deployment fails | Insufficient gas | Increase gas limit |
| Verification fails | Wrong parameters | Check constructor args |
| Function calls fail | Wrong ABI | Update contract ABI |
| Transaction fails | Insufficient balance | Check token balances |

### **Debug Commands**

#### **Frontend Debugging**
```bash
# Check build output
npm run build 2>&1 | tee build.log

# Check bundle size
npm run build -- --analyze

# Check for TypeScript errors
npx tsc --noEmit
```

#### **Smart Contract Debugging**
```bash
# Check contract bytecode
cast code <CONTRACT_ADDRESS> --rpc-url $RPC_URL

# Check contract storage
cast storage <CONTRACT_ADDRESS> 0 --rpc-url $RPC_URL

# Check transaction details
cast tx <TX_HASH> --rpc-url $RPC_URL
```

## 🎉 Success!

Your Tucas DEX is now deployed and ready for users! 

### **Next Steps**
1. Share your DEX with the community
2. Gather user feedback
3. Monitor performance and errors
4. Plan future feature updates
5. Consider mainnet deployment

### **Support Resources**
- 📖 **Documentation**: Check README.md and technical docs
- 🐛 **Issues**: Report bugs on GitHub
- 💬 **Community**: Join discussions and get help
- 📧 **Contact**: Reach out for support

---

**Happy Deploying! 🚀**
