# 🚀 Quick DEX Deployment Guide

**The fastest way to deploy your ETH DEX backend**

## ⚡ Quick Start (Recommended)

### 1. Setup Environment
```bash
cd rust-project
cp .env.example .env
# Edit .env with your private key
```

### 2. Deploy Everything
```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

**That's it!** This will deploy:
- ✅ Token A (for trading)
- ✅ Token B (for trading) 
- ✅ DEX Contract
- ✅ Trading Pair
- ✅ Test everything

## 🔧 Alternative Methods

### Option 1: Docker Deployment
```bash
export PRIVATE_KEY=your_private_key_here
docker-compose up --build
```

### Option 2: Manual Deployment
```bash
# Build
cargo build --release
forge build

# Deploy DEX (includes tokens)
chmod +x scripts/deploy-dex.sh
./scripts/deploy-dex.sh
```

## 📋 What You Get

After deployment, you'll have:
- **Token A**: `0x...` (for trading)
- **Token B**: `0x...` (for trading)
- **DEX Contract**: `0x...` (order book)
- **Trading Pair**: TokenA/TokenB

Addresses are saved in `.deployed-addresses`

## 🧪 Test Your Deployment

```bash
# Test tokens
cargo run --bin eth-interact info --address $TOKEN_A_ADDRESS

# Test DEX
cargo run --bin eth-dex get-order-book \
  --address $DEX_ADDRESS \
  --base-token $TOKEN_A_ADDRESS \
  --quote-token $TOKEN_B_ADDRESS

# Place a test order
cargo run --bin eth-dex place-limit-order \
  --address $DEX_ADDRESS \
  --base-token $TOKEN_A_ADDRESS \
  --quote-token $TOKEN_B_ADDRESS \
  --amount 1000000000000000000 \
  --price 1000000000000000000 \
  --is-buy true \
  --private-key $PRIVATE_KEY
```

## 🔗 Update Frontend

Copy addresses from `.deployed-addresses` to your frontend:
```typescript
// In your frontend
const DEX_ADDRESS = "0x..."; // From .deployed-addresses
const TOKEN_A_ADDRESS = "0x...";
const TOKEN_B_ADDRESS = "0x...";
```

## 🚨 Troubleshooting

### Common Issues:
1. **"Private key not set"** → Edit `.env` file
2. **"Foundry not found"** → `curl -L https://foundry.paradigm.xyz | bash`
3. **"Rust not found"** → `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### Check Network:
```bash
curl -X POST https://rpc.testnet.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📞 Support

- Check logs: `journalctl -u monad-dex -f`
- Test network: `curl https://rpc.testnet.monad.xyz`
- Explorer: https://explorer.monad.xyz

---

**🎉 Your DEX is ready! Start trading!** 