import { uniswapV3Service } from '@/services/uniswap-v3-service';
import { UNISWAP_V3_CONFIG } from '@/config/uniswap-v3';

async function main() {
  try {
    console.log('Network info:', await uniswapV3Service.getNetworkInfo());

    const ethToUsdc = await uniswapV3Service.getSwapQuote({
      tokenIn: '0x0000000000000000000000000000000000000000',
      tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
      amountIn: '0.01',
      slippageTolerance: 50,
    });
    console.log('ETH -> USDC quote:', ethToUsdc);

    const wethToUsdc = await uniswapV3Service.getSwapQuote({
      tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS,
      tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
      amountIn: '0.01',
      slippageTolerance: 50,
    });
    console.log('WETH -> USDC quote:', wethToUsdc);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exitCode = 1;
  }
}

main();


