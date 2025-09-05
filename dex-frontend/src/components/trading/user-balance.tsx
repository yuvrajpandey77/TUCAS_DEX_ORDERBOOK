import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDEXStore } from '@/store/dex-store'
import { useWallet } from '@/hooks/useWallet'
import { formatTokenAmount } from '@/lib/utils'
import { Wallet, RefreshCw, AlertCircle, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dexService } from '@/services/dex-service'
import { tokenService } from '@/services/token-service'
import { ethers } from 'ethers'

export function UserBalance() {
  const { selectedPair } = useDEXStore()
  const { isConnected, address, signer, chainId, networkName } = useWallet()
  const [balances, setBalances] = useState<{ [key: string]: string }>({})
  const [nativeBalance, setNativeBalance] = useState<{ balance: string; symbol: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const fetchBalances = async () => {
    if (!address || !signer || !selectedPair || !isConnected) return

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching balances for:', {
        address,
        chainId,
        networkName,
        selectedPair
      })
      
      // Fetch native token balance
      try {
        const native = await tokenService.getBalance(address)
        console.log('Native balance fetched:', native)
        setNativeBalance({
          balance: native.balance,
          symbol: native.symbol
        })
      } catch (error) {
        console.error('Failed to fetch native balance:', error)
        setError('Failed to fetch native token balance')
      }
      
      // Fetch token balances if contract is available
      try {
        await dexService.initialize(signer)
        
        const baseBalance = await dexService.getUserBalance(address, selectedPair.baseToken)
        const quoteBalance = await dexService.getUserBalance(address, selectedPair.quoteToken)
        
        console.log('Token balances fetched:', {
          baseToken: selectedPair.baseToken,
          baseBalance,
          quoteToken: selectedPair.quoteToken,
          quoteBalance
        })
        
        setBalances({
          [selectedPair.baseToken]: baseBalance,
          [selectedPair.quoteToken]: quoteBalance,
        })
      } catch (error) {
        console.error('Failed to fetch token balances:', error)
        // Set default values if contract is not available
        setBalances({
          [selectedPair.baseToken]: '0',
          [selectedPair.quoteToken]: '0',
        })
        setError('Failed to fetch token balances - contract may not be deployed')
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      setError('Failed to fetch balances')
    } finally {
      setIsLoading(false)
    }
  }

  const runDebugTest = async () => {
    if (!address || !signer) return
    
    try {
      console.log('Running debug test...')
      
      // Test 1: Check if provider is available
      const provider = signer.provider
      console.log('Provider available:', !!provider)
      
      // Test 2: Check network
      if (provider) {
        const network = await provider.getNetwork()
        console.log('Network:', network)
      }
      
      // Test 3: Check native balance directly
      if (provider) {
        const nativeBalance = await provider.getBalance(address)
        console.log('Direct native balance:', nativeBalance.toString())
      }
      
      // Test 4: Check if MONAD token contract exists
      const nativeTokenAddress = '0x0000000000000000000000000000000000000000'
      if (provider) {
        const code = await provider.getCode(nativeTokenAddress)
        console.log('Native token contract exists:', code !== '0x')
      }
      
      // Test 5: Try to get native token balance directly
      try {
        const nativeBalance = await tokenService.getTokenBalance(nativeTokenAddress, address)
        console.log('Native token balance:', nativeBalance)
      } catch (error) {
        console.error('Failed to get native token balance:', error)
      }
      
      setDebugInfo({
        provider: !!provider,
        network: provider ? await provider.getNetwork() : null,
        nativeBalance: provider ? await provider.getBalance(address) : null,
        nativeTokenExists: provider ? await provider.getCode(nativeTokenAddress) !== '0x' : null,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Debug test failed:', error)
    }
  }

  useEffect(() => {
    if (address && signer && selectedPair && isConnected) {
      fetchBalances()
    }
  }, [address, signer, selectedPair, isConnected])

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            User Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to view balances</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            User Balance
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={runDebugTest}
              className="text-xs"
            >
              <Bug className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBalances}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {chainId && networkName && (
          <div className="text-xs text-muted-foreground">
            Network: {networkName} (Chain ID: {chainId})
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {debugInfo && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Debug Info:</strong></div>
              <div>Provider: {debugInfo.provider ? 'Available' : 'Not Available'}</div>
              <div>Network: {debugInfo.network?.name} (Chain ID: {debugInfo.network?.chainId})</div>
              <div>Native Balance: {debugInfo.nativeBalance ? ethers.formatEther(debugInfo.nativeBalance) : 'N/A'}</div>
              <div>Native Token Exists: {debugInfo.nativeTokenExists ? 'Yes' : 'No'}</div>
              <div>Timestamp: {debugInfo.timestamp}</div>
            </div>
          </div>
        )}
        
        {selectedPair ? (
          <div className="space-y-3">
            {/* Native Token Balance */}
            {nativeBalance && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{nativeBalance.symbol}</span>
                <span className="font-medium">
                  {formatTokenAmount(nativeBalance.balance)}
                </span>
              </div>
            )}
            
            {/* Trading Pair Balances */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedPair.baseTokenSymbol}</span>
              <span className="font-medium">
                {balances[selectedPair.baseToken] 
                  ? formatTokenAmount(balances[selectedPair.baseToken])
                  : '0.000000'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedPair.quoteTokenSymbol}</span>
              <span className="font-medium">
                {balances[selectedPair.quoteToken]
                  ? formatTokenAmount(balances[selectedPair.quoteToken])
                  : '0.000000'
                }
              </span>
            </div>
            
            {/* Debug Info */}
            <div className="mt-4 pt-3 border-t border-border/20">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>
                <div>Base Token: {selectedPair.baseToken}</div>
                <div>Quote Token: {selectedPair.quoteToken}</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Select a trading pair to view balances</p>
        )}
      </CardContent>
    </Card>
  )
} 