#!/bin/bash

# Setup Vercel Environment Variables Script
# This script helps you set up the correct environment variables for Vercel deployment

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

print_header "🌐 VERCEL ENVIRONMENT SETUP"

print_status "This script will help you set up environment variables for your Vercel deployment."

# Check if we have real token addresses
if [ -f ".test-tokens" ]; then
    source .test-tokens
    print_success "Found token addresses from .test-tokens"
else
    print_warning "No .test-tokens file found. Using placeholder addresses."
    USDC_ADDRESS="0x1234567890123456789012345678901234567890"
    WETH_ADDRESS="0x2345678901234567890123456789012345678901"
    DAI_ADDRESS="0x3456789012345678901234567890123456789012"
    WBTC_ADDRESS="0x4567890123456789012345678901234567890123"
fi

print_header "📋 ENVIRONMENT VARIABLES FOR VERCEL"

echo ""
echo "Add these environment variables to your Vercel project:"
echo ""

# Trading Pairs Configuration
echo "VITE_TRADING_PAIRS:"
echo "'["
echo "  {"
echo "    \"baseToken\": \"$USDC_ADDRESS\","
echo "    \"quoteToken\": \"0x0000000000000000000000000000000000000000\","
echo "    \"baseTokenSymbol\": \"USDC\"," 
echo "    \"quoteTokenSymbol\": \"ETH\"," 
echo "    \"isActive\": true,"
echo "    \"minOrderSize\": \"1000000\","
echo "    \"pricePrecision\": \"1000000000000000000\""
echo "  },"
echo "  {"
echo "    \"baseToken\": \"$WETH_ADDRESS\","
echo "    \"quoteToken\": \"0x0000000000000000000000000000000000000000\","
echo "    \"baseTokenSymbol\": \"WETH\"," 
echo "    \"quoteTokenSymbol\": \"ETH\"," 
echo "    \"isActive\": true,"
echo "    \"minOrderSize\": \"100000000000000000\","
echo "    \"pricePrecision\": \"1000000000000000000\""
echo "  },"
echo "  {"
echo "    \"baseToken\": \"$DAI_ADDRESS\","
echo "    \"quoteToken\": \"0x0000000000000000000000000000000000000000\","
echo "    \"baseTokenSymbol\": \"DAI\"," 
echo "    \"quoteTokenSymbol\": \"ETH\"," 
echo "    \"isActive\": true,"
echo "    \"minOrderSize\": \"1000000000000000000000\","
echo "    \"pricePrecision\": \"1000000000000000000\""
echo "  },"
echo "  {"
echo "    \"baseToken\": \"$WBTC_ADDRESS\","
echo "    \"quoteToken\": \"0x0000000000000000000000000000000000000000\","
echo "    \"baseTokenSymbol\": \"WBTC\"," 
echo "    \"quoteTokenSymbol\": \"ETH\"," 
echo "    \"isActive\": true,"
echo "    \"minOrderSize\": \"100000000\","
echo "    \"pricePrecision\": \"1000000000000000000\""
echo "  }"
echo "]'"
echo ""

# Network Configuration
echo "VITE_NETWORK_NAME: Ethereum Sepolia"
echo "VITE_CHAIN_ID: 11155111"
echo "VITE_RPC_URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
echo ""

# Contract Addresses
echo "VITE_ORDERBOOK_DEX_ADDRESS: 0x0000000000000000000000000000000000000000"
echo ""

# Token Addresses
echo "VITE_USDC_ADDRESS: $USDC_ADDRESS"
echo "VITE_WETH_ADDRESS: $WETH_ADDRESS"
echo "VITE_DAI_ADDRESS: $DAI_ADDRESS"
echo "VITE_WBTC_ADDRESS: $WBTC_ADDRESS"
echo ""

# App Configuration
echo "VITE_APP_NAME: ETH DEX"
echo "VITE_APP_VERSION: 1.0.0"
echo ""

print_header "📝 HOW TO ADD TO VERCEL"

echo "1. Go to your Vercel dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add each variable above"
echo "5. Redeploy your project"
echo ""

print_warning "Important Notes:"
echo "- Make sure to add ALL variables listed above"
echo "- The VITE_TRADING_PAIRS should be a single line JSON string"
echo "- After adding variables, redeploy your project"
echo "- If you have real token addresses, update them in the variables"

print_success "🎉 Environment variables ready for Vercel!"
print_status "Copy the variables above and add them to your Vercel project settings." 