# 🔧 CORS Troubleshooting Guide

## 🚨 **Issue: CORS Error with RPC Endpoints**

You're experiencing CORS (Cross-Origin Resource Sharing) errors when trying to connect to Ethereum RPC endpoints from your local development server.

## ✅ **Solutions Implemented**

### **1. Multiple RPC Endpoints with Fallback**
- Added multiple CORS-friendly RPC endpoints
- Automatic fallback if primary endpoint fails
- Better error handling and user feedback

### **2. Local Proxy (Recommended)**
- Added Vite proxy configuration
- Routes `/api/rpc` to CORS-friendly endpoint
- Eliminates CORS issues in development

### **3. Alternative RPC Providers**
- PublicNode (CORS-friendly)
- Infura (CORS-friendly) 
- Tenderly (CORS-friendly)

## 🚀 **Quick Fix Steps**

### **Step 1: Restart Development Server**
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd dex-frontend
npm run dev
```

### **Step 2: Test the Fix**
1. Go to `http://localhost:8080/swap`
2. Open browser console (F12)
3. Check if CORS errors are gone
4. Try connecting wallet

### **Step 3: Verify RPC Connection**
1. Go to `http://localhost:8080/uniswap-demo`
2. Click "Run Integration Tests"
3. Check if network tests pass

## 🔍 **If Issues Persist**

### **Option 1: Use Direct RPC (Bypass Proxy)**
Update `src/config/uniswap-v3.ts`:
```typescript
RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
```

### **Option 2: Use Infura (Requires API Key)**
1. Get free API key from [Infura](https://infura.io/)
2. Update config:
```typescript
RPC_URL: 'https://sepolia.infura.io/v3/YOUR_API_KEY',
```

### **Option 3: Use Alchemy (Requires API Key)**
1. Get free API key from [Alchemy](https://alchemy.com/)
2. Update config:
```typescript
RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
```

## 🛠 **Manual Testing**

### **Test RPC Connection**
```javascript
// Open browser console and run:
fetch('/api/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected Result:** Should return `{"jsonrpc":"2.0","id":1,"result":"0xaa36a7"}` (Sepolia chain ID)

## 📋 **Troubleshooting Checklist**

- [ ] Development server restarted
- [ ] No CORS errors in console
- [ ] RPC proxy working (`/api/rpc`)
- [ ] Wallet connection works
- [ ] Network info loads
- [ ] Token balances load
- [ ] Price quotes work

## 🎯 **Expected Behavior After Fix**

1. **No CORS errors** in browser console
2. **Wallet connection** works smoothly
3. **Network info** loads correctly
4. **Token balances** display properly
5. **Price quotes** work for ETH/USDC
6. **Swap functionality** is operational

## 🚨 **Common Issues & Solutions**

### **Issue: Still getting CORS errors**
**Solution:** Clear browser cache and restart server

### **Issue: RPC proxy not working**
**Solution:** Check Vite config and restart server

### **Issue: Network detection fails**
**Solution:** Try alternative RPC endpoints

### **Issue: Slow response times**
**Solution:** Switch to faster RPC provider

## 📞 **Need Help?**

If you're still experiencing issues:

1. **Check browser console** for specific error messages
2. **Try different RPC endpoints** in the config
3. **Test with different browsers** (Chrome, Firefox)
4. **Check internet connection** and firewall settings

The implemented solution should resolve the CORS issues and allow your Uniswap V3 integration to work properly! 🚀
