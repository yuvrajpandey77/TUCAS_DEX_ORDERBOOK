#!/bin/bash

# Add Trading Pair Script for Monad DEX
# This script adds the MONAD/ETH trading pair to the DEX contract

# Contract addresses
DEX_CONTRACT="0x6045fe7667E22CE9ff8106429128DDdC90F6F9Ae"
MONAD_TOKEN="0x14F49BedD983423198d5402334dbccD9c45AC767"
ETH_TOKEN="0x0000000000000000000000000000000000000000"  # Native ETH

# Trading pair parameters
MIN_ORDER_SIZE="1000000000000000000"  # 1 MONAD token (18 decimals)
PRICE_PRECISION="1000000000000000000"  # 18 decimals

# Check if private key is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <PRIVATE_KEY>"
    echo "Example: $0 0x1234567890abcdef..."
    exit 1
fi

PRIVATE_KEY=$1

echo "🚀 Adding MONAD/ETH trading pair to DEX contract..."
echo "DEX Contract: $DEX_CONTRACT"
echo "MONAD Token: $MONAD_TOKEN"
echo "ETH Token: $ETH_TOKEN"
echo "Min Order Size: $MIN_ORDER_SIZE"
echo "Price Precision: $PRICE_PRECISION"
echo ""

# Run the Rust CLI command to add trading pair
cargo run --bin monad-dex add-trading-pair \
    --address "$DEX_CONTRACT" \
    --base-token "$MONAD_TOKEN" \
    --quote-token "$ETH_TOKEN" \
    --min-order-size "$MIN_ORDER_SIZE" \
    --price-precision "$PRICE_PRECISION" \
    --private-key "$PRIVATE_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Trading pair added successfully!"
    echo "You can now use the DEX frontend to trade MONAD/ETH"
else
    echo ""
    echo "❌ Failed to add trading pair"
    echo "Make sure you're using the contract owner's private key"
fi 