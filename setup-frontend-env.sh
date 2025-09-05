#!/bin/bash

# Setup Frontend Environment for Monad Testnet
# This script creates the correct .env file for the frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Setting up frontend environment for Monad Testnet..."

# Check if .deployed-addresses exists
if [ ! -f ".deployed-addresses" ]; then
    print_error "No deployed addresses found. Please deploy contracts first."
    print_status "Run: ./scripts/deploy-simplified.sh"
    exit 1
fi

# Read deployed addresses
source .deployed-addresses

print_status "Deployed contract addresses:"
echo "DEX Address: $DEX_ADDRESS"
echo "Chain ID: $CHAIN_ID"
echo "RPC URL: $RPC_URL"

# Create frontend .env file
FRONTEND_ENV="dex-frontend/.env"

print_status "Creating frontend .env file..."

cat > "$FRONTEND_ENV" << EOF
# Frontend Environment Configuration for Monad Testnet

# Trading Pairs Configuration
# Format: JSON array of trading pair objects
VITE_TRADING_PAIRS='[
  {
    "baseToken": "0x0000000000000000000000000000000000000000",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "MONAD",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000",
    "pricePrecision": "1000000000000000000"
  }
]'

# Network Configuration
VITE_NETWORK_NAME="Monad Testnet"
VITE_CHAIN_ID="$CHAIN_ID"
VITE_RPC_URL="$RPC_URL"

# Contract Addresses
VITE_MONAD_TOKEN_ADDRESS="0x0000000000000000000000000000000000000000"
VITE_ORDERBOOK_DEX_ADDRESS="$DEX_ADDRESS"

# App Configuration
VITE_APP_NAME="Monad DEX"
VITE_APP_VERSION="1.0.0"
EOF

print_success "Frontend .env file created at $FRONTEND_ENV"

print_status "Configuration Summary:"
echo "✅ Network: Monad Testnet (Chain ID: $CHAIN_ID)"
echo "✅ RPC URL: $RPC_URL"
echo "✅ DEX Contract: $DEX_ADDRESS"
echo "✅ Trading Pair: MONAD/MONAD (Native Token)"
echo "✅ Min Order Size: 1 MONAD"
echo "✅ Price Precision: 18 decimals"

print_status "Next Steps:"
echo "1. Start the frontend: cd dex-frontend && npm run dev"
echo "2. Connect your wallet to Monad Testnet"
echo "3. Test limit orders for MONAD/MONAD pair"

print_success "Frontend environment setup complete! 🎉" 