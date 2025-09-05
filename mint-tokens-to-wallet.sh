#!/bin/bash

# Mint Tokens to Wallet Script
# This script mints test tokens to your wallet address

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

# Get wallet address
WALLET_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)

print_header "🪙 MINTING TOKENS TO WALLET"
print_status "Wallet address: $WALLET_ADDRESS"
print_status "Minting tokens to your wallet..."

# Mint USDC (6 decimals)
print_status "Minting USDC tokens..."
cast send $USDC_ADDRESS \
    "mint(address,uint256)" \
    $WALLET_ADDRESS \
    "1000000000" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price 50000000000 \
    --gas-limit 300000

print_success "USDC minted: 1,000,000,000 USDC (1B tokens)"

# Mint WETH (18 decimals)
print_status "Minting WETH tokens..."
cast send $WETH_ADDRESS \
    "mint(address,uint256)" \
    $WALLET_ADDRESS \
    "1000000000000000000000" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price 50000000000 \
    --gas-limit 300000

print_success "WETH minted: 1,000,000,000,000,000,000,000 WETH (1B tokens)"

# Mint DAI (18 decimals)
print_status "Minting DAI tokens..."
cast send $DAI_ADDRESS \
    "mint(address,uint256)" \
    $WALLET_ADDRESS \
    "1000000000000000000000" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price 50000000000 \
    --gas-limit 300000

print_success "DAI minted: 1,000,000,000,000,000,000,000 DAI (1B tokens)"

# Mint WBTC (8 decimals)
print_status "Minting WBTC tokens..."
cast send $WBTC_ADDRESS \
    "mint(address,uint256)" \
    $WALLET_ADDRESS \
    "100000000" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price 50000000000 \
    --gas-limit 300000

print_success "WBTC minted: 1,000,000,000 WBTC (1B tokens)"

print_header "📊 TOKEN BALANCES"
print_status "Checking your token balances..."

# Check balances
USDC_BALANCE=$(cast call $USDC_ADDRESS "balanceOf(address)" $WALLET_ADDRESS --rpc-url $RPC_URL)
WETH_BALANCE=$(cast call $WETH_ADDRESS "balanceOf(address)" $WALLET_ADDRESS --rpc-url $RPC_URL)
DAI_BALANCE=$(cast call $DAI_ADDRESS "balanceOf(address)" $WALLET_ADDRESS --rpc-url $RPC_URL)
WBTC_BALANCE=$(cast call $WBTC_ADDRESS "balanceOf(address)" $WALLET_ADDRESS --rpc-url $RPC_URL)

echo "✅ USDC Balance: $USDC_BALANCE"
echo "✅ WETH Balance: $WETH_BALANCE"
echo "✅ DAI Balance: $DAI_BALANCE"
echo "✅ WBTC Balance: $WBTC_BALANCE"

print_success "🎉 Tokens minted successfully!"
print_status "Refresh your wallet to see the new balances!"
print_status "You can now start trading on your DEX!" 