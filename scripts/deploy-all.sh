#!/bin/bash

# Monad DEX Complete Deployment Script
# This script deploys the entire DEX system: tokens + DEX contract

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

echo -e "${BLUE}🚀 Monad DEX Complete Deployment${NC}"
echo "======================================"

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v cargo &> /dev/null; then
        print_error "Rust not found. Install: https://rustup.rs/"
        exit 1
    fi
    
    if ! command -v forge &> /dev/null; then
        print_error "Foundry not found. Install: https://getfoundry.sh/"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq not found. Install: sudo apt install jq"
        exit 1
    fi
    
    print_success "All dependencies installed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Created .env from template. Please edit with your private key."
            exit 1
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
    
    source .env
    
    if [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
        print_error "Please update PRIVATE_KEY in .env file"
        exit 1
    fi
    
    print_success "Environment ready"
}

# Build everything
build_all() {
    print_status "Building project..."
    
    cargo clean
    cargo build --release
    forge build
    
    print_success "Build complete"
}

# Deploy everything
deploy_all() {
    print_status "Deploying contracts..."
    
    RPC_URL=${RPC_URL:-"https://rpc.testnet.monad.xyz"}
    GAS_PRICE=${GAS_PRICE:-"20000000000"}
    
    # Deploy Token A
    print_status "Deploying Token A..."
    TOKEN_A_ADDRESS=$(forge create \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --gas-price $GAS_PRICE \
        contracts/MonadToken.sol:MonadToken \
        --json | jq -r '.deployedTo')
    
    print_success "Token A deployed: $TOKEN_A_ADDRESS"
    
    # Deploy Token B
    print_status "Deploying Token B..."
    TOKEN_B_ADDRESS=$(forge create \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --gas-price $GAS_PRICE \
        contracts/MonadToken.sol:MonadToken \
        --json | jq -r '.deployedTo')
    
    print_success "Token B deployed: $TOKEN_B_ADDRESS"
    
    # Deploy DEX
    print_status "Deploying DEX contract..."
    DEX_ADDRESS=$(forge create \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --gas-price $GAS_PRICE \
        contracts/OrderBookDEX.sol:OrderBookDEX \
        --json | jq -r '.deployedTo')
    
    print_success "DEX deployed: $DEX_ADDRESS"
    
    # Add trading pair
    print_status "Adding trading pair..."
    cast send $DEX_ADDRESS \
        "addTradingPair(address,address,uint256,uint256)" \
        $TOKEN_A_ADDRESS \
        $TOKEN_B_ADDRESS \
        1000000000000000000 \
        1000000000000000000 \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --gas-price $GAS_PRICE
    
    print_success "Trading pair added"
    
    # Save addresses
    cat > .deployed-addresses << EOF
# Deployed Contract Addresses
TOKEN_A_ADDRESS=$TOKEN_A_ADDRESS
TOKEN_B_ADDRESS=$TOKEN_B_ADDRESS
DEX_ADDRESS=$DEX_ADDRESS
RPC_URL=$RPC_URL
EOF
    
    print_success "Addresses saved to .deployed-addresses"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    source .deployed-addresses
    
    # Test token contracts
    print_status "Testing token contracts..."
    cargo run --bin monad-interact info \
        --address $TOKEN_A_ADDRESS \
        --rpc-url $RPC_URL
    
    # Test DEX
    print_status "Testing DEX..."
    cargo run --bin monad-dex get-order-book \
        --address $DEX_ADDRESS \
        --base-token $TOKEN_A_ADDRESS \
        --quote-token $TOKEN_B_ADDRESS \
        --rpc-url $RPC_URL
    
    print_success "Deployment test complete"
}

# Main execution
main() {
    check_dependencies
    setup_environment
    build_all
    deploy_all
    test_deployment
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "📋 Next Steps:"
    echo "1. Update frontend with contract addresses from .deployed-addresses"
    echo "2. Test trading functionality"
    echo "3. Add liquidity to start trading"
    echo ""
    print_status "🔧 Quick Test Commands:"
    echo "# Place a buy order:"
    echo "cargo run --bin monad-dex place-limit-order \\"
    echo "  --address \$DEX_ADDRESS \\"
    echo "  --base-token \$TOKEN_A_ADDRESS \\"
    echo "  --quote-token \$TOKEN_B_ADDRESS \\"
    echo "  --amount 1000000000000000000 \\"
    echo "  --price 1000000000000000000 \\"
    echo "  --is-buy true \\"
    echo "  --private-key \$PRIVATE_KEY"
}

main "$@" 