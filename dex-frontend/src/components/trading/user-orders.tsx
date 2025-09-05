import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDEXStore } from '@/store/dex-store'
import { formatTokenAmount, formatNumber } from '@/lib/utils'
import { Clock, X, RefreshCw, AlertCircle } from 'lucide-react'
import { dexService } from '@/services/dex-service'
import { useToast } from '@/hooks/use-toast'

interface UserOrder {
  id: string
  baseToken: string
  quoteToken: string
  amount: string
  price: string
  isBuy: boolean
  isActive: boolean
  timestamp: number
  trader: string
}

export function UserOrders() {
  const { account, signer, selectedPair, isLoading, setLoading } = useDEXStore()
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [isCancelling, setIsCancelling] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchUserOrders = async () => {
    if (!account || !signer) return

    try {
      setLoading(true)
      await dexService.initialize(signer)
      const orders = await dexService.getUserOrders(account)
      setUserOrders(orders)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!signer) return

    try {
      setIsCancelling(orderId)
      await dexService.initialize(signer)
      const txHash = await dexService.cancelOrder(orderId)
      
      toast({
        title: "Order Cancelled Successfully! ✅",
        description: `Order #${orderId} has been cancelled. Transaction: ${txHash.slice(0, 10)}...`,
      })
      
      // Refresh orders
      await fetchUserOrders()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order'
      toast({
        title: "Cancel Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCancelling(null)
    }
  }

  useEffect(() => {
    if (account && signer) {
      fetchUserOrders()
    }
  }, [account, signer])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to view your orders</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Orders
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUserOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {userOrders.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No active orders</p>
            <p className="text-sm text-muted-foreground mt-1">
              Place some orders to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      order.isBuy ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {order.isBuy ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{order.id}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span>{formatTokenAmount(order.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span>{formatNumber(parseFloat(order.price))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`text-xs ${
                        order.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {order.isActive ? 'Active' : 'Cancelled'}
                      </span>
                    </div>
                  </div>
                </div>
                {order.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={isCancelling === order.id}
                    className="ml-2"
                  >
                    {isCancelling === order.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 