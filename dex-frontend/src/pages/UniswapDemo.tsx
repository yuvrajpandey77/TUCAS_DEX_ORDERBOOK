import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Zap, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useUniswapV3 } from '@/hooks/useUniswapV3';
import { TOKENS, UNISWAP_V3_CONFIG } from '@/config/uniswap-v3';

const UniswapDemo = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);

  const {
    isConnected,
    address,
    connectWallet,
    tokenBalances,
    isLoadingBalances,
    networkInfo,
    gasPrice
  } = useUniswapV3();

  const runTests = async () => {
    setIsRunning(true);
    const results: Record<string, any> = {};

    try {
      // Test 1: Network Connection
      results.network = {
        status: 'success',
        data: {
          chainId: UNISWAP_V3_CONFIG.CHAIN_ID,
          rpcUrl: UNISWAP_V3_CONFIG.RPC_URL,
          factoryAddress: UNISWAP_V3_CONFIG.FACTORY_ADDRESS,
          routerAddress: UNISWAP_V3_CONFIG.ROUTER_ADDRESS
        }
      };

      // Test 2: Token Configuration
      results.tokens = {
        status: 'success',
        data: {
          WETH: {
            address: TOKENS.WETH.address,
            symbol: TOKENS.WETH.symbol,
            decimals: TOKENS.WETH.decimals
          },
          USDC: {
            address: TOKENS.USDC.address,
            symbol: TOKENS.USDC.symbol,
            decimals: TOKENS.USDC.decimals
          }
        }
      };

      // Test 3: Wallet Connection
      if (isConnected && address) {
        results.wallet = {
          status: 'success',
          data: {
            address,
            isConnected: true
          }
        };
      } else {
        results.wallet = {
          status: 'warning',
          message: 'Wallet not connected. Click "Connect Wallet" to test.'
        };
      }

      // Test 4: Network Info
      if (networkInfo) {
        results.networkInfo = {
          status: 'success',
          data: networkInfo
        };
      } else {
        results.networkInfo = {
          status: 'warning',
          message: 'Network info not available'
        };
      }

      // Test 5: Gas Price
      if (gasPrice) {
        results.gasPrice = {
          status: 'success',
          data: {
            gasPrice: gasPrice,
            gasPriceGwei: (parseInt(gasPrice) / 1e9).toFixed(2) + ' Gwei'
          }
        };
      } else {
        results.gasPrice = {
          status: 'warning',
          message: 'Gas price not available'
        };
      }

      // Test 6: Token Balances (if wallet connected)
      if (isConnected && address) {
        if (Object.keys(tokenBalances).length > 0) {
          results.balances = {
            status: 'success',
            data: tokenBalances
          };
        } else {
          results.balances = {
            status: 'warning',
            message: 'Token balances not loaded yet'
          };
        }
      } else {
        results.balances = {
          status: 'info',
          message: 'Connect wallet to check token balances'
        };
      }

    } catch (error) {
      results.error = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Uniswap V3 Integration Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Test the Uniswap V3 integration on Ethereum Sepolia testnet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Button onClick={connectWallet} className="w-full">
                  Connect Wallet
                </Button>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              )}

              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>This will test:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Network configuration</li>
                  <li>Token addresses</li>
                  <li>Wallet connection</li>
                  <li>Network information</li>
                  <li>Gas price</li>
                  <li>Token balances</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Click "Run Integration Tests" to see results
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([key, result]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                        <Badge className={getStatusColor(result.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(result.status)}
                            {result.status}
                          </div>
                        </Badge>
                      </div>
                      
                      {result.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.message}
                        </p>
                      )}
                      
                      {result.data && (
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configuration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Network Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span className="font-mono">{UNISWAP_V3_CONFIG.CHAIN_ID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RPC URL:</span>
                    <span className="font-mono text-xs">{UNISWAP_V3_CONFIG.RPC_URL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Factory:</span>
                    <span className="font-mono text-xs">{UNISWAP_V3_CONFIG.FACTORY_ADDRESS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Router:</span>
                    <span className="font-mono text-xs">{UNISWAP_V3_CONFIG.ROUTER_ADDRESS}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Token Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WETH:</span>
                    <span className="font-mono text-xs">{TOKENS.WETH.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USDC:</span>
                    <span className="font-mono text-xs">{TOKENS.USDC.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Fee:</span>
                    <span className="font-mono">{UNISWAP_V3_CONFIG.DEFAULT_FEE_TIER / 10000}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Ready to Trade?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Go to the <a href="/swap" className="underline hover:no-underline">Swap page</a> to test real ETH/USDC trading with Uniswap V3 liquidity!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UniswapDemo;
