import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { dexService } from '@/services/dex-service';
import { ethers } from 'ethers';
import { Wallet, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import WalletConnectionStatus from '@/components/WalletConnectionStatus';

const WalletTest = () => {
  const { 
    isConnected, 
    address, 
    provider, 
    signer, 
    connectWallet, 
    disconnectWallet,
    isLoading,
    error 
  } = useWallet();
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    const results: any = {};

    try {
      // Test 1: Check if MetaMask is available
      results.metaMask = {
        available: !!window.ethereum,
        isMetaMask: window.ethereum?.isMetaMask || false,
      };

      // Test 2: Check network if connected
      if (provider && isConnected) {
        try {
          const network = await provider.getNetwork();
          results.network = {
            chainId: network.chainId.toString(),
            name: network.name,
            isMonad: network.chainId.toString() === '10143' || network.chainId.toString() === '0x279f',
          };
        } catch (error) {
          results.network = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Test 3: Check account balance if connected
      if (address && provider && isConnected) {
        try {
          const balance = await provider.getBalance(address);
          results.balance = {
            wei: balance.toString(),
            eth: ethers.formatEther(balance),
          };
        } catch (error) {
          results.balance = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Test 4: Check contract deployment
      if (signer && isConnected) {
        try {
          const isDeployed = await dexService.isContractDeployed();
          results.contract = {
            deployed: isDeployed,
            address: dexService.contractAddress,
          };
        } catch (error) {
          results.contract = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Test 5: Try to sign a message
      if (signer && isConnected) {
        try {
          const message = 'Test message from Tucas DEX';
          const signature = await signer.signMessage(message);
          results.signature = {
            success: true,
            signature: signature.slice(0, 20) + '...',
          };
        } catch (error) {
          results.signature = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

    } catch (error) {
      results.general = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const getTestIcon = (test: any) => {
    if (test.error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (test.success !== undefined) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (test.available !== undefined) return test.available ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
    if (test.deployed !== undefined) return test.deployed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet Connection Test</h1>
          <p className="text-muted-foreground">Debug your wallet connection and network status</p>
        </div>

        {/* Auto-reconnection Status */}
        <div className="flex justify-center">
          <WalletConnectionStatus />
        </div>

        {/* Connection Status */}
        <Card className="card-glass border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wallet Connected:</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>

            {isConnected && address && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account:</span>
                <span className="text-sm font-mono text-muted-foreground">{address}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}

            <div className="flex space-x-2">
              {!isConnected ? (
                <Button 
                  onClick={connectWallet} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="outline" className="flex-1">
                  Disconnect Wallet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="card-glass border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Test Results</span>
              </CardTitle>
              <Button
                onClick={runTests}
                disabled={isTesting}
                size="sm"
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(testResults).length > 0 ? (
              <div className="space-y-4">
                {/* MetaMask Test */}
                {testResults.metaMask && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(testResults.metaMask)}
                      <span className="text-sm font-medium">MetaMask</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Available: {testResults.metaMask.available ? 'Yes' : 'No'}
                      </p>
                      {testResults.metaMask.isMetaMask && (
                        <p className="text-xs text-muted-foreground">
                          Is MetaMask: Yes
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Network Test */}
                {testResults.network && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(testResults.network)}
                      <span className="text-sm font-medium">Network</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {testResults.network.error ? (
                        <p className="text-xs text-red-600">{testResults.network.error}</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Chain ID: {testResults.network.chainId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Name: {testResults.network.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Is Monad: {testResults.network.isMonad ? 'Yes' : 'No'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Balance Test */}
                {testResults.balance && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(testResults.balance)}
                      <span className="text-sm font-medium">Balance</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {testResults.balance.error ? (
                        <p className="text-xs text-red-600">{testResults.balance.error}</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            ETH: {testResults.balance.eth}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Wei: {testResults.balance.wei}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Contract Test */}
                {testResults.contract && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(testResults.contract)}
                      <span className="text-sm font-medium">DEX Contract</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {testResults.contract.error ? (
                        <p className="text-xs text-red-600">{testResults.contract.error}</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Deployed: {testResults.contract.deployed ? 'Yes' : 'No'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Address: {testResults.contract.address}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature Test */}
                {testResults.signature && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(testResults.signature)}
                      <span className="text-sm font-medium">Message Signing</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {testResults.signature.error ? (
                        <p className="text-xs text-red-600">{testResults.signature.error}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Signature: {testResults.signature.signature}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click "Run Tests" to check your wallet connection and network status
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="card-glass border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Troubleshooting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">If MetaMask is not available:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Install MetaMask extension from metamask.io</li>
                <li>• Refresh the page after installation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">If on wrong network:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Add Monad testnet to MetaMask manually</li>
                <li>• Chain ID: 10143 (0x279f)</li>
                <li>• RPC URL: https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">If contract is not deployed:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Deploy the DEX contract to Monad testnet</li>
                <li>• Update the contract address in the configuration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletTest; 