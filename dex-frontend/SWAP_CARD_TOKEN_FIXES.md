# Swap Card Token Fixes Summary

## Changes Made

### 1. UniswapSwapCard.tsx
- **Changed from WETH to ETH**: Updated the default sell token from Wrapped Ether (WETH) to native Ethereum (ETH)
- **Updated token address**: Changed from `TOKENS.WETH.address` to `'0x0000000000000000000000000000000000000000'` (native ETH)
- **Updated token info**: 
  - Symbol: `WETH` → `ETH`
  - Name: `Wrapped Ether` → `Ethereum`
  - Decimals: `TOKENS.WETH.decimals` → `18`
- **Fixed approval logic**: Updated the approval check to use native ETH address instead of WETH address

### 2. HybridSwapCard.tsx
- **Changed from WETH to ETH**: Updated the default sell token from Wrapped Ether (WETH) to native Ethereum (ETH)
- **Updated token address**: Changed from `TOKENS.WETH.address` to `'0x0000000000000000000000000000000000000000'` (native ETH)
- **Updated token info**:
  - Symbol: `WETH` → `ETH`
  - Name: `Wrapped Ether` → `Ethereum`
  - Decimals: `TOKENS.WETH.decimals` → `18`
  - Chain: `ethereum-sepolia` → `ethereum-mainnet`

### 3. TokenSelectorModal.tsx
- **Added decimals**: Added `decimals` property to both ETH and USDC tokens
- **Maintained existing tokens**: Kept only ETH and USDC as the available tokens
- **Preserved logos**: Kept the existing logos (⬟ for ETH, 🪙 for USDC)

## Token Configuration

### ETH (Ethereum)
- **Symbol**: ETH
- **Name**: Ethereum
- **Address**: `0x0000000000000000000000000000000000000000` (native ETH)
- **Logo**: ⬟
- **Decimals**: 18
- **Volume**: $2.1B

### USDC (USD Coin)
- **Symbol**: USDC
- **Name**: USD Coin
- **Address**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (official USDC on Ethereum Mainnet)
- **Logo**: 🪙
- **Decimals**: 6
- **Volume**: $1.2B

## Benefits

1. **Simplified Trading**: Users can now trade directly with native ETH instead of having to wrap it first
2. **Better UX**: Native ETH is more intuitive for users than WETH
3. **Consistent Interface**: Both swap cards now show the same two tokens (ETH and USDC)
4. **Proper Logos**: Clear visual representation with ⬟ for ETH and 🪙 for USDC
5. **Mainnet Ready**: All addresses and configurations are set for Ethereum Mainnet

## Build Status
- ✅ Build successful
- ✅ No linting errors
- ✅ All components updated consistently

The swap cards now only show ETH and USDC with their respective logos, providing a clean and focused trading interface.
