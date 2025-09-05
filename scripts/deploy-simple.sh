#!/bin/bash

# Simple Deployment Script for OrderBookDEX on Monad Testnet

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

echo -e "${BLUE}🚀 Simple DEX Deployment${NC}"
echo "=========================="

# Load environment
source .env

# Configuration
RPC_URL="https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"
GAS_PRICE="10000000000"  # Lower gas price
GAS_LIMIT="5000000"      # Higher gas limit

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

# Deploy DEX with explicit gas settings
print_status "Deploying OrderBookDEX..."
DEX_ADDRESS=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-price $GAS_PRICE \
    --gas-limit $GAS_LIMIT \
    contracts/OrderBookDEX.sol:OrderBookDEX \
    --json | jq -r '.deployedTo')

if [ "$DEX_ADDRESS" = "null" ] || [ -z "$DEX_ADDRESS" ]; then
    print_error "Failed to deploy DEX"
    print_status "Trying with forge script instead..."
    
    # Try using forge script
    forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
    exit 0
fi

print_success "DEX deployed: $DEX_ADDRESS"

# Save address
echo "DEX_ADDRESS=$DEX_ADDRESS" > .deployed-addresses
print_success "Address saved to .deployed-addresses"

print_success "🎉 Deployment Complete!"
echo "DEX Address: $DEX_ADDRESS" 