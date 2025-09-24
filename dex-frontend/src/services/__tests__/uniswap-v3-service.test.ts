import { describe, it, expect } from 'vitest';
import { uniswapV3Service } from '@/services/uniswap-v3-service';
import { UNISWAP_V3_CONFIG, TOKENS } from '@/config/uniswap-v3';

describe('UniswapV3Service integration', () => {
  it('gets network info', async () => {
    const info = await uniswapV3Service.getNetworkInfo();
    expect(info === null || typeof info.blockNumber === 'number').toBeTruthy();
  }, 60000);

  it('gets quote ETH -> USDC', async () => {
    const quote = await uniswapV3Service.getSwapQuote({
      tokenIn: TOKENS.ETH.address,
      tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
      amountIn: '0.005',
      slippageTolerance: 50,
    });
    if (!quote) {
      console.warn('ETH->USDC quote was null; likely transient RPC issue');
    }
    expect(quote).not.toBeNull();
    if (quote) {
      expect(Number(quote.outputAmount)).toBeGreaterThan(0);
      expect(quote.route.length).toBeGreaterThanOrEqual(2);
      expect([100, 500, 3000, 10000]).toContain(quote.fee);
    }
  }, 120000);

  it('gets quote WETH -> USDC', async () => {
    const quote = await uniswapV3Service.getSwapQuote({
      tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS,
      tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
      amountIn: '0.005',
      slippageTolerance: 50,
    });
    if (!quote) {
      console.warn('WETH->USDC quote was null; likely transient RPC issue');
    }
    expect(quote).not.toBeNull();
    if (quote) {
      expect(Number(quote.outputAmount)).toBeGreaterThan(0);
      expect(quote.route[quote.route.length - 1]).toBe('USDC');
    }
  }, 120000);

  it('estimates gas without signer', async () => {
    const gas = await (uniswapV3Service as any).estimateSwapGas(
      UNISWAP_V3_CONFIG.WETH_ADDRESS,
      UNISWAP_V3_CONFIG.USDC_ADDRESS,
      '0.01',
      3000
    );
    expect(typeof gas === 'bigint').toBeTruthy();
    expect(gas > 0n).toBeTruthy();
  }, 60000);

  it('rejects executeSwap without signer', async () => {
    await expect(
      uniswapV3Service.executeSwap({
        tokenIn: UNISWAP_V3_CONFIG.WETH_ADDRESS,
        tokenOut: UNISWAP_V3_CONFIG.USDC_ADDRESS,
        amountIn: '0.001',
      })
    ).rejects.toThrow('No signer available');
  }, 20000);
});


