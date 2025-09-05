# 🚀 Tucas DEX - Decentralized Exchange Platform

A fully functional decentralized exchange (DEX) built on **Polygon Mumbai** with real-time swap functionality, modern UI/UX, and comprehensive wallet integration.

## ✨ Features

### 🔄 **Swap Functionality**
- **Real-time Price Feeds**: Live prices from CoinGecko API and 0x Swap API
- **Token Swapping**: Swap between MATIC, USDC, USDT, WMATIC and other tokens
- **Price Calculation**: Automatic buy/sell amount calculation
- **Transaction Signing**: Full MetaMask integration with transaction signing

### 🎨 **Modern UI/UX**
- **Premium Design**: Elegant yellow and dark blue color scheme
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Framer Motion powered transitions
- **Professional Theme**: Soothing colors to encourage longer user engagement

### 🔗 **Wallet Integration**
- **MetaMask Only**: Simplified, focused wallet connection
- **Network Switching**: Automatic Polygon Mumbai network detection
- **Balance Display**: Real-time token balance updates
- **Transaction History**: Track your swap transactions

### 🌐 **Network Support**
- **Polygon Mumbai**: Primary testnet for development and testing
- **Real DEX Integration**: 0x Swap API for actual token swaps
- **Testnet Tokens**: USDC, USDT, WMATIC on Mumbai testnet

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn UI** + **Radix UI** for components
- **Framer Motion** for animations
- **Ethers.js v6** for blockchain interaction
- **TanStack Query** for data fetching and caching

### **Backend Services**
- **0x Swap API**: Real-time price feeds and swap execution
- **CoinGecko API**: Additional price data for MATIC/USD
- **Polygon Mumbai RPC**: Blockchain connectivity

### **Smart Contracts**
- **DEX Contract**: Deployed on Polygon Mumbai
- **Token Contracts**: USDC, USDT, WMATIC testnet tokens
- **Swap Logic**: Automated market maker functionality

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- MetaMask wallet with Polygon Mumbai network
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd rust-project
```

2. **Install frontend dependencies**
```bash
cd dex-frontend
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

### **Configure MetaMask for Polygon Mumbai**

Add Polygon Mumbai to MetaMask:
- **Network Name**: Polygon Mumbai
- **Chain ID**: 80001
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Currency Symbol**: MATIC
- **Block Explorer**: https://mumbai.polygonscan.com

## 🪙 Test Tokens

### **Mumbai Testnet Tokens**

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| MATIC | MATIC | Native | 18 |
| USDC | USDC | `0x0FA8781a83E46826621b3BC094Ea2A0212e71B23` | 6 |
| USDT | USDT | `0xBD21A10F619BE90d6066c941b04e340bbF4C8d0b` | 6 |
| WMATIC | WMATIC | `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889` | 18 |

### **Getting Test Tokens**

1. **MATIC**: Get from [Polygon Faucet](https://faucet.polygon.technology/)
2. **USDC/USDT**: Use Mumbai testnet faucets
3. **WMATIC**: Wrap MATIC tokens

## 📊 Trading Pairs

### **Available Pairs**

| Pair | Base Token | Quote Token | Status |
|------|------------|-------------|--------|
| MATIC/USDC | MATIC | USDC | ✅ Active |
| USDT/USDC | USDT | USDC | ✅ Active |
| WMATIC/MATIC | WMATIC | MATIC | ✅ Active |

## 🎯 User Workflow

### **1. Connect Wallet**
- Click "Connect Wallet" in the header
- Select MetaMask from the modal
- Approve connection in MetaMask
- Wallet connects to Polygon Mumbai

### **2. Swap Tokens**
- Navigate to the Swap page
- Select sell token (e.g., MATIC)
- Select buy token (e.g., USDC)
- Enter amount to sell
- Buy amount calculates automatically
- Click "Swap" to execute

### **3. Transaction Flow**
- MetaMask popup appears for transaction signing
- Review transaction details
- Approve transaction
- Wait for confirmation
- Tokens are swapped automatically

## 🔧 Development

### **Project Structure**
```
rust-project/
├── dex-frontend/     # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── SwapCard.tsx   # Main swap interface
│   │   │   ├── ConnectWallet.tsx # Wallet connection modal
│   │   │   ├── Navbar.tsx     # Navigation header
│   │   │   └── TokenSelectorModal.tsx # Token selection
│   │   ├── services/          # Business logic
│   │   │   ├── wallet-service.ts    # Wallet management
│   │   │   ├── aggregator-service.ts # 0x API integration
│   │   │   └── token-service.ts     # Token operations
│   │   ├── config/            # Configuration
│   │   │   ├── network.ts     # Network settings
│   │   │   └── contracts.ts   # Contract addresses
│   │   ├── pages/             # Route components
│   │   │   ├── Swap.tsx       # Swap page
│   │   │   └── Index.tsx      # Landing page
│   │   └── hooks/             # Custom React hooks
├── contracts/                 # Smart contracts
├── src/                      # Rust CLI tools
└── scripts/                  # Deployment scripts
```

### **Key Components**

#### **SwapCard.tsx**
- Main swap interface
- Token selection and amount input
- Price calculation and display
- Swap execution with MetaMask integration

#### **ConnectWallet.tsx**
- Simplified MetaMask-only wallet connection
- Network switching to Polygon Mumbai
- Error handling and user feedback

#### **wallet-service.ts**
- Centralized wallet management
- MetaMask provider detection
- Network switching logic
- Transaction signing

#### **aggregator-service.ts**
- 0x Swap API integration
- Real-time price fetching
- Swap execution
- CoinGecko price fallback

### **Environment Variables**

Create `.env` file in `dex-frontend/`:
```env
VITE_0X_API_KEY=your_0x_api_key
VITE_COINGECKO_API_KEY=your_coingecko_api_key
VITE_POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_CHAIN_ID=80001
```

## 🚀 Deployment

### **Frontend Deployment**

1. **Build for production**
```bash
cd dex-frontend
npm run build
```

2. **Deploy to Vercel/Netlify**
- Connect your GitHub repository
- Set build command: `npm run build`
- Set output directory: `dist`
- Deploy automatically on push

### **Smart Contract Deployment**

1. **Deploy to Polygon Mumbai**
```bash
# Set up environment
export PRIVATE_KEY=your_private_key
export RPC_URL=https://rpc-mumbai.maticvigil.com

# Deploy contracts
forge create contracts/DEX.sol:DEX --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

2. **Update frontend configuration**
- Update contract addresses in `config/contracts.ts`
- Update token addresses in `config/trading-pairs.ts`

## 🔒 Security Features

- **MetaMask Integration**: Secure wallet connection and transaction signing
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Network Validation**: Ensures correct network connection
- **Transaction Confirmation**: All swaps require user confirmation

## 🎨 Design System

### **Color Palette**
- **Primary Yellow**: `#FCD34D` - Eye-catching, professional
- **Dark Blue**: `#1E293B` - Rich, elegant background
- **Accent Colors**: Subtle gradients and professional tones
- **Text**: High contrast for readability

### **Typography**
- **Headings**: Bold, modern fonts
- **Body**: Clean, readable text
- **Code**: Monospace for technical content

### **Components**
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Smooth hover effects, clear states
- **Modals**: Clean overlays with backdrop blur
- **Forms**: Intuitive input fields with validation

## 📈 Performance

- **Lazy Loading**: Components load on demand
- **Code Splitting**: Optimized bundle sizes
- **Caching**: TanStack Query for efficient data fetching
- **Animations**: 60fps smooth transitions
- **Responsive**: Mobile-first design approach

## 🧪 Testing

### **Manual Testing**
1. **Wallet Connection**: Test MetaMask connection flow
2. **Network Switching**: Verify Polygon Mumbai detection
3. **Token Swapping**: Test various token pairs
4. **Error Handling**: Test with invalid inputs
5. **Mobile Responsiveness**: Test on different screen sizes

### **Test Scenarios**
- Connect wallet with MetaMask
- Switch to Polygon Mumbai network
- Swap MATIC for USDC
- Swap USDC for MATIC
- Test with insufficient balance
- Test with invalid token selection

## 🚀 Roadmap

### **Phase 1 - Current** ✅
- [x] Basic swap functionality
- [x] MetaMask integration
- [x] Polygon Mumbai support
- [x] Modern UI/UX design
- [x] Real-time price feeds

### **Phase 2 - Next**
- [ ] Advanced order types (limit orders)
- [ ] Liquidity pools
- [ ] Portfolio tracking
- [ ] Transaction history
- [ ] Mobile app

### **Phase 3 - Future**
- [ ] Cross-chain swaps
- [ ] Governance token
- [ ] Staking rewards
- [ ] Analytics dashboard
- [ ] API for developers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the docs folder
- **Email**: support@tucasdex.com

## 🙏 Acknowledgments

- **0x Protocol** for swap aggregation
- **CoinGecko** for price data
- **Polygon** for testnet infrastructure
- **MetaMask** for wallet integration
- **OpenZeppelin** for smart contract standards

---

**Built with ❤️ for the decentralized future**

*Tucas DEX - Where trading meets elegance*