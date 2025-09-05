#!/bin/bash

# Test script for deployed contracts
echo "Testing deployed contracts..."

# Test token contract
echo "Testing MonadToken contract..."
curl -X POST https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [
      {
        "to": "0x14F49BedD983423198d5402334dbccD9c45AC767",
        "data": "0x18160ddd"
      },
      "latest"
    ],
    "id": 1
  }'

echo -e "\n\nTesting DEX contract..."
curl -X POST https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": [
      "0x6045fe7667E22CE9ff8106429128DDdC90F6F9Ae",
      "latest"
    ],
    "id": 1
  }' 