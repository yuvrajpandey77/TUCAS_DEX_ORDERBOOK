# Trading Pair Management System

## Overview

The trading pair management system allows you to configure trading pairs through environment variables and manage them via CLI commands. This approach provides:

- **Security**: Only authorized users can add trading pairs
- **Simplicity**: No complex UI needed for one-time operations
- **Persistence**: Trading pairs are stored in environment configuration
- **Clean UI**: No add trading pair UI cluttering the interface

## Architecture

### Environment-Based Configuration

Trading pairs are configured through environment variables:

```bash
# Backend (.env)
TRADING_PAIRS='[
  {
    "baseToken": "0x14F49BedD983423198d5402334dbccD9c45AC767",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "MONAD",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000",
    "pricePrecision": "1000000000000000000"
  }
]'

# Frontend (.env)
VITE_TRADING_PAIRS='[
  {
    "baseToken": "0x14F49BedD983423198d5402334dbccD9c45AC767",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "MONAD",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000",
    "pricePrecision": "1000000000000000000"
  }
]'
```

### Frontend Integration

The frontend automatically loads trading pairs from environment variables:

```typescript
// src/config/trading-pairs.ts
export const getTradingPairs = (): TradingPair[] => {
  const pairsJson = import.meta.env.VITE_TRADING_PAIRS
  return JSON.parse(pairsJson) as TradingPair[]
}
```

## CLI Management

### Adding Trading Pairs

```bash
# Basic usage
./scripts/add-trading-pair.sh add BASE_TOKEN QUOTE_TOKEN BASE_SYMBOL QUOTE_SYMBOL

# Example
./scripts/add-trading-pair.sh add \
  0x14F49BedD983423198d5402334dbccD9c45AC767 \
  0x0000000000000000000000000000000000000000 \
  MONAD \
  MONAD

# With custom parameters
./scripts/add-trading-pair.sh add \
  0x1234567890123456789012345678901234567890 \
  0x0000000000000000000000000000000000000000 \
  TEST \
  MONAD \
  500000000000000000 \
  1000000000000000000
```

### Listing Trading Pairs

```bash
./scripts/add-trading-pair.sh list
```

### Removing Trading Pairs

```bash
./scripts/add-trading-pair.sh remove BASE_TOKEN QUOTE_TOKEN

# Example
./scripts/add-trading-pair.sh remove \
  0x1234567890123456789012345678901234567890 \
  0x0000000000000000000000000000000000000000
```

## Frontend Components

### TradingPairSelector

Replaces the old `AddTradingPair` component with a clean selector:

```typescript
// src/components/TradingPairSelector.tsx
const TradingPairSelector = () => {
  const { selectedPair, setSelectedPair, tradingPairs } = useDEXStore();
  
  // Dropdown selector for trading pairs
  // Shows pair information
  // Provides CLI command help
}
```

### Features

- **Dropdown Selection**: Choose from available trading pairs
- **Pair Information**: Display token addresses and configuration
- **Status Indicators**: Show active/inactive status
- **CLI Help**: Display commands for adding new pairs
- **Validation**: Only show active pairs for trading

## Configuration Files

### Backend Environment

```bash
# rust-project/.env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe
CHAIN_ID=1337

# Contract Addresses
MONAD_TOKEN_ADDRESS=0x14F49BedD983423198d5402334dbccD9c45AC767
ORDERBOOK_DEX_ADDRESS=your_dex_address_here

# Trading Pairs Configuration
TRADING_PAIRS='[
  {
    "baseToken": "0x14F49BedD983423198d5402334dbccD9c45AC767",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "MONAD",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000",
    "pricePrecision": "1000000000000000000"
  }
]'

# Gas Settings
GAS_PRICE=20000000000
GAS_LIMIT=3000000
```

### Frontend Environment

```bash
# rust-project/dex-frontend/.env
VITE_TRADING_PAIRS='[
  {
    "baseToken": "0x14F49BedD983423198d5402334dbccD9c45AC767",
    "quoteToken": "0x0000000000000000000000000000000000000000",
    "baseTokenSymbol": "MONAD",
    "quoteTokenSymbol": "MONAD",
    "isActive": true,
    "minOrderSize": "1000000000000000000",
    "pricePrecision": "1000000000000000000"
  }
]'

VITE_NETWORK_NAME="Monad Testnet"
VITE_CHAIN_ID="1337"
VITE_RPC_URL="https://rpc.testnet.monad.xyz"
VITE_MONAD_TOKEN_ADDRESS="0x14F49BedD983423198d5402334dbccD9c45AC767"
VITE_ORDERBOOK_DEX_ADDRESS=""
```

## Workflow

### 1. Initial Setup

```bash
# Copy environment templates
cp env.example .env
cp dex-frontend/env.example dex-frontend/.env

# Edit with your configuration
nano .env
nano dex-frontend/.env
```

### 2. Add Trading Pairs

```bash
# Add the default MONAD/MONAD pair
./scripts/add-trading-pair.sh add \
  0x14F49BedD983423198d5402334dbccD9c45AC767 \
  0x0000000000000000000000000000000000000000 \
  MONAD \
  MONAD

# Add additional pairs as needed
./scripts/add-trading-pair.sh add \
  0x1234567890123456789012345678901234567890 \
  0x0000000000000000000000000000000000000000 \
  TEST \
  MONAD
```

### 3. Deploy and Test

```bash
# Deploy contracts
./scripts/deploy-all.sh

# Start frontend
cd dex-frontend
npm run dev
```

### 4. Verify in UI

- Open the Limit Trading page
- Check that `TradingPairSelector` shows your pairs
- Verify pair information is displayed correctly
- Test trading pair selection

## Benefits

### ✅ Advantages

1. **Security**: Only authorized users can add trading pairs
2. **Simplicity**: No complex UI for one-time operations
3. **Persistence**: Environment-based storage
4. **Clean UI**: No cluttered add trading pair interface
5. **Version Control**: Configuration in environment files
6. **Flexibility**: Easy to add/remove pairs per environment
7. **Immutable**: Pairs are fixed until next deployment

### 🔧 Technical Benefits

1. **No Database**: Simple environment variable storage
2. **CLI Management**: Easy command-line operations
3. **Frontend Integration**: Automatic loading from environment
4. **Validation**: Built-in pair validation and filtering
5. **Error Handling**: Graceful handling of missing configuration

## Troubleshooting

### Common Issues

1. **No Trading Pairs Showing**
   - Check `VITE_TRADING_PAIRS` environment variable
   - Verify JSON format is correct
   - Ensure pairs have `isActive: true`

2. **CLI Script Not Working**
   - Check script permissions: `chmod +x scripts/add-trading-pair.sh`
   - Verify `.env` file exists
   - Check JSON syntax in environment variables

3. **Frontend Not Loading Pairs**
   - Check browser console for errors
   - Verify `VITE_TRADING_PAIRS` is set
   - Ensure JSON is properly escaped

### Debug Commands

```bash
# Check current trading pairs
./scripts/add-trading-pair.sh list

# Verify environment variables
echo $TRADING_PAIRS

# Test JSON parsing
echo $TRADING_PAIRS | jq '.'

# Check frontend environment
cd dex-frontend
echo $VITE_TRADING_PAIRS
```

## Migration from Old System

### Before (Hardcoded Pairs)

```typescript
// Old approach - hardcoded in components
const mockTradingPairs = [
  {
    baseToken: '0x14F49BedD983423198d5402334dbccD9c45AC767',
    quoteToken: '0x0000000000000000000000000000000000000000',
    baseTokenSymbol: 'MONAD',
    quoteTokenSymbol: 'MONAD',
    isActive: true,
    minOrderSize: '1000000000000000000',
    pricePrecision: '1000000000000000000'
  }
];
```

### After (Environment-Based)

```typescript
// New approach - loaded from environment
import { getTradingPairs } from '@/config/trading-pairs';

const tradingPairs = getTradingPairs(); // Loaded from VITE_TRADING_PAIRS
```

### Migration Steps

1. **Remove Hardcoded Pairs**: Delete hardcoded arrays from components
2. **Add Environment Variables**: Set up `VITE_TRADING_PAIRS`
3. **Update Store**: Use environment-based loading
4. **Replace Components**: Use `TradingPairSelector` instead of `AddTradingPair`
5. **Test**: Verify pairs load correctly

## Future Enhancements

### Potential Improvements

1. **Database Storage**: Move to PostgreSQL for dynamic management
2. **Admin Panel**: Web-based trading pair management
3. **Validation**: Enhanced pair validation and testing
4. **Monitoring**: Track pair usage and performance
5. **Automation**: Auto-deployment of new pairs

### Considerations

- **Security**: Ensure only authorized users can modify pairs
- **Performance**: Optimize loading for large numbers of pairs
- **Validation**: Comprehensive pair validation
- **Backup**: Version control for pair configurations
- **Monitoring**: Track pair usage and errors

## Conclusion

The environment-based trading pair management system provides a clean, secure, and maintainable approach to managing trading pairs. It eliminates the need for complex UI components while providing powerful CLI tools for management. The system is production-ready and can be easily extended for future requirements. 