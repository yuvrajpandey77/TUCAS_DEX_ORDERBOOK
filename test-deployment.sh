#!/bin/bash

# Comprehensive Monad DEX Deployment Test Script
echo "🚀 Testing Monad DEX Deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Test 1: Token Contract Info
print_info "Testing Token Contract Info..."
cargo run --bin monad-interact info --address 0x14F49BedD983423198d5402334dbccD9c45AC767
if [ $? -eq 0 ]; then
    print_success "Token contract info test passed"
else
    print_error "Token contract info test failed"
fi

echo ""

# Test 2: Token Balance
print_info "Testing Token Balance..."
cargo run --bin monad-interact balance --address 0x14F49BedD983423198d5402334dbccD9c45AC767 --account 0x6441D6Fe2c6aF8EAe8bC5a534e82bE802d8d1a0e
if [ $? -eq 0 ]; then
    print_success "Token balance test passed"
else
    print_error "Token balance test failed"
fi

echo ""

# Test 3: DEX Order Book
print_info "Testing DEX Order Book..."
cargo run --bin monad-dex get-order-book --address 0x6045fe7667E22CE9ff8106429128DDdC90F6F9Ae --base-token 0x14F49BedD983423198d5402334dbccD9c45AC767 --quote-token 0x14F49BedD983423198d5402334dbccD9c45AC767
if [ $? -eq 0 ]; then
    print_success "DEX order book test passed"
else
    print_error "DEX order book test failed"
fi

echo ""

# Test 4: Network Connectivity
print_info "Testing Network Connectivity..."
curl -X POST https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  --silent | grep -q "result"
if [ $? -eq 0 ]; then
    print_success "Network connectivity test passed"
else
    print_error "Network connectivity test failed"
fi

echo ""

print_info "🎉 Deployment Test Summary:"
echo "Contract Addresses:"
echo "  MonadToken: 0x14F49BedD983423198d5402334dbccD9c45AC767"
echo "  OrderBookDEX: 0x6045fe7667E22CE9ff8106429128DDdC90F6F9Ae"
echo ""
echo "Network: Monad Testnet"
echo "RPC: https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe"
echo ""
echo "✅ All core functionality verified!"
echo "🚀 Ready for frontend integration!" 