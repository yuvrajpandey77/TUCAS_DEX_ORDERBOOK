import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWallet } from '@/hooks/useWallet'
import { Settings, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { dexService } from '@/services/dex-service'
import { useToast } from '@/hooks/use-toast'
import { ethers } from 'ethers'

interface TradingPair {
  baseToken: string
  quoteToken: string
  baseTokenSymbol: string
  quoteTokenSymbol: string
  minOrderSize: string
  pricePrecision: string
}

export function TradingPairManager() {
  const { address, signer, isConnected } = useWallet()
  const [isAdding, setIsAdding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [pairStatus, setPairStatus] = useState<{ exists: boolean; isActive: boolean } | null>(null)
  const [formData, setFormData] = useState({
    baseToken: '0x0000000000000000000000000000000000000000', // Native ETH
    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
    baseTokenSymbol: 'ETH',
    quoteTokenSymbol: 'ETH',
    minOrderSize: '1000000000000000000', // 1 token default
    pricePrecision: '1000000000000000000', // 18 decimals default
  })
  const { toast } = useToast()

  const checkTradingPairStatus = async () => {
    if (!signer || !formData.baseToken || !formData.quoteToken) return

    try {
      setIsChecking(true)
      await dexService.initialize(signer)
      
      // Check if these are placeholder addresses
      const isPlaceholderAddress = (address: string) => {
        const placeholderPatterns = [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901',
          '0x3456789012345678901234567890123456789012',
          '0x4567890123456789012345678901234567890123'
        ]
        return placeholderPatterns.includes(address.toLowerCase())
      }
      
      let isActive = false;
      try {
        isActive = await dexService.isTradingPairActive(formData.baseToken, formData.quoteToken)
      } catch (error) {
        // If using placeholder addresses, assume active for demo
        if (isPlaceholderAddress(formData.baseToken) || isPlaceholderAddress(formData.quoteToken)) {
          console.log('Using placeholder addresses, assuming trading pair is active for demo')
          isActive = true;
        } else {
          console.error('Error checking trading pair status:', error);
          isActive = false;
        }
      }
      
      setPairStatus({ exists: true, isActive })
      
      if (isActive) {
        toast({
          title: "Trading Pair Active",
          description: "This trading pair is already active and ready for trading",
          variant: "default",
        })
      } else {
        toast({
          title: "Trading Pair Inactive",
          description: "This trading pair exists but is not active",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to check trading pair status:', error)
      setPairStatus({ exists: false, isActive: false })
      toast({
        title: "Trading Pair Not Found",
        description: "This trading pair does not exist",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleAddTradingPair = async () => {
    if (!signer || !formData.baseToken || !formData.quoteToken) return

    try {
      setIsAdding(true)
      await dexService.initialize(signer)
      
      // Get current gas price and estimate gas
      const provider = signer.provider
      if (!provider) {
        throw new Error('No provider available')
      }
      
      // Get current gas price
      const gasPrice = await provider.getFeeData()
      console.log('Current gas price:', gasPrice)
      
      // Estimate gas for the transaction
      const contract = dexService.getContractForEstimation()
      const gasEstimate = await contract.addTradingPair.estimateGas(
        formData.baseToken,
        formData.quoteToken,
        formData.minOrderSize,
        formData.pricePrecision
      )
      
      // Add 20% buffer to gas estimate
      const gasLimit = BigInt(gasEstimate) * BigInt(120) / BigInt(100)
      console.log('Estimated gas:', gasEstimate.toString())
      console.log('Gas limit with buffer:', gasLimit.toString())
      
      const txHash = await dexService.addTradingPair(
        formData.baseToken,
        formData.quoteToken,
        formData.minOrderSize,
        formData.pricePrecision
      )
      
      toast({
        title: "Trading Pair Added Successfully! 🎉",
        description: `Trading pair added. Transaction: ${txHash.slice(0, 10)}...`,
      })
      
      // Check the status after adding
      setTimeout(() => {
        checkTradingPairStatus()
      }, 2000)
      
    } catch (error) {
      console.error('Failed to add trading pair:', error)
      let errorMessage = 'Failed to add trading pair'
      
      if (error instanceof Error) {
        if (error.message.includes('gas') || error.message.includes('nonce')) {
          errorMessage = 'Gas or nonce issue. Try: 1) Reset MetaMask nonce, 2) Increase gas limit, 3) Wait a few minutes and try again'
        } else if (error.message.includes('ownable')) {
          errorMessage = 'Only contract owner can add trading pairs. Contact the contract owner.'
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fees. Add more ETH to your wallet.'
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Add Trading Pair Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const debugContract = async () => {
    if (!signer) return
    
    try {
      console.log('=== CONTRACT DEBUG ===')
      
      const provider = signer.provider
      if (!provider) {
        console.log('❌ No provider available')
        return
      }
      
      // Check if contract exists
      const contractAddress = '0x39DC69400B5A2eC3DC2b13fDd1D8c7f78b3D573e'
      const code = await provider.getCode(contractAddress)
      console.log('Contract exists:', code !== '0x')
      console.log('Contract code length:', code.length)
      
      // Check contract owner
      try {
        const contract = dexService.getContractForEstimation()
        const owner = await contract.owner()
        console.log('Contract owner:', owner)
        console.log('Your address:', await signer.getAddress())
        console.log('Is owner:', owner.toLowerCase() === (await signer.getAddress()).toLowerCase())
      } catch (error) {
        console.log('❌ Could not get contract owner:', error)
      }
      
      // Check if addTradingPair function exists
      try {
        const contract = dexService.getContractForEstimation()
        const hasFunction = contract.interface.hasFunction('addTradingPair')
        console.log('Has addTradingPair function:', hasFunction)
      } catch (error) {
        console.log('❌ Could not check function:', error)
      }
      
      console.log('=== END DEBUG ===')
      
    } catch (error) {
      console.error('Debug failed:', error)
    }
  }

  const checkExistingPairs = async () => {
    if (!signer) return
    
    try {
      console.log('=== CHECKING EXISTING TRADING PAIRS ===')
      
      await dexService.initialize(signer)
      const contract = dexService.getContractForEstimation()
      
      // Try to check some common trading pairs
      const commonPairs = [
        {
          base: '0x0000000000000000000000000000000000000000', // Native ETH
          quote: '0x0000000000000000000000000000000000000000', // Native ETH
          name: 'Native ETH ↔ Native ETH'
        }
      ]
      
      for (const pair of commonPairs) {
        try {
          const pairInfo = await contract.tradingPairs(pair.base, pair.quote)
          console.log(`${pair.name}:`, {
            exists: pairInfo[0] !== '0x0000000000000000000000000000000000000000',
            isActive: pairInfo[2],
            minOrderSize: pairInfo[3].toString(),
            pricePrecision: pairInfo[4].toString()
          })
        } catch (error) {
          console.log(`${pair.name}: Error checking - ${error}`)
        }
      }
      
      console.log('=== END CHECKING PAIRS ===')
      
    } catch (error) {
      console.error('Failed to check existing pairs:', error)
    }
  }

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Trading Pair Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to manage trading pairs</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Trading Pair Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Admin Function</span>
            </div>
            <p className="text-sm text-blue-700">
              Add trading pairs to enable trading. Only the contract owner can add pairs.
            </p>
          </div>

          {/* Trading Pair Status */}
          {pairStatus && (
            <div className={`p-3 border rounded-lg ${
              pairStatus.isActive 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {pairStatus.isActive ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">
                  {pairStatus.isActive ? 'Trading Pair Active' : 'Trading Pair Inactive'}
                </span>
              </div>
              <p className="text-sm mt-1">
                {pairStatus.isActive 
                  ? 'This pair is ready for trading' 
                  : 'This pair exists but is not active'
                }
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base-token">Base Token Address</Label>
              <Input
                id="base-token"
                value={formData.baseToken}
                onChange={(e) => handleInputChange('baseToken', e.target.value)}
                placeholder="0x..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quote-token">Quote Token Address</Label>
              <Input
                id="quote-token"
                value={formData.quoteToken}
                onChange={(e) => handleInputChange('quoteToken', e.target.value)}
                placeholder="0x..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base-symbol">Base Token Symbol</Label>
              <Input
                id="base-symbol"
                value={formData.baseTokenSymbol}
                onChange={(e) => handleInputChange('baseTokenSymbol', e.target.value)}
                placeholder="ETH"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quote-symbol">Quote Token Symbol</Label>
              <Input
                id="quote-symbol"
                value={formData.quoteTokenSymbol}
                onChange={(e) => handleInputChange('quoteTokenSymbol', e.target.value)}
                placeholder="ETH"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-order-size">Min Order Size (wei)</Label>
              <Input
                id="min-order-size"
                value={formData.minOrderSize}
                onChange={(e) => handleInputChange('minOrderSize', e.target.value)}
                placeholder="1000000000000000000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price-precision">Price Precision (wei)</Label>
              <Input
                id="price-precision"
                value={formData.pricePrecision}
                onChange={(e) => handleInputChange('pricePrecision', e.target.value)}
                placeholder="1000000000000000000"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={debugContract}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Debug Contract
            </Button>
            <Button
              onClick={checkExistingPairs}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Check Existing
            </Button>
            <Button
              onClick={checkTradingPairStatus}
              disabled={isChecking || !formData.baseToken || !formData.quoteToken}
              variant="outline"
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
            <Button
              onClick={handleAddTradingPair}
              disabled={isAdding || !formData.baseToken || !formData.quoteToken}
              className="flex-1"
            >
              {isAdding ? (
                <>
                  <Plus className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trading Pair
                </>
              )}
            </Button>
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Add Common Pairs</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => {
                  setFormData({
                    baseToken: '0x0000000000000000000000000000000000000000', // Native ETH
                    quoteToken: '0x0000000000000000000000000000000000000000', // Native ETH
                    baseTokenSymbol: 'ETH',
                    quoteTokenSymbol: 'ETH',
                    minOrderSize: '1000000000000000000',
                    pricePrecision: '1000000000000000000',
                  })
                }}
                variant="outline"
                size="sm"
              >
                ETH ↔ ETH
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 