import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDEXStore } from '@/store/dex-store'
import { TrendingUp, TrendingDown, Shield, AlertCircle, RefreshCw } from 'lucide-react'
import { dexService } from '@/services/dex-service'
import { createTokenService } from '@/services/token-service'
import { walletService } from '@/services/wallet-service'
import { ethers } from 'ethers'
import { useToast } from '@/hooks/use-toast'

const orderSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  price: z.string().min(1, 'Price is required'),
})

type OrderFormData = z.infer<typeof orderSchema>

interface OrderFormProps {
  orderType: 'limit' | 'market'
  side: 'buy' | 'sell'
}

export function OrderForm({ orderType, side }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'needed'>('pending')
  const { selectedPair, setError, clearError } = useDEXStore()
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  })

  // Check token approval status
  const checkApproval = async (amount: string) => {
    const signer = walletService.getSigner()
    if (!selectedPair || !signer) return

    try {
      const tokenAddress = side === 'buy' ? selectedPair.quoteToken : selectedPair.baseToken
      const tokenService = createTokenService(tokenAddress)
      
      // Check if this is a native token
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Native token detected, skipping approval check')
        setApprovalStatus('approved')
        return
      }
      
      await tokenService.initialize(signer)

      const allowance = await tokenService.getAllowance(signer.address, dexService.contractAddress)
      const requiredAmount = ethers.parseEther(amount || '0')
      
      if (ethers.parseUnits(allowance, 18) >= requiredAmount) {
        setApprovalStatus('approved')
      } else {
        setApprovalStatus('needed')
      }
    } catch (error) {
      console.error('Failed to check approval:', error)
      setApprovalStatus('needed')
    }
  }

  // Approve tokens
  const handleApprove = async (amount: string) => {
    const signer = walletService.getSigner()
    if (!selectedPair || !signer) return

    try {
      setIsApproving(true)
      const tokenAddress = side === 'buy' ? selectedPair.quoteToken : selectedPair.baseToken
      
      // Check if this is a native token
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Native token detected, skipping approval')
        setApprovalStatus('approved')
        toast({
          title: "Native Token",
          description: "Native tokens don't require approval",
        })
        return
      }
      
      const tokenService = createTokenService(tokenAddress)
      await tokenService.initialize(signer)

      const requiredAmount = ethers.parseEther(amount || '0')
      const txHash = await tokenService.approve(dexService.contractAddress, requiredAmount.toString())

      toast({
        title: "Token Approval Successful! ✅",
        description: `Tokens approved for trading. Transaction: ${txHash.slice(0, 10)}...`,
      })

      setApprovalStatus('approved')
    } catch (error) {
      console.error('Token approval failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve tokens'
      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const onSubmit = async (data: OrderFormData) => {
    const signer = walletService.getSigner()
    if (!selectedPair || !signer) {
      setError('Please connect wallet and select a trading pair')
      return
    }

    // Check approval before placing order
    await checkApproval(data.amount)
    if (approvalStatus === 'needed') {
      setError('Please approve tokens before placing order')
      return
    }

    try {
      setIsSubmitting(true)
      clearError()

      // Initialize DEX service with signer
      await dexService.initialize(signer)

      // Convert amount and price to wei
      const amountWei = ethers.parseEther(data.amount)
      const priceWei = orderType === 'limit' ? ethers.parseEther(data.price) : ethers.parseEther('0')

      let txHash: string

      if (orderType === 'limit') {
        // Place limit order
        txHash = await dexService.placeLimitOrder(
          selectedPair.baseToken,
          selectedPair.quoteToken,
          amountWei.toString(),
          priceWei.toString(),
          side === 'buy'
        )
      } else {
        // Place market order
        txHash = await dexService.placeMarketOrder(
          selectedPair.baseToken,
          selectedPair.quoteToken,
          amountWei.toString(),
          side === 'buy'
        )
      }

      console.log('Order placed successfully:', {
        type: orderType,
        side,
        amount: data.amount,
        price: data.price,
        pair: selectedPair,
        txHash,
      })

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} ${side} order placed. Transaction: ${txHash.slice(0, 10)}...`,
      })

      reset()
    } catch (error) {
      console.error('Order placement failed:', error)
      let errorMessage = 'Failed to place order'
      
      if (error instanceof Error) {
        if (error.message.includes('Trading pair is not active')) {
          errorMessage = 'Trading pair is not active. Please add the trading pair first or contact the contract owner.'
        } else if (error.message.includes('Demo mode: Trading pair not active error ignored')) {
          errorMessage = 'Demo mode: Order would be placed in production. Trading pair not active in demo.'
        } else if (error.message.includes('Insufficient balance')) {
          errorMessage = 'Insufficient token balance to place order'
        } else if (error.message.includes('Invalid amount')) {
          errorMessage = 'Invalid order amount. Please check your inputs.'
        } else if (error.message.includes('Invalid price')) {
          errorMessage = 'Invalid order price. Please check your inputs.'
        } else if (error.message.includes('Internal JSON-RPC error')) {
          errorMessage = 'Network error. Please check your MetaMask connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check approval status when component mounts or dependencies change
  useEffect(() => {
    const signer = walletService.getSigner()
    if (selectedPair && signer) {
      checkApproval('0') // Check with 0 amount initially
    }
  }, [selectedPair])

  const isBuy = side === 'buy'
  const buttonColor = isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
  const icon = isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {orderType.charAt(0).toUpperCase() + orderType.slice(1)} {side.charAt(0).toUpperCase() + side.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount ({selectedPair?.baseTokenSymbol || 'TOKEN'})
            </label>
            <Input
              {...register('amount')}
              type="number"
              step="0.000001"
              placeholder="0.0"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Price ({selectedPair?.quoteTokenSymbol || 'QUOTE'})
              </label>
              <Input
                {...register('price')}
                type="number"
                step="0.000001"
                placeholder="0.0"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>
          )}

          {/* Approval Status */}
          {approvalStatus === 'needed' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Token Approval Required</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                You need to approve tokens before placing your first order.
              </p>
              <Button
                type="button"
                onClick={() => handleApprove(watch('amount'))}
                disabled={isApproving || !watch('amount')}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Approve Tokens
                  </>
                )}
              </Button>
            </div>
          )}

          {approvalStatus === 'approved' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Tokens Approved ✅</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className={`w-full ${buttonColor}`}
            disabled={isSubmitting || !selectedPair || approvalStatus === 'needed'}
          >
            {isSubmitting ? 'Placing Order...' : `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} ${side.charAt(0).toUpperCase() + side.slice(1)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 