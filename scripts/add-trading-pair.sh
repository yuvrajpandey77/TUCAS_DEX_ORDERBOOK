#!/bin/bash

# Monad DEX Trading Pair Management Script
# This script adds new trading pairs to the environment configuration

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

# Function to add a new trading pair
add_trading_pair() {
    local base_token=$1
    local quote_token=$2
    local base_symbol=$3
    local quote_symbol=$4
    local min_order_size=${5:-"1000000000000000000"}
    local price_precision=${6:-"1000000000000000000"}
    
    print_status "Adding trading pair: $base_symbol/$quote_symbol"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Created .env from template"
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
    
    # Read current trading pairs
    if grep -q '^TRADING_PAIRS=' .env; then
        current_pairs=$(grep '^TRADING_PAIRS=' .env | cut -d'=' -f2-)
    else
        current_pairs="''"
    fi
    
    # Create new pair JSON
    new_pair="{\"baseToken\":\"$base_token\",\"quoteToken\":\"$quote_token\",\"baseTokenSymbol\":\"$base_symbol\",\"quoteTokenSymbol\":\"$quote_symbol\",\"isActive\":true,\"minOrderSize\":\"$min_order_size\",\"pricePrecision\":\"$price_precision\"}"
    
    # Add to existing pairs
    if [ "$current_pairs" = "''" ] || [ -z "$current_pairs" ]; then
        new_pairs="[$new_pair]"
    else
        # Remove closing bracket and add new pair
        new_pairs=$(echo "$current_pairs" | sed 's/\]$//')
        new_pairs="$new_pairs,$new_pair]"
    fi
    
    # Update .env file
    if grep -q '^TRADING_PAIRS=' .env; then
        sed -i "s/^TRADING_PAIRS=.*/TRADING_PAIRS='$new_pairs'/" .env
    else
        echo "TRADING_PAIRS='$new_pairs'" >> .env
    fi
    
    print_success "Trading pair $base_symbol/$quote_symbol added successfully!"
    print_status "Updated .env file with new trading pair"
    
    # Show current trading pairs
    print_status "Current trading pairs:"
    echo "$new_pairs" | jq '.' 2>/dev/null || echo "$new_pairs"
}

# Function to list current trading pairs
list_trading_pairs() {
    if [ ! -f .env ]; then
        print_error ".env file not found"
        exit 1
    fi
    
    if grep -q '^TRADING_PAIRS=' .env; then
        pairs=$(grep '^TRADING_PAIRS=' .env | cut -d'=' -f2-)
        if [ "$pairs" != "''" ] && [ -n "$pairs" ]; then
            print_status "Current trading pairs:"
            echo "$pairs" | jq '.' 2>/dev/null || echo "$pairs"
        else
            print_warning "No trading pairs configured"
        fi
    else
        print_warning "TRADING_PAIRS not found in .env"
    fi
}

# Function to remove a trading pair
remove_trading_pair() {
    local base_token=$1
    local quote_token=$2
    
    print_status "Removing trading pair with base: $base_token, quote: $quote_token"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        exit 1
    fi
    
    if grep -q '^TRADING_PAIRS=' .env; then
        current_pairs=$(grep '^TRADING_PAIRS=' .env | cut -d'=' -f2-)
        
        if [ "$current_pairs" != "''" ] && [ -n "$current_pairs" ]; then
            # Use jq to remove the pair
            new_pairs=$(echo "$current_pairs" | jq "map(select(.baseToken != \"$base_token\" or .quoteToken != \"$quote_token\"))" 2>/dev/null)
            
            if [ "$new_pairs" = "[]" ]; then
                new_pairs="''"
            fi
            
            # Update .env file
            sed -i "s/^TRADING_PAIRS=.*/TRADING_PAIRS='$new_pairs'/" .env
            
            print_success "Trading pair removed successfully!"
        else
            print_warning "No trading pairs to remove"
        fi
    else
        print_warning "TRADING_PAIRS not found in .env"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  add BASE_TOKEN QUOTE_TOKEN BASE_SYMBOL QUOTE_SYMBOL [MIN_ORDER_SIZE] [PRICE_PRECISION]"
    echo "    Add a new trading pair"
    echo ""
    echo "  list"
    echo "    List current trading pairs"
    echo ""
    echo "  remove BASE_TOKEN QUOTE_TOKEN"
    echo "    Remove a trading pair"
    echo ""
    echo "Examples:"
    echo "  $0 add 0x14F49BedD983423198d5402334dbccD9c45AC767 0x0000000000000000000000000000000000000000 MONAD MONAD"
    echo "  $0 list"
    echo "  $0 remove 0x14F49BedD983423198d5402334dbccD9c45AC767 0x0000000000000000000000000000000000000000"
}

# Main script logic
case "${1:-}" in
    "add")
        if [ $# -lt 5 ]; then
            print_error "Usage: $0 add BASE_TOKEN QUOTE_TOKEN BASE_SYMBOL QUOTE_SYMBOL [MIN_ORDER_SIZE] [PRICE_PRECISION]"
            exit 1
        fi
        add_trading_pair "$2" "$3" "$4" "$5" "${6:-}" "${7:-}"
        ;;
    "list")
        list_trading_pairs
        ;;
    "remove")
        if [ $# -lt 3 ]; then
            print_error "Usage: $0 remove BASE_TOKEN QUOTE_TOKEN"
            exit 1
        fi
        remove_trading_pair "$2" "$3"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac 