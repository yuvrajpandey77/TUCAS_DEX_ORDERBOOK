#!/bin/bash

# Final Deployment Script for OrderBookDEX on Monad Testnet

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

echo -e "${BLUE}🚀 Final DEX Deployment${NC}"
echo "========================"

# Configuration
RPC_URL="https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"
PRIVATE_KEY="0xbac3ee8a2465d9b30a4d2ce3787743cde8a2cb159e2be937bae914152b1ee9be"
GAS_PRICE="5000000000"  # Lower gas price
GAS_LIMIT="8000000"     # Higher gas limit

print_status "Using RPC: $RPC_URL"
print_status "Gas Price: $GAS_PRICE"
print_status "Gas Limit: $GAS_LIMIT"

# Check account
ACCOUNT_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
BALANCE=$(cast balance $ACCOUNT_ADDRESS --rpc-url $RPC_URL)
print_status "Account: $ACCOUNT_ADDRESS"
print_status "Balance: $BALANCE wei"

# Build contracts
print_status "Building contracts..."
forge build --force

# Deploy with explicit settings
print_status "Deploying OrderBookDEX..."
DEPLOY_OUTPUT=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE \
    --gas-limit $GAS_LIMIT \
    contracts/OrderBookDEX.sol:OrderBookDEX \
    --json)

echo "Deploy output: $DEPLOY_OUTPUT"

# Extract address
DEX_ADDRESS=$(echo "$DEPLOY_OUTPUT" | jq -r '.deployedTo')

if [ "$DEX_ADDRESS" = "null" ] || [ -z "$DEX_ADDRESS" ]; then
    print_error "Failed to extract contract address"
    print_error "Full output: $DEPLOY_OUTPUT"
    exit 1
fi

print_success "DEX deployed: $DEX_ADDRESS"

# Verify deployment
print_status "Verifying deployment..."
CONTRACT_CODE=$(cast code $DEX_ADDRESS --rpc-url $RPC_URL)

if [ "$CONTRACT_CODE" = "0x" ]; then
    print_error "Contract verification failed - no code at address"
    exit 1
else
    print_success "Contract verified - code found at address"
fi

# Save deployment info
cat > .final-deployment << EOF
# Final Deployment - OrderBookDEX
DEX_ADDRESS=$DEX_ADDRESS
NATIVE_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
RPC_URL=$RPC_URL
CHAIN_ID=10143
DEPLOYMENT_TIME=$(date)
EOF

print_success "Deployment info saved to .final-deployment"

print_success "🎉 DEPLOYMENT SUCCESSFUL!"
echo ""
print_status "📋 Contract Address:"
echo "OrderBookDEX: $DEX_ADDRESS"
echo ""
print_status "🔧 Next Steps:"
echo "1. Add trading pairs to the DEX"
echo "2. Update frontend configuration"
echo "3. Test limit orders"
echo ""
print_status "✅ Ready for testing!" 