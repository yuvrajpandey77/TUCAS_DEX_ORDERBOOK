import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDEXStore } from '@/store/dex-store'
import { formatTokenAmount } from '@/lib/utils'
import { Wallet, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react'
import { dexService } from '@/services/dex-service'
import { useToast } from '@/hooks/use-toast'
import { ethers } from 'ethers'

interface TokenBalance {
  address: string
  symbol: string
  balance: string
}

export function WithdrawForm() {
  const { account, signer, selectedPair, isLoading, setLoading } = useDEXStore()
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { toast } = useToast()

  const fetchBalances = async () => {
    if (!account || !signer || !selectedPair) return

    try {
      setLoading(true)
      await dexService.initialize(signer)
      
      const baseBalance = await dexService.getUserBalance(account, selectedPair.baseToken)
      const quoteBalance = await dexService.getUserBalance(account, selectedPair.quoteToken)
      
      const newBalances: TokenBalance[] = [
        {
          address: selectedPair.baseToken,
          symbol: selectedPair.baseTokenSymbol,
          balance: baseBalance
        },
        {
          address: selectedPair.quoteToken,
          symbol: selectedPair.quoteTokenSymbol,
          balance: quoteBalance
        }
      ]
      
      setBalances(newBalances)
      
      // Auto-select first token with balance
      if (newBalances.length > 0) {
        setSelectedToken(newBalances[0].address)
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      toast({
        title: "Error",
        description: "Failed to fetch balances",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!signer || !selectedToken || !withdrawAmount) return

    try {
      setIsWithdrawing(true)
      await dexService.initialize(signer)
      
      const amountWei = ethers.parseEther(withdrawAmount)
      const txHash = await dexService.withdraw(selectedToken, amountWei.toString())
      
      toast({
        title: "Withdrawal Successful! ✅",
        description: `Successfully withdrew ${withdrawAmount} tokens. Transaction: ${txHash.slice(0, 10)}...`,
      })
      
      // Reset form and refresh balances
      setWithdrawAmount('')
      await fetchBalances()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw tokens'
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const selectedTokenBalance = balances.find(b => b.address === selectedToken)
  const hasBalance = selectedTokenBalance && parseFloat(selectedTokenBalance.balance) > 0

  // Fetch balances on component mount and when dependencies change
  useEffect(() => {
    if (account && signer && selectedPair) {
      fetchBalances()
    }
  }, [account, signer, selectedPair])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Withdraw Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect wallet to withdraw tokens</p>
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
            Withdraw Tokens
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBalances}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedPair ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Select a trading pair to view balances</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Token Selection */}
            <div>
              <Label htmlFor="token-select">Select Token</Label>
              <select
                id="token-select"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Select a token</option>
                {balances.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {formatTokenAmount(token.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Balance Display */}
            {selectedTokenBalance && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Balance:</span>
                  <span className="font-medium">
                    {formatTokenAmount(selectedTokenBalance.balance)} {selectedTokenBalance.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Withdraw Amount Input */}
            <div>
              <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              disabled={!selectedToken || !hasBalance || !withdrawAmount || isWithdrawing || parseFloat(withdrawAmount) <= 0}
              className="w-full"
            >
              {isWithdrawing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw Tokens
                </>
              )}
            </Button>

            {/* Help Text */}
            {!selectedToken && (
              <p className="text-sm text-muted-foreground text-center">
                Select a token to withdraw
              </p>
            )}
            {selectedToken && !hasBalance && selectedTokenBalance && (
              <p className="text-sm text-muted-foreground text-center">
                No balance available for withdrawal
              </p>
            )}
            {selectedToken && hasBalance && !withdrawAmount && (
              <p className="text-sm text-muted-foreground text-center">
                Enter amount to withdraw
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 