// Test script to check if WETH/USDC pool exists on Ethereum mainnet
import { ethers } from 'ethers';

// Mainnet RPC URL
const RPC_URL = 'https://ethereum.publicnode.com';

// Contract addresses
const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // Uniswap V3 Factory
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // QuoterV2

// Factory ABI (just the getPool function)
const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

// Quoter ABI
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)'
];

async function checkPoolExistence() {
  try {
    console.log('🔍 Checking WETH/USDC pool existence on Ethereum mainnet...\n');
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to Ethereum mainnet');
    
    // Create factory contract
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    // Check pool for different fee tiers
    const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    
    for (const fee of feeTiers) {
      try {
        console.log(`\n📊 Checking fee tier ${fee} (${fee/10000}%)...`);
        
        // Get pool address
        const poolAddress = await factory.getPool(WETH_ADDRESS, USDC_ADDRESS, fee);
        
        if (poolAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`❌ Pool does not exist for fee tier ${fee}`);
        } else {
          console.log(`✅ Pool exists! Address: ${poolAddress}`);
          
          // Try to get a quote to verify pool has liquidity
          try {
            const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
            const amountIn = ethers.parseEther('1'); // 1 ETH
            
            const quote = await quoter.quoteExactInputSingle.staticCall(
              WETH_ADDRESS,
              USDC_ADDRESS,
              fee,
              amountIn,
              0
            );
            
            const amountOut = ethers.formatUnits(quote, 6); // USDC has 6 decimals
            console.log(`💰 Quote: 1 ETH = ${amountOut} USDC`);
            console.log(`✅ Pool has liquidity!`);
            
            return {
              exists: true,
              poolAddress,
              fee,
              quote: amountOut
            };
          } catch (quoteError) {
            console.log(`⚠️ Pool exists but quote failed: ${quoteError.message}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error checking fee tier ${fee}: ${error.message}`);
      }
    }
    
    console.log('\n❌ No WETH/USDC pools found with liquidity');
    return { exists: false };
    
  } catch (error) {
    console.error('❌ Error checking pool existence:', error);
    return { exists: false, error: error.message };
  }
}

// Run the check
checkPoolExistence().then(result => {
  console.log('\n📋 Final Result:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
