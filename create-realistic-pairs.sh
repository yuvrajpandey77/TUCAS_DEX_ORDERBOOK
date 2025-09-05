#!/bin/bash

# Create Realistic Trading Pairs Script
# This script adds realistic trading pairs with different tokens

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

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    print_error "No .env file found"
    exit 1
fi

# Contract address from deployment
DEX_ADDRESS="0xa6b0D09e1c6CbBDE669eBBD0854515F002a7732e"

print_status "Creating realistic trading pairs..."
print_status "Contract: $DEX_ADDRESS"

# Gas settings
GAS_PRICE="50000000000"  # 50 gwei
GAS_LIMIT="300000"       # 300k gas limit

# Realistic trading pairs (using mock token addresses)
declare -a TRADING_PAIRS=(
    # USDC ↔ MONAD (6 decimals vs 18 decimals)
    "0x1234567890123456789012345678901234567890|0x0000000000000000000000000000000000000000|USDC|MONAD|1000000|1000000000000000000"
    
    # WETH ↔ MONAD (18 decimals vs 18 decimals)
    "0xabcdefabcdefabcdefabcdefabcdefabcdefab|0x0000000000000000000000000000000000000000|WETH|MONAD|100000000000000000|1000000000000000000"
    
    # DAI ↔ MONAD (18 decimals vs 18 decimals)
    "0x9876543210987654321098765432109876543210|0x0000000000000000000000000000000000000000|DAI|MONAD|1000000000000000000000|1000000000000000000"
    
    # WBTC ↔ MONAD (8 decimals vs 18 decimals)
    "0x1111111111111111111111111111111111111111|0x0000000000000000000000000000000000000000|WBTC|MONAD|100000000|1000000000000000000"
)

print_status "Adding ${#TRADING_PAIRS[@]} realistic trading pairs..."

for pair in "${TRADING_PAIRS[@]}"; do
    IFS='|' read -r base_token quote_token base_symbol quote_symbol min_order price_precision <<< "$pair"
    
    print_status "Adding pair: $base_symbol/$quote_symbol"
    print_status "Base: $base_token"
    print_status "Quote: $quote_token"
    print_status "Min Order: $min_order"
    print_status "Price Precision: $price_precision"
    
    # Add trading pair with explicit gas settings
    cast send $DEX_ADDRESS \
        "addTradingPair(address,address,uint256,uint256)" \
        $base_token \
        $quote_token \
        $min_order \
        $price_precision \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --gas-price $GAS_PRICE \
        --gas-limit $GAS_LIMIT
    
    if [ $? -eq 0 ]; then
        print_success "Trading pair $base_symbol/$quote_symbol added successfully!"
    else
        print_error "Failed to add trading pair $base_symbol/$quote_symbol"
    fi
    
    # Wait a bit between transactions
    sleep 3
done

print_success "Realistic trading pairs setup complete!"

# Verify trading pairs
print_status "Verifying trading pairs..."

for pair in "${TRADING_PAIRS[@]}"; do
    IFS='|' read -r base_token quote_token base_symbol quote_symbol min_order price_precision <<< "$pair"
    
    print_status "Checking $base_symbol/$quote_symbol..."
    
    # Check if trading pair is active
    is_active=$(cast call $DEX_ADDRESS \
        "isTradingPairActive(address,address)" \
        $base_token \
        $quote_token \
        --rpc-url $RPC_URL)
    
    if [ "$is_active" = "true" ]; then
        print_success "$base_symbol/$quote_symbol is active!"
    else
        print_warning "$base_symbol/$quote_symbol is not active"
    fi
done

print_success "🎉 Realistic trading pairs analysis complete!" 