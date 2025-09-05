#!/bin/bash

# Fresh Deployment Script for Limit Orders on Monad Testnet
# Deploys DEX and adds MONAD Token ↔ Native MONAD trading pair

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}🚀 Fresh Limit Order Deployment on Monad Testnet${NC}"
echo "=================================================="

# Check environment
if [ ! -f .env ]; then
    print_error ".env file not found. Please create one with your PRIVATE_KEY"
    exit 1
fi

source .env

if [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    print_error "Please update PRIVATE_KEY in .env file"
    exit 1
fi

# Correct Monad testnet configuration
RPC_URL="https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"
CHAIN_ID="10143"
GAS_PRICE="20000000000"

print_status "Using RPC: $RPC_URL"
print_status "Chain ID: $CHAIN_ID"
print_status "Gas Price: $GAS_PRICE"

# Check account balance
print_status "Checking account balance..."
ACCOUNT_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
BALANCE=$(cast balance $ACCOUNT_ADDRESS --rpc-url $RPC_URL)
print_status "Account: $ACCOUNT_ADDRESS"
print_status "Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
    print_error "Account has no balance. Please fund your account with testnet MONAD"
    exit 1
fi

# Build contracts
print_status "Building contracts..."
forge build --force

# Deploy MONAD Token
print_status "Deploying MONAD Token..."
MONAD_TOKEN_ADDRESS=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE \
    contracts/MonadToken.sol:MonadToken \
    --json | jq -r '.deployedTo')

if [ "$MONAD_TOKEN_ADDRESS" = "null" ] || [ -z "$MONAD_TOKEN_ADDRESS" ]; then
    print_error "Failed to deploy MONAD Token"
    exit 1
fi

print_success "MONAD Token deployed: $MONAD_TOKEN_ADDRESS"

# Deploy DEX
print_status "Deploying OrderBookDEX..."
DEX_ADDRESS=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE \
    contracts/OrderBookDEX.sol:OrderBookDEX \
    --json | jq -r '.deployedTo')

if [ "$DEX_ADDRESS" = "null" ] || [ -z "$DEX_ADDRESS" ]; then
    print_error "Failed to deploy DEX"
    exit 1
fi

print_success "DEX deployed: $DEX_ADDRESS"

# Add trading pair: MONAD Token ↔ Native MONAD
print_status "Adding trading pair: MONAD Token ↔ Native MONAD..."
NATIVE_TOKEN="0x0000000000000000000000000000000000000000"
MIN_ORDER_SIZE="1000000000000000000"  # 1 MONAD
PRICE_PRECISION="1000000000000000000" # 18 decimals

cast send $DEX_ADDRESS \
    "addTradingPair(address,address,uint256,uint256)" \
    $MONAD_TOKEN_ADDRESS \
    $NATIVE_TOKEN \
    $MIN_ORDER_SIZE \
    $PRICE_PRECISION \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE

print_success "Trading pair added successfully"

# Save addresses
cat > .limit-order-addresses << EOF
# Limit Order Contract Addresses - Fresh Deployment
MONAD_TOKEN_ADDRESS=$MONAD_TOKEN_ADDRESS
DEX_ADDRESS=$DEX_ADDRESS
NATIVE_TOKEN_ADDRESS=$NATIVE_TOKEN
RPC_URL=$RPC_URL
CHAIN_ID=$CHAIN_ID
EOF

print_success "Addresses saved to .limit-order-addresses"

# Test the deployment
print_status "Testing deployment..."

# Check if trading pair is active
print_status "Checking trading pair status..."
TRADING_PAIR_ACTIVE=$(cast call $DEX_ADDRESS \
    "isTradingPairActive(address,address)" \
    $MONAD_TOKEN_ADDRESS \
    $NATIVE_TOKEN \
    --rpc-url $RPC_URL)

if [ "$TRADING_PAIR_ACTIVE" = "true" ]; then
    print_success "Trading pair is active!"
else
    print_error "Trading pair is not active!"
    exit 1
fi

# Update .env with new addresses
print_status "Updating .env file..."
sed -i "s/MONAD_TOKEN_ADDRESS=.*/MONAD_TOKEN_ADDRESS=$MONAD_TOKEN_ADDRESS/" .env
sed -i "s/ORDERBOOK_DEX_ADDRESS=.*/ORDERBOOK_DEX_ADDRESS=$DEX_ADDRESS/" .env
sed -i "s/CHAIN_ID=.*/CHAIN_ID=$CHAIN_ID/" .env

print_success ".env file updated"

# Update frontend config
print_status "Updating frontend configuration..."
FRONTEND_CONFIG="dex-frontend/src/config/contracts.ts"

if [ -f "$FRONTEND_CONFIG" ]; then
    # Backup original
    cp "$FRONTEND_CONFIG" "$FRONTEND_CONFIG.backup"
    
    # Update with new addresses
    cat > "$FRONTEND_CONFIG" << EOF
export const CONTRACTS = {
  MONAD_TOKEN: {
    address: '$MONAD_TOKEN_ADDRESS',
    abi: [] // Add ABI if needed
  },
  ORDERBOOK_DEX: {
    address: '$DEX_ADDRESS',
    abi: [] // Add ABI if needed
  }
} as const;
EOF
    
    print_success "Frontend config updated"
else
    print_warning "Frontend config not found at $FRONTEND_CONFIG"
fi

print_success "🎉 Fresh Limit Order Deployment Complete!"
echo ""
print_status "📋 Contract Addresses:"
echo "MONAD Token: $MONAD_TOKEN_ADDRESS"
echo "DEX Contract: $DEX_ADDRESS"
echo "Native Token: $NATIVE_TOKEN"
echo ""
print_status "🔧 Next Steps:"
echo "1. Start the frontend: cd dex-frontend && npm run dev"
echo "2. Connect your wallet"
echo "3. Test limit orders!"
echo ""
print_status "💡 Quick Test:"
echo "You can now place limit orders for MONAD Token ↔ Native MONAD" 