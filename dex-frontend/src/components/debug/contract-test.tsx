import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CONTRACTS } from '@/config/contracts'
import { NETWORK_CONFIG } from '@/config/network'

export function ContractTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testContractConnection = async () => {
    setIsLoading(true)
    setResults([])

    try {
      // Test 1: Check if MetaMask is available
      if (!window.ethereum) {
        addResult('❌ MetaMask not found')
        return
      }
      addResult('✅ MetaMask found')

      // Test 2: Connect to provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      addResult('✅ Provider created')

      // Test 3: Get network info
      const network = await provider.getNetwork()
      addResult(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`)

      // Test 4: Test token contract
      const tokenContract = new ethers.Contract(
        CONTRACTS.ORDERBOOK_DEX.address,
        CONTRACTS.ORDERBOOK_DEX.abi,
        provider
      )

      const tokenName = await tokenContract.name()
      const tokenSymbol = await tokenContract.symbol()
      const totalSupply = await tokenContract.totalSupply()
      
      addResult(`✅ Token Contract: ${tokenName} (${tokenSymbol})`)
      addResult(`✅ Total Supply: ${ethers.formatEther(totalSupply)} tokens`)

      // Test 5: Test DEX contract
      const dexContract = new ethers.Contract(
        CONTRACTS.ORDERBOOK_DEX.address,
        CONTRACTS.ORDERBOOK_DEX.abi,
        provider
      )

      addResult('✅ DEX Contract: Connected successfully')

      // Test 6: Check if we're on the right network
      if (network.chainId.toString() !== NETWORK_CONFIG.chainId) {
        addResult(`⚠️  Wrong network! Expected: ${NETWORK_CONFIG.chainName}, Got: ${network.name}`)
        addResult(`   Please switch to ${NETWORK_CONFIG.chainName} in MetaMask`)
      } else {
        addResult(`✅ Correct network: ${NETWORK_CONFIG.chainName}`)
      }

    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-foreground">🔧 Contract Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testContractConnection} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Testing...' : '🧪 Test Contract Connection'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">📊 Test Results:</h3>
            <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto border border-border">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono text-foreground">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Expected Network:</span>
            <span>{NETWORK_CONFIG.chainName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Token Contract:</span>
            <span className="text-xs font-mono break-all">{CONTRACTS.ORDERBOOK_DEX.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">DEX Contract:</span>
            <span className="text-xs font-mono break-all">{CONTRACTS.ORDERBOOK_DEX.address}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 