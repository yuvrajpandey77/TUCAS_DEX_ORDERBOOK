# 👤 Tucas DEX - User Guide

## 🚀 Getting Started

### **What is Tucas DEX?**

Tucas DEX is a decentralized exchange that allows you to swap tokens directly from your wallet. Built on Polygon Mumbai testnet, it provides a safe environment to test token swapping with real blockchain transactions.

### **Key Features**
- ✅ **Real Token Swapping**: Swap MATIC, USDC, USDT, and WMATIC
- ✅ **Live Price Feeds**: Get real-time prices from multiple sources
- ✅ **MetaMask Integration**: Secure wallet connection and transaction signing
- ✅ **Modern UI**: Elegant, professional interface designed for long-term use
- ✅ **Testnet Safe**: Use testnet tokens without risking real money

## 🔗 Setting Up Your Wallet

### **Step 1: Install MetaMask**

1. Visit [MetaMask.io](https://metamask.io/download/)
2. Click "Download" and install the browser extension
3. Create a new wallet or import an existing one
4. Set up a strong password and save your seed phrase securely

### **Step 2: Add Polygon Mumbai Network**

1. Open MetaMask and click the network dropdown
2. Click "Add Network" or "Custom RPC"
3. Enter the following details:

| Field | Value |
|-------|-------|
| **Network Name** | Polygon Mumbai |
| **RPC URL** | https://rpc-mumbai.maticvigil.com |
| **Chain ID** | 80001 |
| **Currency Symbol** | MATIC |
| **Block Explorer** | https://mumbai.polygonscan.com |

4. Click "Save" to add the network

### **Step 3: Get Test Tokens**

#### **MATIC Tokens**
1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Select "Mumbai" network
3. Enter your wallet address
4. Click "Submit" to receive test MATIC

#### **USDC/USDT Tokens**
1. Visit [Mumbai Faucet](https://mumbaifaucet.com/)
2. Connect your MetaMask wallet
3. Select the token you want (USDC or USDT)
4. Click "Get Tokens" to receive test tokens

## 🎯 How to Use Tucas DEX

### **Step 1: Connect Your Wallet**

1. Open [Tucas DEX](https://your-deployment-url.com)
2. Click "Connect Wallet" in the top-right corner
3. Select "MetaMask" from the wallet options
4. Approve the connection in MetaMask popup
5. Your wallet is now connected! 🎉

### **Step 2: Navigate to Swap**

1. Click "Swap" in the navigation menu
2. You'll see the swap interface with two token sections:
   - **Sell**: Token you want to exchange
   - **Buy**: Token you want to receive

### **Step 3: Select Tokens**

#### **Select Sell Token (What you're giving)**
1. Click on the token selector in the "Sell" section
2. Choose from available tokens:
   - **MATIC**: Native Polygon token
   - **USDC**: USD Coin (testnet)
   - **USDT**: Tether USD (testnet)
   - **WMATIC**: Wrapped MATIC

#### **Select Buy Token (What you're getting)**
1. Click on the token selector in the "Buy" section
2. Choose a different token than what you're selling
3. The system prevents selecting the same token for both

### **Step 4: Enter Amount**

1. In the "Sell" section, enter the amount you want to swap
2. The "Buy" section will automatically calculate how much you'll receive
3. The price updates in real-time based on current market rates

### **Step 5: Execute the Swap**

1. Review the swap details:
   - Sell amount and token
   - Buy amount and token
   - Current exchange rate
   - Estimated gas fee

2. Click "Swap" button
3. MetaMask will open with transaction details
4. Review and click "Confirm" in MetaMask
5. Wait for transaction confirmation
6. Your tokens have been swapped! 🎉

## 💡 Tips for Better Experience

### **Before Swapping**
- ✅ Ensure you have enough tokens to swap
- ✅ Check you have MATIC for gas fees
- ✅ Verify you're on Polygon Mumbai network
- ✅ Double-check token amounts and addresses

### **During Swapping**
- ⏳ Be patient - transactions can take 1-2 minutes
- 🔍 Check transaction status on Polygonscan
- 💰 Keep some MATIC for future gas fees
- 📱 Don't close MetaMask during transaction

### **After Swapping**
- ✅ Check your wallet balance
- 📊 View transaction on Polygonscan
- 🔄 Try different token pairs
- 💡 Experiment with different amounts

## 🎨 Understanding the Interface

### **Header Navigation**
- **Tucas DEX Logo**: Click to return to home
- **Swap**: Navigate to swap interface
- **Connect Wallet**: Connect/disconnect MetaMask
- **Network Status**: Shows current network (Polygon Mumbai)
- **Balance**: Displays your MATIC balance

### **Swap Interface**
- **Token Selectors**: Choose tokens to swap
- **Amount Inputs**: Enter swap amounts
- **Price Display**: Shows current exchange rate
- **Swap Button**: Execute the swap transaction
- **Balance Display**: Shows your token balances

### **Color Scheme**
- **Yellow Accents**: Primary action buttons and highlights
- **Dark Blue**: Professional background and text
- **Green**: Success states and confirmations
- **Red**: Error states and warnings

## 🔧 Troubleshooting

### **Common Issues**

#### **"Wallet Not Connected"**
- **Solution**: Click "Connect Wallet" and approve in MetaMask
- **Check**: Ensure MetaMask is unlocked and on correct network

#### **"Insufficient Balance"**
- **Solution**: Get more test tokens from faucets
- **Check**: Ensure you have enough MATIC for gas fees

#### **"Wrong Network"**
- **Solution**: Switch to Polygon Mumbai in MetaMask
- **Check**: Network should show "Polygon Mumbai" in header

#### **"Transaction Failed"**
- **Solution**: Try again with higher gas limit
- **Check**: Ensure you have enough MATIC for gas

#### **"Price Not Loading"**
- **Solution**: Refresh the page and try again
- **Check**: Ensure you have internet connection

### **Error Messages**

| Error | Meaning | Solution |
|-------|---------|----------|
| `User rejected request` | You cancelled the transaction | Click "Confirm" in MetaMask |
| `Insufficient funds` | Not enough tokens | Get more test tokens |
| `Network error` | Connection issue | Check internet and try again |
| `Invalid token` | Token not supported | Select a different token |

## 📊 Understanding Prices

### **Price Sources**
- **Primary**: 0x Swap API (real DEX prices)
- **Fallback**: CoinGecko API (market prices)
- **Local**: Cached prices for better performance

### **Price Updates**
- Prices update every 30 seconds
- Click refresh button for latest prices
- Prices may vary between different sources

### **Price Calculation**
```
Buy Amount = Sell Amount × Current Price
Example: 1 MATIC × 0.8 = 0.8 USDC
```

## 🔒 Security Best Practices

### **Wallet Security**
- 🔐 Never share your seed phrase
- 🔒 Use a strong password
- 📱 Enable biometric authentication if available
- 🚫 Never enter seed phrase on any website

### **Transaction Security**
- ✅ Always verify transaction details before confirming
- 🔍 Check token addresses match expected tokens
- 💰 Verify amounts are correct
- 🌐 Ensure you're on the correct network

### **Phishing Protection**
- 🔗 Only use official MetaMask website
- 🚫 Never click suspicious links
- ✅ Always verify website URLs
- 📧 Be cautious of fake support emails

## 🎯 Advanced Features

### **Token Information**
- **Symbol**: Short name (MATIC, USDC, etc.)
- **Name**: Full name (Polygon, USD Coin, etc.)
- **Address**: Contract address on blockchain
- **Decimals**: Number of decimal places
- **Balance**: Your current token balance

### **Transaction Details**
- **Hash**: Unique transaction identifier
- **Status**: Pending, confirmed, or failed
- **Gas Used**: Amount of MATIC spent on fees
- **Block Number**: Block where transaction was included
- **Timestamp**: When transaction was processed

### **Network Information**
- **Chain ID**: 80001 (Polygon Mumbai)
- **RPC URL**: Connection to blockchain
- **Block Explorer**: View transactions on Polygonscan
- **Gas Price**: Current network gas price

## 📱 Mobile Usage

### **Mobile MetaMask**
1. Install MetaMask mobile app
2. Import your wallet using seed phrase
3. Add Polygon Mumbai network
4. Connect to Tucas DEX through mobile browser

### **Mobile Tips**
- 📱 Use landscape mode for better experience
- 🔄 Refresh page if interface looks broken
- 💡 Pin Tucas DEX to home screen
- 🔋 Keep device charged during transactions

## 🆘 Getting Help

### **Support Resources**
- 📖 **Documentation**: Check this user guide
- 🐛 **Issues**: Report bugs on GitHub
- 💬 **Discussions**: Ask questions in GitHub Discussions
- 📧 **Email**: Contact support at support@tucasdex.com

### **Community**
- 🐦 **Twitter**: Follow @TucasDEX for updates
- 💬 **Discord**: Join our community server
- 📺 **YouTube**: Watch tutorial videos
- 📝 **Blog**: Read latest news and updates

## 🎉 Congratulations!

You're now ready to use Tucas DEX! Start with small amounts to get familiar with the interface, then explore different token pairs and amounts. Remember, you're using testnet tokens, so there's no risk to your real funds.

**Happy Swapping! 🚀**

---

*This user guide is regularly updated. Check back for new features and improvements.*
