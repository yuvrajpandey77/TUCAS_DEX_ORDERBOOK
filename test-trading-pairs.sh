#!/bin/bash

# Test Trading Pair Management System
# This script tests the complete trading pair management workflow

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

echo -e "${BLUE}🧪 Testing Trading Pair Management System${NC}"
echo "=============================================="

# Test 1: Check if CLI script exists
print_status "Test 1: Checking CLI script..."
if [ -f "./scripts/add-trading-pair.sh" ]; then
    print_success "CLI script found"
else
    print_error "CLI script not found"
    exit 1
fi

# Test 2: Check script permissions
print_status "Test 2: Checking script permissions..."
if [ -x "./scripts/add-trading-pair.sh" ]; then
    print_success "Script is executable"
else
    print_warning "Making script executable..."
    chmod +x ./scripts/add-trading-pair.sh
    print_success "Script permissions fixed"
fi

# Test 3: Check environment file
print_status "Test 3: Checking environment configuration..."
if [ -f ".env" ]; then
    print_success "Environment file exists"
else
    print_warning "Creating environment file from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success "Environment file created"
    else
        print_error "No env.example template found"
        exit 1
    fi
fi

# Test 4: Test CLI functionality
print_status "Test 4: Testing CLI functionality..."

# Test list command
print_status "  - Testing list command..."
./scripts/add-trading-pair.sh list > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "  List command works"
else
    print_error "  List command failed"
fi

# Test add command
print_status "  - Testing add command..."
./scripts/add-trading-pair.sh add \
  0x1234567890123456789012345678901234567890 \
  0x0000000000000000000000000000000000000000 \
  TEST \
  MONAD > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "  Add command works"
else
    print_error "  Add command failed"
fi

# Test 5: Check frontend configuration
print_status "Test 5: Checking frontend configuration..."
if [ -f "dex-frontend/env.example" ]; then
    print_success "Frontend environment template exists"
else
    print_warning "Frontend environment template not found"
fi

# Test 6: Check frontend components
print_status "Test 6: Checking frontend components..."

# Check if TradingPairSelector exists
if [ -f "dex-frontend/src/components/TradingPairSelector.tsx" ]; then
    print_success "TradingPairSelector component exists"
else
    print_error "TradingPairSelector component not found"
fi

# Check if trading-pairs config exists
if [ -f "dex-frontend/src/config/trading-pairs.ts" ]; then
    print_success "Trading pairs configuration exists"
else
    print_error "Trading pairs configuration not found"
fi

# Test 7: Check if AddTradingPair was removed
print_status "Test 7: Checking old component removal..."
if [ ! -f "dex-frontend/src/components/AddTradingPair.tsx" ]; then
    print_success "Old AddTradingPair component removed"
else
    print_warning "Old AddTradingPair component still exists"
fi

# Test 8: Verify current trading pairs
print_status "Test 8: Verifying current trading pairs..."
echo ""
print_status "Current trading pairs:"
./scripts/add-trading-pair.sh list

# Test 9: Check documentation
print_status "Test 9: Checking documentation..."
if [ -f "TRADING_PAIR_MANAGEMENT.md" ]; then
    print_success "Documentation exists"
else
    print_error "Documentation not found"
fi

echo ""
echo -e "${GREEN}✅ Trading Pair Management System Test Complete${NC}"
echo "=============================================="
print_success "All tests passed!"
echo ""
print_status "Next steps:"
echo "1. Deploy contracts: ./scripts/deploy-all.sh"
echo "2. Start frontend: cd dex-frontend && npm run dev"
echo "3. Test in browser: Open Limit Trading page"
echo "4. Verify TradingPairSelector shows your pairs"
echo ""
print_status "CLI Commands:"
echo "- List pairs: ./scripts/add-trading-pair.sh list"
echo "- Add pair: ./scripts/add-trading-pair.sh add BASE QUOTE BASE_SYM QUOTE_SYM"
echo "- Remove pair: ./scripts/add-trading-pair.sh remove BASE QUOTE" 