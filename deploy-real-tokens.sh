#!/bin/bash

# Deploy Real Tokens Script
# This script deploys real tokens using forge with explicit RPC

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

print_header "🪙 DEPLOYING REAL TOKENS"

# Create simple token contract
cat > contracts/SimpleToken.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply * 10**decimals_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
EOF

print_success "Token contract created"

# Deploy USDC
print_status "Deploying USDC token..."
USDC_ADDRESS=$(forge create contracts/SimpleToken.sol:SimpleToken \
    --constructor-args "USD Coin" "USDC" 6 1000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast | grep "Deployed to:" | awk '{print $3}')

if [ -z "$USDC_ADDRESS" ]; then
    print_error "Failed to deploy USDC"
    exit 1
fi

print_success "USDC deployed at: $USDC_ADDRESS"

# Deploy WETH
print_status "Deploying WETH token..."
WETH_ADDRESS=$(forge create contracts/SimpleToken.sol:SimpleToken \
    --constructor-args "Wrapped Ether" "WETH" 18 1000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast | grep "Deployed to:" | awk '{print $3}')

if [ -z "$WETH_ADDRESS" ]; then
    print_error "Failed to deploy WETH"
    exit 1
fi

print_success "WETH deployed at: $WETH_ADDRESS"

# Deploy DAI
print_status "Deploying DAI token..."
DAI_ADDRESS=$(forge create contracts/SimpleToken.sol:SimpleToken \
    --constructor-args "Dai Stablecoin" "DAI" 18 1000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast | grep "Deployed to:" | awk '{print $3}')

if [ -z "$DAI_ADDRESS" ]; then
    print_error "Failed to deploy DAI"
    exit 1
fi

print_success "DAI deployed at: $DAI_ADDRESS"

# Deploy WBTC
print_status "Deploying WBTC token..."
WBTC_ADDRESS=$(forge create contracts/SimpleToken.sol:SimpleToken \
    --constructor-args "Wrapped Bitcoin" "WBTC" 8 100 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast | grep "Deployed to:" | awk '{print $3}')

if [ -z "$WBTC_ADDRESS" ]; then
    print_error "Failed to deploy WBTC"
    exit 1
fi

print_success "WBTC deployed at: $WBTC_ADDRESS"

# Save real token addresses
cat > .test-tokens << EOF
# Test Token Addresses
USDC_ADDRESS=$USDC_ADDRESS
WETH_ADDRESS=$WETH_ADDRESS
DAI_ADDRESS=$DAI_ADDRESS
WBTC_ADDRESS=$WBTC_ADDRESS
EOF

print_success "Real token addresses saved to .test-tokens"

print_header "📊 TOKEN DEPLOYMENT SUMMARY"
echo "✅ USDC: $USDC_ADDRESS (6 decimals, 1M supply)"
echo "✅ WETH: $WETH_ADDRESS (18 decimals, 1K supply)"
echo "✅ DAI: $DAI_ADDRESS (18 decimals, 1M supply)"
echo "✅ WBTC: $WBTC_ADDRESS (8 decimals, 100 supply)"

print_success "🎉 Real tokens deployed successfully!"
print_status "Now run mint-tokens-to-wallet.sh to mint tokens to your wallet!" 