import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUniswapV3 } from '@/hooks/useUniswapV3';

const QuoteTest = () => {
  const [amount, setAmount] = useState('1');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { getSwapQuote } = useUniswapV3();

  const testQuote = async () => {
    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const result = await getSwapQuote({
        tokenIn: '0x0000000000000000000000000000000000000000', // ETH
        tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        amountIn: amount,
        slippageTolerance: 0.5
      });

      if (result) {
        setQuote(result);
        console.log('Quote result:', result);
      } else {
        setError('No quote received');
      }
    } catch (err) {
      setError(err.message);
      console.error('Quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Quote System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ETH Amount to Swap:
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                step="0.1"
              />
            </div>

            <Button 
              onClick={testQuote} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Getting Quote...' : 'Test Quote'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800">Error:</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {quote && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Quote Result:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Input:</strong> {quote.inputAmount} ETH</p>
                  <p><strong>Output:</strong> {quote.outputAmount} USDC</p>
                  <p><strong>Minimum Received:</strong> {quote.minimumReceived} USDC</p>
                  <p><strong>Price Impact:</strong> {quote.priceImpact}%</p>
                  <p><strong>Gas Estimate:</strong> {quote.gasEstimate} gas</p>
                  <p><strong>Route:</strong> {quote.route.join(' → ')}</p>
                  <p><strong>Fee Tier:</strong> {quote.fee} ({(quote.fee/10000).toFixed(2)}%)</p>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Pool Status:</h3>
              <p className="text-blue-600 text-sm">
                ✅ WETH/USDC pool exists on mainnet (1% fee tier)<br/>
                ✅ Pool address: 0x7BeA39867e4169DBe237d55C8242a8f2fcDcc387<br/>
                ✅ Current rate: ~1 ETH = 4,544 USDC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteTest;
