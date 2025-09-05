# 🧪 Balance Testing Guide

## 🎯 Overview

This guide helps you test and verify that user balance functionality is working correctly in the Monad DEX.

## 🔧 What's Been Added

### 1. User Balance Component (`user-balance.tsx`)
- **Displays wallet balance** (tokens in user's wallet)
- **Displays DEX balance** (tokens available for trading)
- **Shows total balance** (wallet + DEX)
- **Auto-refresh functionality**
- **Real-time updates**

### 2. Withdraw Form (`withdraw-form.tsx`)
- **Withdraw tokens** from DEX to wallet
- **Amount validation**
- **Gas fee warnings**
- **Transaction status feedback**

### 3. Balance Test Component (`balance-test.tsx`)
- **Comprehensive testing** of all balance functions
- **Step-by-step debugging**
- **Detailed error reporting**
- **Service initialization testing**

## 🚀 How to Test

### Step 1: Start the Frontend
```bash
cd rust-project/frontend
npm run dev
```

### Step 2: Connect Wallet
1. **Open browser** to `http://localhost:5173`
2. **Click "Connect Wallet"**
3. **Approve MetaMask connection**
4. **Verify account** is displayed in header

### Step 3: Test Balance Display
1. **Look for "User Balance" card** in the right sidebar
2. **Check if balances load** automatically
3. **Click refresh button** to manually update
4. **Verify wallet and DEX balances** are displayed

### Step 4: Use Balance Test Component
1. **Find "Balance Test" card** at the bottom
2. **Click "Test Balance Fetching"**
3. **Watch step-by-step results**
4. **Check for any errors** in the results

## 🔍 What the Balance Test Checks

### ✅ Service Initialization
- Token service initialization
- DEX service initialization
- Contract connection verification

### ✅ Balance Fetching
- Wallet balance retrieval
- DEX balance retrieval
- Token symbol fetching
- Balance formatting

### ✅ Token Approval
- Current allowance checking
- Approval status verification
- Spender address validation

### ✅ Error Handling
- Network connection errors
- Contract call failures
- Invalid address errors
- Gas estimation issues

## 🐛 Common Issues & Solutions

### Issue: "Contract not initialized"
**Solution**: 
- Ensure wallet is connected
- Check network connection
- Verify contract addresses are correct

### Issue: "could not decode result data"
**Solution**:
- Check if contract ABI is correct
- Verify contract is deployed
- Ensure function signatures match

### Issue: "Insufficient balance"
**Solution**:
- Check if user has tokens
- Verify token contract address
- Test with small amounts first

### Issue: "Transaction failed"
**Solution**:
- Check gas settings
- Verify network connection
- Ensure sufficient ETH for gas

## 📊 Expected Results

### Successful Balance Test Should Show:
```
🔄 Initializing token service...
✅ Token service initialized
🔄 Getting token symbol...
✅ Token symbol: MONAD
🔄 Getting wallet balance...
✅ Wallet balance: 1000.000000 MONAD
🔄 Initializing DEX service...
✅ DEX service initialized
🔄 Getting DEX balance...
✅ DEX balance: 500.000000 MONAD
🔄 Getting token allowance...
✅ Token allowance: 1000.000000 MONAD
✅ Total balance: 1500.000000 MONAD
```

### User Balance Component Should Show:
- **Wallet Balance**: Tokens in your wallet
- **DEX Balance**: Tokens available for trading
- **Total Balance**: Sum of both balances
- **Refresh Button**: Manual update option

## 🔧 Debugging Steps

### 1. Check Console Logs
```javascript
// Open browser dev tools (F12)
// Look for error messages in Console tab
```

### 2. Verify Contract Addresses
```javascript
// Check if addresses are correct
MONAD_TOKEN: 0x14F49BedD983423198d5402334dbccD9c45AC767
ORDERBOOK_DEX: 0x6045fe7667E22CE9ff8106429128DDdC90F6F9Ae
```

### 3. Test Network Connection
```javascript
// Verify you're on the correct network
Network: Monad Testnet
Chain ID: 1337
```

### 4. Check Token Balances
```bash
# Use Rust CLI to verify balances
cargo run --bin interact balance --address 0x14F49BedD983423198d5402334dbccD9c45AC767 --user <YOUR_ADDRESS>
```

## 🎯 Next Steps

### If Balance Test Fails:
1. **Check error messages** in test results
2. **Verify contract deployment**
3. **Test with Rust CLI tools**
4. **Check network configuration**

### If Balance Test Passes:
1. **Test withdrawal functionality**
2. **Test trading with real orders**
3. **Verify balance updates** after trades
4. **Test with different amounts**

## 📝 Troubleshooting Checklist

- [ ] Wallet connected successfully
- [ ] Network is Monad Testnet
- [ ] Contract addresses are correct
- [ ] User has tokens in wallet
- [ ] Gas fees are sufficient
- [ ] No console errors
- [ ] Balance test passes
- [ ] User balance component displays correctly
- [ ] Withdraw form works
- [ ] Balance updates after transactions

## 🚀 Advanced Testing

### Test Withdrawal:
1. **Enter amount** in withdraw form
2. **Click "Withdraw Tokens"**
3. **Approve transaction** in MetaMask
4. **Check balance updates**

### Test Trading:
1. **Place a small order**
2. **Check balance changes**
3. **Cancel order**
4. **Verify balance restoration**

### Test Error Scenarios:
1. **Try withdrawing more than balance**
2. **Test with invalid amounts**
3. **Disconnect wallet and reconnect**
4. **Switch networks and back**

**Happy Testing! 🧪** 