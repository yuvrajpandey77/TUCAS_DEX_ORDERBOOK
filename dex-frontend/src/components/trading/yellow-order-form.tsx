import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Shield, AlertCircle, RefreshCw, Zap, Globe } from 'lucide-react'
import { yellowNetworkService } from '@/services/yellow-network-service'
import { useYellowNetwork } from '@/components/YellowNetworkProvider'
import { useToast } from '@/hooks/use-toast'
import { Order, OrderType, OrderSide } from '@/config/yellow-network'

const orderSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  price: z.string().min(1, 'Price is required'),
})

type OrderFormData = z.infer<typeof orderSchema>

interface YellowOrderFormProps {
  orderType: OrderType
  side: OrderSide
  tradingPair: string
}

export function YellowOrderForm({ orderType, side, tradingPair }: YellowOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'needed'>('pending')
  const { toast } = useToast()
  
  useYellowNetwork() // Get context but don't destructure unused values
  const [activeStateChannel, setActiveStateChannel] = useState<any>(null)
  const [orderBooks, setOrderBooks] = useState(new Map())
  
  // Initialize mock data
  useEffect(() => {
    // Mock state channel
    setActiveStateChannel({
      id: 'mock-channel-1',
      status: 'open',
      collateral: '1000000000000000000000', // 1000 ETH
      counterparty: '0xMockCounterparty',
      createdAt: Date.now(),
      lastSettlement: Date.now(),
      distributionRatio: 0.5,
      marginCallThreshold: 0.8,
      challengePeriod: 86400,
      totalVolume: '0',
      lastTrade: 0,
    })
    
    // Mock order book
    const mockOrderBook = {
      pair: tradingPair,
      buyOrders: [
        { id: '1', pair: tradingPair, side: 'buy', type: 'limit', amount: '1.5', price: '1950', status: 'active', createdAt: Date.now(), trader: '0xTrader1', stateChannelId: 'mock-channel-1' },
        { id: '2', pair: tradingPair, side: 'buy', type: 'limit', amount: '2.0', price: '1940', status: 'active', createdAt: Date.now(), trader: '0xTrader2', stateChannelId: 'mock-channel-1' },
      ],
      sellOrders: [
        { id: '3', pair: tradingPair, side: 'sell', type: 'limit', amount: '1.0', price: '2000', status: 'active', createdAt: Date.now(), trader: '0xTrader3', stateChannelId: 'mock-channel-1' },
        { id: '4', pair: tradingPair, side: 'sell', type: 'limit', amount: '1.5', price: '2010', status: 'active', createdAt: Date.now(), trader: '0xTrader4', stateChannelId: 'mock-channel-1' },
      ],
      lastUpdate: Date.now(),
      totalBidVolume: '3.5',
      totalAskVolume: '2.5',
      bestBid: '1950',
      bestAsk: '2000',
      spread: '50',
    }
    
    setOrderBooks(new Map([[tradingPair, mockOrderBook]]))
  }, [tradingPair])
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  })

  const watchedAmount = watch('amount')
  const watchedPrice = watch('price')

  // Check if state channel is open
  const isStateChannelOpen = activeStateChannel?.status === 'open'

  // Get current market price from order book
  const getCurrentMarketPrice = () => {
    const orderBook = orderBooks.get(tradingPair)
    if (!orderBook) return '0'
    
    if (side === 'buy') {
      // For buy orders, get best ask price (sell orders)
      return orderBook.sellOrders.length > 0 ? orderBook.sellOrders[0].price : '0'
    } else {
      // For sell orders, get best bid price (buy orders)
      return orderBook.buyOrders.length > 0 ? orderBook.buyOrders[0].price : '0'
    }
  }

  // Calculate estimated values
  const calculateEstimatedValues = () => {
    if (!watchedAmount || !watchedPrice) return null
    
    const amount = parseFloat(watchedAmount)
    const price = parseFloat(watchedPrice)
    
    if (isNaN(amount) || isNaN(price) || price <= 0) return null
    
    const totalValue = (amount * price).toFixed(6)
    const fee = (amount * price * 0.001).toFixed(6) // 0.1% Yellow Network fee
    const priceImpact = '0.01%' // Mock value for now
    
    return {
      totalValue,
      fee,
      priceImpact,
    }
  }

  const estimatedValues = calculateEstimatedValues()

  // Check token approval status
  const checkApproval = async (amount: string) => {
    if (!isStateChannelOpen) {
      setApprovalStatus('needed')
      return
    }

    try {
      // In Yellow Network, tokens are pre-approved in state channels
      // Check if we have sufficient balance in the state channel
      const balance = await yellowNetworkService.getStateChannelBalance(activeStateChannel!.id)
      const requiredAmount = parseFloat(amount)
      
      if (balance >= requiredAmount) {
        setApprovalStatus('approved')
      } else {
        setApprovalStatus('needed')
      }
    } catch (error) {
      console.error('Error checking approval:', error)
      setApprovalStatus('needed')
    }
  }

  // Handle approval
  const handleApproval = async () => {
    if (!isStateChannelOpen) {
      toast({
        title: "State Channel Required",
        description: "Please open a state channel to place orders.",
        variant: "destructive",
      })
      return
    }

    setIsApproving(true)
    try {
      // In Yellow Network, we need to deposit tokens into the state channel
      await yellowNetworkService.depositToStateChannel(
        activeStateChannel!.id,
        watchedAmount,
        tradingPair.split('/')[0] // Base token
      )
      
      setApprovalStatus('approved')
      toast({
        title: "Tokens Deposited",
        description: "Tokens have been deposited to your state channel.",
        variant: "default",
      })
    } catch (error) {
      console.error('Approval failed:', error)
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Failed to deposit tokens",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  // Handle order submission
  const onSubmit = async (data: OrderFormData) => {
    if (!isStateChannelOpen) {
      toast({
        title: "State Channel Required",
        description: "Please open a state channel to place orders.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const order: Omit<Order, 'id' | 'createdAt' | 'trader'> = {
        pair: tradingPair,
        side,
        type: orderType,
        amount: data.amount,
        price: data.price,
        stateChannelId: activeStateChannel!.id,
        status: 'pending',
      }

      await yellowNetworkService.placeOrder(order)
      
      toast({
        title: "Order Placed",
        description: `${side.toUpperCase()} order placed successfully in state channel.`,
        variant: "default",
      })
      
      reset()
    } catch (error) {
      console.error('Order submission failed:', error)
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set market price when component mounts
  useEffect(() => {
    const marketPrice = getCurrentMarketPrice()
    if (marketPrice !== '0') {
      // Set the price field to market price
      const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement
      if (priceInput && !priceInput.value) {
        priceInput.value = marketPrice
      }
    }
  }, [tradingPair, side])

  // Check approval when amount changes
  useEffect(() => {
    if (watchedAmount) {
      checkApproval(watchedAmount)
    }
  }, [watchedAmount, isStateChannelOpen])

  return (
    <Card className="card-glass border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Yellow Network {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            State Channel
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* State Channel Status */}
          {!isStateChannelOpen && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">State Channel Required</span>
              </div>
              <p className="text-xs text-yellow-600/80 mt-1">
                Open a state channel to place orders with Yellow Network.
              </p>
            </div>
          )}

          {/* Order Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={side === 'buy' ? 'default' : 'secondary'} className="flex items-center gap-1">
              {side === 'buy' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {side.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {orderType.toUpperCase()}
            </Badge>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              {...register('amount')}
              placeholder="0.00"
              type="number"
              step="0.000001"
              className="text-lg"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Price</label>
            <Input
              {...register('price')}
              placeholder="0.00"
              type="number"
              step="0.000001"
              className="text-lg"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          {/* Estimated Values */}
          {estimatedValues && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">{estimatedValues.totalValue} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (0.1%):</span>
                <span className="font-medium">{estimatedValues.fee} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact:</span>
                <span className="font-medium">{estimatedValues.priceImpact}</span>
              </div>
            </div>
          )}

          {/* Approval Status */}
          {approvalStatus === 'needed' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">
                    Deposit tokens to state channel
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApproval}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Deposit'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isStateChannelOpen || approvalStatus !== 'approved' || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Place {side.toUpperCase()} Order
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
