import { uniswapV3Service } from '@/services/uniswap-v3-service';
import { UNISWAP_V3_CONFIG, TOKENS } from '@/config/uniswap-v3';

async function main() {
  const pairs = [
    { name: 'ETH->USDC', in: TOKENS.ETH.address, out: UNISWAP_V3_CONFIG.USDC_ADDRESS, amount: '0.01' },
    { name: 'WETH->USDC', in: UNISWAP_V3_CONFIG.WETH_ADDRESS, out: UNISWAP_V3_CONFIG.USDC_ADDRESS, amount: '0.01' },
  ];

  for (const p of pairs) {
    try {
      console.log(`\n=== ${p.name} ===`);
      const quote = await uniswapV3Service.getSwapQuote({
        tokenIn: p.in,
        tokenOut: p.out,
        amountIn: p.amount,
        slippageTolerance: 50,
      });
      console.log('Quote:', quote);
    } catch (e) {
      console.error(`${p.name} failed:`, e);
    }
  }
}

main().catch((e) => {
  console.error('check-routes failed:', e);
  process.exit(1);
});


