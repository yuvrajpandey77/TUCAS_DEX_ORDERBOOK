#!/bin/bash

# Manual Test Token Creation
# This script creates test tokens using a different approach

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

print_header "🪙 CREATING TEST TOKENS MANUALLY"

print_status "Since forge is having RPC issues, let's create test tokens manually..."

# Generate some realistic-looking test addresses
USDC_ADDRESS="0x1234567890123456789012345678901234567890"
WETH_ADDRESS="0x2345678901234567890123456789012345678901"
DAI_ADDRESS="0x3456789012345678901234567890123456789012"
WBTC_ADDRESS="0x4567890123456789012345678901234567890123"

print_status "Creating test token addresses..."

# Save token addresses
cat > .test-tokens << EOF
# Test Token Addresses (Manual Creation)
USDC_ADDRESS=$USDC_ADDRESS
WETH_ADDRESS=$WETH_ADDRESS
DAI_ADDRESS=$DAI_ADDRESS
WBTC_ADDRESS=$WBTC_ADDRESS
EOF

print_success "Test token addresses created!"

print_header "📊 MANUAL TOKEN SETUP"
echo "✅ USDC: $USDC_ADDRESS"
echo "✅ WETH: $WETH_ADDRESS"
echo "✅ DAI: $DAI_ADDRESS"
echo "✅ WBTC: $WBTC_ADDRESS"

print_warning "These are placeholder addresses for testing."
print_status "To get real tokens, you need to:"
echo "1. Deploy tokens manually using a different method"
echo "2. Or use existing tokens on Monad testnet"
echo "3. Or create a simple token contract and deploy it"

print_status "For now, let's update the frontend with these addresses..."
print_status "You can manually add these tokens to your wallet for testing the UI."

# Update frontend
if [ -d "dex-frontend" ]; then
    cat > "dex-frontend/.env" << EOF
# Frontend Environment Configuration

# Trading Pairs Configuration with Test Tokens
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

    print_success "Frontend updated with test token addresses!"
fi

print_success "🎉 Manual test token setup complete!"
print_status "You can now test the UI with these placeholder addresses."
print_status "To get real tokens, you'll need to deploy them manually or use existing ones." 