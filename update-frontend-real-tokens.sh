#!/bin/bash

# Update Frontend with Real Tokens Script
# This script updates the frontend environment with real trading pairs

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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    print_error "No .env file found"
    exit 1
fi

# Load test token addresses
if [ -f ".test-tokens" ]; then
    source .test-tokens
else
    print_error "No .test-tokens file found"
    exit 1
fi

print_header "🌐 UPDATING FRONTEND WITH REAL TOKENS"

# Frontend directory
FRONTEND_DIR="dex-frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

print_status "Updating frontend environment variables..."

# Create the frontend .env file with real trading pairs
cat > "$FRONTEND_DIR/.env" << EOF
# Frontend Environment Configuration

# Trading Pairs Configuration with Real Tokens
VITE_TRADING_PAIRS='[
  {
    "baseToken": "$USDC_ADDRESS",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "USDC",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "$WETH_ADDRESS",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "WETH",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "100000000000000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "$DAI_ADDRESS",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "DAI",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "$WBTC_ADDRESS",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "WBTC",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "100000000",
    "pricePrecision": "1000000000000000000"
  }
]'

# Network Configuration
VITE_NETWORK_NAME="Monad Testnet"
VITE_CHAIN_ID="10143"
VITE_RPC_URL="https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"

# Contract Addresses
VITE_MONAD_TOKEN_ADDRESS="0x0000000000000000000000000000000000000000"
VITE_ORDERBOOK_DEX_ADDRESS="0xa6b0D09e1c6CbBDE669eBBD0854515F002a7732e"

# Token Addresses for Frontend
VITE_USDC_ADDRESS="$USDC_ADDRESS"
VITE_WETH_ADDRESS="$WETH_ADDRESS"
VITE_DAI_ADDRESS="$DAI_ADDRESS"
VITE_WBTC_ADDRESS="$WBTC_ADDRESS"

# App Configuration
VITE_APP_NAME="Monad DEX"
VITE_APP_VERSION="1.0.0"
EOF

print_success "Frontend environment updated with real trading pairs!"

print_header "📊 FRONTEND CONFIGURATION SUMMARY"
echo "✅ USDC/MONAD: $USDC_ADDRESS"
echo "✅ WETH/MONAD: $WETH_ADDRESS"
echo "✅ DAI/MONAD: $DAI_ADDRESS"
echo "✅ WBTC/MONAD: $WBTC_ADDRESS"
echo "✅ DEX Address: 0xa6b0D09e1c6CbBDE669eBBD0854515F002a7732e"
echo "✅ RPC URL: https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"

print_success "🎉 Frontend is ready for real trading!"

print_status "Next steps:"
echo "1. Start the frontend: cd dex-frontend && npm run dev"
echo "2. Connect your wallet to Monad Testnet"
echo "3. Import test tokens to your wallet"
echo "4. Start trading with real test tokens!" 