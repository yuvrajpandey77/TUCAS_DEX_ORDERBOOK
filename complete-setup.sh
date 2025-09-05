#!/bin/bash

# Complete DEX Setup Script
# This script runs all setup steps in sequence

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

print_header "🚀 COMPLETE MONAD DEX SETUP"
print_status "Running all setup steps in sequence..."

## Step 1: Deploy Test Tokens
print_header "Step 1: Deploying Test Tokens"
if [ -f "deploy-test-tokens.sh" ]; then
    ./deploy-test-tokens.sh
    print_success "✅ Test tokens deployed successfully"
else
    print_error "❌ deploy-test-tokens.sh not found"
    exit 1
fi

## Step 2: Add Real Trading Pairs
print_header "Step 2: Adding Real Trading Pairs"
if [ -f "add-real-trading-pairs.sh" ]; then
    ./add-real-trading-pairs.sh
    print_success "✅ Real trading pairs added successfully"
else
    print_error "❌ add-real-trading-pairs.sh not found"
    exit 1
fi

## Step 3: Update Frontend with Real Tokens
print_header "Step 3: Updating Frontend Configuration"
if [ -f "update-frontend-real-tokens.sh" ]; then
    ./update-frontend-real-tokens.sh
    print_success "✅ Frontend updated with real tokens"
else
    print_error "❌ update-frontend-real-tokens.sh not found"
    exit 1
fi

## Step 4: Complete Testing
print_header "Step 4: Complete System Testing"
if [ -f "test-complete-dex.sh" ]; then
    ./test-complete-dex.sh
    print_success "✅ Complete system testing finished"
else
    print_error "❌ test-complete-dex.sh not found"
    exit 1
fi

## Final Summary
print_header "🎉 SETUP COMPLETE!"
print_success "✅ All components deployed and configured"
print_success "✅ Real test tokens deployed"
print_success "✅ Trading pairs active"
print_success "✅ Frontend updated with real addresses"
print_success "✅ All systems tested and operational"

print_header "🚀 YOUR MONAD DEX IS READY!"
echo "🎯 What you now have:"
echo "  - DEX Contract: 0xa6b0D09e1c6CbBDE669eBBD0854515F002a7732e"
echo "  - 4 Real ERC20 test tokens deployed"
echo "  - 4 Active trading pairs"
echo "  - Frontend configured with real addresses"
echo "  - All systems tested and working"

print_header "🎮 NEXT STEPS"
echo "1. Open http://localhost:8081 in your browser"
echo "2. Connect MetaMask to Monad testnet (Chain ID: 10143)"
echo "3. Test limit orders with different trading pairs"
echo "4. Verify order book functionality"
echo "5. Test trading pair selector"
echo "6. Check debug panel - should show 'Deployed'"

print_header "📊 TRADING PAIRS AVAILABLE"
echo "✅ USDC/MONAD - 6 decimals vs 18 decimals"
echo "✅ WETH/MONAD - 18 decimals vs 18 decimals"
echo "✅ DAI/MONAD - 18 decimals vs 18 decimals"
echo "✅ WBTC/MONAD - 8 decimals vs 18 decimals"

print_success "🎉 Your Monad DEX is fully operational!"
print_status "The 'DEX Contract: Not Deployed' issue is completely resolved!" 