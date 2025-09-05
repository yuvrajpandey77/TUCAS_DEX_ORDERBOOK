import React, { useEffect } from 'react'
import { useDEXStore } from '@/store/dex-store'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OrderForm } from '@/components/trading/order-form'
import OrderBook from '@/components/OrderBook'
import { UserBalance } from '@/components/trading/user-balance'
import { UserOrders } from '@/components/trading/user-orders'
import { WithdrawForm } from '@/components/trading/withdraw-form'
import { BarChart3, TrendingUp, TrendingDown, Activity, Clock, DollarSign, ArrowUpDown } from 'lucide-react'
// import { formatAddress } from '@/lib/utils'
// import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/Navbar'
import FloatingOrbs from '@/components/FloatingOrbs'
// import PageTransition from '@/components/PageTransition'

function TradingInterface() {
  const {
    selectedPair,
    setSelectedPair,
    error,
    clearError
  } = useDEXStore()
  
  const {
    isConnected,
    address: account,
    error: walletError
  } = useWallet()

  // const { toast } = useToast()

  // Trading pairs using deployed contracts
  const mockTradingPairs = React.useMemo(() => [
    {
              baseToken: '0x0000000000000000000000000000000000000000', // Native MONAD
      quoteToken: '0x0000000000000000000000000000000000000000', // MONAD (native)
      baseTokenSymbol: 'MONAD',
      quoteTokenSymbol: 'MONAD',
      isActive: true,
      minOrderSize: '1000000000000000000', // 1 token
      pricePrecision: '1000000000000000000' // 18 decimals
    }
  ], [])

  useEffect(() => {
    if (mockTradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(mockTradingPairs[0])
    }
  }, [selectedPair, setSelectedPair, mockTradingPairs])

  // Debug connection state
  useEffect(() => {
  }, [isConnected, account, error, walletError])



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Orbs */}
      <FloatingOrbs />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* Professional Trading Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-heading">
                Advanced Trading
              </h1>
              <p className="text-muted-foreground text-lg">
                Professional trading interface with real-time order book data
              </p>
            </div>

            {/* Trading Pair Selector & Stats */}
            {selectedPair && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Card className="bg-background/20 backdrop-blur-xl border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trading Pair</p>
                      <p className="font-semibold text-foreground font-mono">
                        {(selectedPair as any).baseTokenSymbol}/{(selectedPair as any).quoteTokenSymbol}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Mock Price Stats */}
                <Card className="bg-background/20 backdrop-blur-xl border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Change</p>
                      <p className="font-semibold text-green-500 font-mono">+2.34%</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {(error || walletError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-red-500/80 text-sm">{error || walletError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {selectedPair ? (
          <div className="space-y-8">
            {/* Main Trading Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left Column - Order Forms */}
              <div className="xl:col-span-2 space-y-6">
                {/* Buy Orders Section */}
                <Card className="bg-background/20 backdrop-blur-xl border-white/10 overflow-hidden">
                  <CardHeader className="bg-green-500/10 border-b border-green-500/20">
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <TrendingUp className="w-5 h-5" />
                      Buy Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <OrderForm orderType="limit" side="buy" />
                      <OrderForm orderType="market" side="buy" />
                    </div>
                  </CardContent>
                </Card>

                {/* Sell Orders Section */}
                <Card className="bg-background/20 backdrop-blur-xl border-white/10 overflow-hidden">
                  <CardHeader className="bg-red-500/10 border-b border-red-500/20">
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <TrendingDown className="w-5 h-5" />
                      Sell Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <OrderForm orderType="limit" side="sell" />
                      <OrderForm orderType="market" side="sell" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Book & User Data */}
              <div className="xl:col-span-2 space-y-6">
                {/* Order Book */}
                <Card className="bg-background/20 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Order Book
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <OrderBook />
                  </CardContent>
                </Card>

                {/* User Balance */}
                <Card className="bg-background/20 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Your Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserBalance />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Row - User Orders & Withdraw */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Orders */}
              <Card className="bg-background/20 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Your Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserOrders />
                </CardContent>
              </Card>

              {/* Withdraw Form */}
              <Card className="bg-background/20 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Withdraw Funds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WithdrawForm />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* No Trading Pair State */
          <div className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">
                No Trading Pair Selected
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Connect your wallet to automatically select a trading pair and start trading.
              </p>
              
              <Card className="bg-background/20 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {isConnected ? "Ready to Trade" : "Connect Wallet"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? "Your wallet is connected. Trading pair will be selected automatically." 
                    : "Please connect your wallet to access the trading interface."
                  }
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TradingInterface 