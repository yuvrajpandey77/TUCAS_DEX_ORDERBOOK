import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDEXStore } from '@/store/dex-store';
import { useWallet } from '@/hooks/useWallet';
import { dexService } from '@/services/dex-service';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Clock, CheckCircle, XCircle, AlertCircle, List, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface UserOrder {
  id: string;
  baseToken: string;
  quoteToken: string;
  amount: string;
  price: string;
  isBuy: boolean;
  isActive: boolean;
  timestamp: number;
}

const UserOrders = () => {
  const { selectedPair } = useDEXStore();
  const { isConnected, signer, address } = useWallet();
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [isContractAvailable, setIsContractAvailable] = useState(true);
  const { toast } = useToast();

  const checkContractAvailability = async () => {
    if (!isConnected || !signer) return false;
    
    try {
      await dexService.initialize(signer);
      const isDeployed = await dexService.isContractDeployed();
      setIsContractAvailable(isDeployed);
      return isDeployed;
    } catch (error) {
      setIsContractAvailable(false);
      return false;
    }
  };

  const fetchUserOrders = async () => {
    if (!isConnected || !signer || !address) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Check contract availability first
      const contractAvailable = await checkContractAvailability();
      if (!contractAvailable) {
        setUserOrders([]);
        return;
      }

      await dexService.initialize(signer);

      const orderIds = await dexService.getUserOrders(address);
      
      // Fetch order details for each order ID
      const orders: UserOrder[] = [];
      for (const orderId of orderIds) {
        try {
          // In a real implementation, you would have a function to get order details
          // For now, we'll create a mock order structure
          const order: UserOrder = {
            id: orderId.toString(),
            baseToken: selectedPair?.baseToken || '',
            quoteToken: selectedPair?.quoteToken || '',
            amount: '0',
            price: '0',
            isBuy: true,
            isActive: true,
            timestamp: Date.now(),
          };
          orders.push(order);
        } catch (error) {
        }
      }

      setUserOrders(orders);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to cancel orders.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(orderId);

    try {
      await dexService.initialize(signer);
      
      const txHash = await dexService.cancelOrder(orderId);
      
      toast({
        title: "Order Cancelled",
        description: `Order ${orderId} has been cancelled successfully. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Refresh orders
      await fetchUserOrders();
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        variant: "destructive",
      });
    } finally {
      setIsCancelling(null);
    }
  };

  // Fetch orders when wallet connects or selected pair changes
  useEffect(() => {
    if (isConnected && selectedPair) {
      fetchUserOrders();
    } else {
      setUserOrders([]);
    }
  }, [isConnected, selectedPair]);

  // Auto-refresh orders every 30 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchUserOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0' : num.toFixed(6);
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0' : num.toFixed(4);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOrderStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <Clock className="h-4 w-4 text-yellow-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    );
  };

  const getOrderTypeIcon = (isBuy: boolean) => {
    return isBuy ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getOrderTypeBadge = (isBuy: boolean) => {
    return (
      <Badge variant={isBuy ? "default" : "secondary"} className={isBuy ? "bg-green-500" : "bg-red-500"}>
        {isBuy ? "BUY" : "SELL"}
      </Badge>
    );
  };

  const getOrderStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "outline" : "default"} className={isActive ? "border-yellow-500 text-yellow-500" : "bg-green-500"}>
        {isActive ? "ACTIVE" : "FILLED"}
      </Badge>
    );
  };

  if (!isConnected) {
    return (
      <Card className="w-full card-glass border-border/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <List className="h-5 w-5 mr-2 text-blue-400" />
            Your Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Connect your wallet to view your orders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isContractAvailable) {
    return (
      <Card className="w-full card-glass border-border/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <List className="h-5 w-5 mr-2 text-blue-400" />
            Your Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p>DEX contract is not deployed on this network</p>
            <p className="text-sm">Please switch to the correct network</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full card-glass border-border/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <List className="h-5 w-5 mr-2 text-blue-400" />
            Your Orders
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUserOrders}
            disabled={isLoading}
            className="p-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Manage your active and completed orders
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : userOrders.length === 0 ? (
          <div className="text-center py-8">
            <List className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No orders found</p>
            <p className="text-sm text-muted-foreground">Place some orders to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-lg border border-border/20 bg-accent/20 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getOrderTypeIcon(order.isBuy)}
                    <span className="font-medium text-sm">
                      {order.isBuy ? 'Buy' : 'Sell'} {formatAmount(order.amount)} {selectedPair?.baseTokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getOrderTypeBadge(order.isBuy)}
                    {getOrderStatusBadge(order.isActive)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-medium flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatPrice(order.price)} {selectedPair?.quoteTokenSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="font-medium">
                      ${(parseFloat(order.amount) * parseFloat(order.price)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {getOrderStatusIcon(order.isActive)}
                    <span>{formatTimestamp(order.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>ID: {formatAddress(order.id)}</span>
                    {order.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={isCancelling === order.id}
                        className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        {isCancelling === order.id ? (
                          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserOrders; 