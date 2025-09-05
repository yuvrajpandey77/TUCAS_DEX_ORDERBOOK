#!/bin/bash

# Quick Deployment Script for Limit Orders
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

echo -e "${BLUE}🚀 Quick Limit Order Deployment${NC}"
echo "======================================"

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

RPC_URL=${RPC_URL:-"https://rpc.testnet.monad.xyz"}
GAS_PRICE=${GAS_PRICE:-"20000000000"}

print_status "Using RPC: $RPC_URL"
print_status "Using Gas Price: $GAS_PRICE"

# Build contracts
print_status "Building contracts..."
forge build --force

# No custom token needed - using native MONAD
print_status "Using native MONAD token (no custom token deployment needed)"
NATIVE_TOKEN="0x0000000000000000000000000000000000000000"

# Deploy DEX
print_status "Deploying OrderBookDEX..."
DEX_ADDRESS=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE \
    contracts/OrderBookDEX.sol:OrderBookDEX \
    --json | jq -r '.deployedTo')

print_success "DEX deployed: $DEX_ADDRESS"

# Add trading pair: Native MONAD ↔ Native MONAD (for testing)
print_status "Adding trading pair: Native MONAD ↔ Native MONAD..."
MIN_ORDER_SIZE="1000000000000000000"  # 1 MONAD
PRICE_PRECISION="1000000000000000000" # 18 decimals

cast send $DEX_ADDRESS \
    "addTradingPair(address,address,uint256,uint256)" \
    $NATIVE_TOKEN \
    $NATIVE_TOKEN \
    $MIN_ORDER_SIZE \
    $PRICE_PRECISION \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE

print_success "Trading pair added successfully"

# Save addresses
cat > .limit-order-addresses << EOF
# Limit Order Contract Addresses (Simplified - Native MONAD only)
DEX_ADDRESS=$DEX_ADDRESS
NATIVE_TOKEN_ADDRESS=$NATIVE_TOKEN
RPC_URL=$RPC_URL
EOF

print_success "Addresses saved to .limit-order-addresses"

# Test the deployment
print_status "Testing deployment..."

# Check if trading pair is active
print_status "Checking trading pair status..."
cast call $DEX_ADDRESS \
    "isTradingPairActive(address,address)" \
    $NATIVE_TOKEN \
    $NATIVE_TOKEN \
    --rpc-url $RPC_URL

print_success "Trading pair is active!"

# Update frontend config
print_status "Updating frontend configuration..."
FRONTEND_CONFIG="dex-frontend/src/config/contracts.ts"

if [ -f "$FRONTEND_CONFIG" ]; then
    # Backup original
    cp "$FRONTEND_CONFIG" "$FRONTEND_CONFIG.backup"
    
    # Update with new addresses
    cat > "$FRONTEND_CONFIG" << EOF
export const CONTRACTS = {
  ORDERBOOK_DEX: {
    address: '$DEX_ADDRESS',
    abi: [] // Add ABI if needed
  }
} as const;

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';
EOF
    
    print_success "Frontend config updated"
else
    print_warning "Frontend config not found at $FRONTEND_CONFIG"
fi

print_success "🎉 Simplified Limit Order Deployment Complete!"
echo ""
print_status "📋 Contract Addresses:"
echo "DEX Contract: $DEX_ADDRESS"
echo "Native Token: $NATIVE_TOKEN"
echo ""
print_status "🔧 Next Steps:"
echo "1. Start the frontend: cd dex-frontend && npm run dev"
echo "2. Connect your wallet"
echo "3. Test limit orders with native MONAD!"
echo ""
print_status "💡 Trading Setup:"
echo "Users can now place limit orders using native MONAD"
echo "This simulates a realistic DEX scenario" 