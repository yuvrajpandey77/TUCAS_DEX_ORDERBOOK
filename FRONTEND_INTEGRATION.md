# Frontend Integration Guide

## 🚀 **Quick Start**

### **1. Get Contract Addresses**
After deployment, you'll have:
- `OrderBookDEX` address (and token addresses if needed)

### **2. Setup Web3 Provider**

```javascript
// Add Ethereum Sepolia to MetaMask
const ETH_SEPOLIA = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Ethereum Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// Add to MetaMask
await ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [ETH_SEPOLIA]
});
```

### **3. Contract ABIs**

// Aggregator usage (0x) example is handled in frontend services

#### **OrderBookDEX ABI**
```javascript
const DEX_ABI = [
  "function addTradingPair(address baseToken, address quoteToken, uint256 minOrderSize, uint256 pricePrecision)",
  "function placeLimitOrder(address baseToken, address quoteToken, uint256 amount, uint256 price, bool isBuy) returns (uint256)",
  "function placeMarketOrder(address baseToken, address quoteToken, uint256 amount, bool isBuy)",
  "function cancelOrder(uint256 orderId)",
  "function getOrderBook(address baseToken, address quoteToken) view returns (uint256[], uint256[], uint256[], uint256[])",
  "function getUserOrders(address user) view returns (uint256[])",
  "function withdraw(address token, uint256 amount)",
  "function getUserBalance(address user, address token) view returns (uint256)"
];
```

### **4. Contract Instances**

```javascript
import { ethers } from 'ethers';

// Setup provider
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Contract addresses (replace with actual addresses)
const DEX_ADDRESS = "0x..."; // From deployment

// Create contract instances
const dexContract = new ethers.Contract(
  DEX_ADDRESS, 
  DEX_ABI, 
  signer
);
```

### **5. Token Operations**

#### **Get Token Info**
```javascript
async function getTokenInfo() {
  try {
    const [name, symbol, totalSupply, decimals] = await tokenContract.getTokenInfo();
    console.log(`Token: ${name} (${symbol})`);
    console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)}`);
    console.log(`Decimals: ${decimals}`);
  } catch (error) {
    console.error('Error getting token info:', error);
  }
}
```

#### **Mint Tokens**
```javascript
async function mintTokens(toAddress, amount) {
  try {
    const amountWei = ethers.utils.parseEther(amount.toString());
    const tx = await tokenContract.mint(toAddress, amountWei);
    await tx.wait();
    console.log('Tokens minted successfully!');
  } catch (error) {
    console.error('Error minting tokens:', error);
  }
}
```

#### **Public Mint**
```javascript
async function publicMint() {
  try {
    const tx = await tokenContract.publicMint();
    await tx.wait();
    console.log('Public mint successful!');
  } catch (error) {
    console.error('Error in public mint:', error);
  }
}
```

### **6. DEX Operations**

#### **Add Trading Pair**
```javascript
async function addTradingPair(baseToken, quoteToken, minOrderSize, pricePrecision) {
  try {
    const tx = await dexContract.addTradingPair(
      baseToken, 
      quoteToken, 
      ethers.utils.parseEther(minOrderSize.toString()),
      ethers.utils.parseEther(pricePrecision.toString())
    );
    await tx.wait();
    console.log('Trading pair added!');
  } catch (error) {
    console.error('Error adding trading pair:', error);
  }
}
```

#### **Place Limit Order**
```javascript
async function placeLimitOrder(baseToken, quoteToken, amount, price, isBuy) {
  try {
    const amountWei = ethers.utils.parseEther(amount.toString());
    const priceWei = ethers.utils.parseEther(price.toString());
    
    const tx = await dexContract.placeLimitOrder(
      baseToken,
      quoteToken,
      amountWei,
      priceWei,
      isBuy
    );
    await tx.wait();
    console.log('Limit order placed!');
  } catch (error) {
    console.error('Error placing limit order:', error);
  }
}
```

#### **Get Order Book**
```javascript
async function getOrderBook(baseToken, quoteToken) {
  try {
    const [buyPrices, buyAmounts, sellPrices, sellAmounts] = 
      await dexContract.getOrderBook(baseToken, quoteToken);
    
    console.log('Buy Orders:');
    buyPrices.forEach((price, index) => {
      console.log(`  ${index + 1}: Price: ${ethers.utils.formatEther(price)}, Amount: ${ethers.utils.formatEther(buyAmounts[index])}`);
    });
    
    console.log('Sell Orders:');
    sellPrices.forEach((price, index) => {
      console.log(`  ${index + 1}: Price: ${ethers.utils.formatEther(price)}, Amount: ${ethers.utils.formatEther(sellAmounts[index])}`);
    });
  } catch (error) {
    console.error('Error getting order book:', error);
  }
}
```

### **7. Complete React Example**

```jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function DEXInterface() {
  const [tokenContract, setTokenContract] = useState(null);
  const [dexContract, setDexContract] = useState(null);
  const [account, setAccount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');

  useEffect(() => {
    connectWallet();
  }, []);

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Initialize contracts
        const token = new ethers.Contract(MONAD_TOKEN_ADDRESS, MONAD_TOKEN_ABI, signer);
        const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
        
        setTokenContract(token);
        setDexContract(dex);
        
        // Get initial balance
        const balance = await token.balanceOf(accounts[0]);
        setTokenBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  }

  // Example: aggregator swap is handled in app services

  return (
    <div>
      <h1>ETH DEX Interface</h1>
      <p>Connected: {account}</p>
    </div>
  );
}

export default DEXInterface;
```

### **8. Testing Checklist**

- [ ] Connect to Ethereum Sepolia
- [ ] Deploy contracts and get addresses
- [ ] Test token minting
- [ ] Test trading pair creation
- [ ] Test limit order placement
- [ ] Test order book viewing
- [ ] Test order cancellation
- [ ] Test token transfers

### **9. Common Issues & Solutions**

#### **MetaMask Network Issues**
```javascript
// Add Ethereum Sepolia if not present
const addSepolia = async () => {
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [ETH_SEPOLIA]
    });
  } catch (error) {
    console.error('Error adding network:', error);
  }
};
```

#### **Gas Estimation**
```javascript
// Estimate gas before transaction
const estimateGas = async (contract, method, ...args) => {
  try {
    const gasEstimate = await contract.estimateGas[method](...args);
    return gasEstimate;
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return null;
  }
};
```

#### **Error Handling**
```javascript
// Wrap all contract calls
const safeContractCall = async (contractCall) => {
  try {
    const result = await contractCall();
    return { success: true, data: result };
  } catch (error) {
    console.error('Contract call failed:', error);
    return { success: false, error: error.message };
  }
};
```

## 🎯 **Next Steps**

1. **Deploy contracts** using the Rust tools
2. **Update contract addresses** in your frontend
3. **Test all functionality** with small amounts
4. **Add error handling** and loading states
5. **Implement real-time updates** using events
6. **Add transaction history** and order management
7. **Optimize for production** with proper security measures 