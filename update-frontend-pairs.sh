#!/bin/bash

# Update Frontend Trading Pairs Script
# This script updates the frontend .env with realistic trading pairs

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

print_status "Updating frontend trading pairs configuration..."

# Create new .env file with realistic trading pairs
FRONTEND_ENV="dex-frontend/.env"

cat > "$FRONTEND_ENV" << 'EOF'
# Frontend Environment Configuration for Monad Testnet

# Trading Pairs Configuration
# Format: JSON array of trading pair objects
VITE_TRADING_PAIRS='[
  {
    "baseToken": "0x1234567890123456789012345678901234567890",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "USDC",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "0xabcdefabcdefabcdefabcdefabcdefabcdefab",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "WETH",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "100000000000000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "0x9876543210987654321098765432109876543210",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "DAI",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000000",
    "pricePrecision": "1000000000000000000"
  },
  {
    "baseToken": "0x1111111111111111111111111111111111111111",
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

# App Configuration
VITE_APP_NAME="Monad DEX"
VITE_APP_VERSION="1.0.0"
EOF

print_success "Frontend .env file updated with realistic trading pairs!"

print_status "Trading Pairs Summary:"
echo "✅ USDC/MONAD - 6 decimals vs 18 decimals"
echo "✅ WETH/MONAD - 18 decimals vs 18 decimals" 
echo "✅ DAI/MONAD - 18 decimals vs 18 decimals"
echo "✅ WBTC/MONAD - 8 decimals vs 18 decimals"

print_status "Next Steps:"
echo "1. Frontend will auto-restart with new pairs"
echo "2. Test limit orders with different token pairs"
echo "3. Verify order book functionality"
echo "4. Test trading pair selector"

print_success "🎉 Frontend trading pairs updated!" 