#!/bin/bash

# Add Simple Trading Pair Script
# This script adds one realistic trading pair to the DEX

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

# Contract address
DEX_ADDRESS="0xa6b0D09e1c6CbBDE669eBBD0854515F002a7732e"

print_status "Adding simple trading pair..."

# Use a realistic token address (this would be a real token on Monad testnet)
# For now, let's use a different approach - create a simple test pair
TEST_TOKEN="0x1234567890123456789012345678901234567890"
NATIVE_TOKEN="0x0000000000000000000000000000000000000000"

print_status "Adding TEST/MONAD trading pair..."
print_status "Base Token: $TEST_TOKEN"
print_status "Quote Token: $NATIVE_TOKEN"
print_status "Min Order: 1000000000000000000 (1 token)"
print_status "Price Precision: 1000000000000000000 (18 decimals)"

# Add trading pair with explicit gas settings
cast send $DEX_ADDRESS \
    "addTradingPair(address,address,uint256,uint256)" \
    $TEST_TOKEN \
    $NATIVE_TOKEN \
    1000000000000000000 \
    1000000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price 50000000000 \
    --gas-limit 300000

if [ $? -eq 0 ]; then
    print_success "Trading pair TEST/MONAD added successfully!"
else
    print_error "Failed to add trading pair"
    exit 1
fi

# Verify the trading pair
print_status "Verifying trading pair..."

sleep 5

is_active=$(cast call $DEX_ADDRESS \
    "isTradingPairActive(address,address)" \
    $TEST_TOKEN \
    $NATIVE_TOKEN \
    --rpc-url $RPC_URL)

if [ "$is_active" = "true" ]; then
    print_success "TEST/MONAD trading pair is active!"
else
    print_warning "TEST/MONAD trading pair is not active"
fi

print_success "🎉 Simple trading pair setup complete!" 