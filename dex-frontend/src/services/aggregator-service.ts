import { ethers } from 'ethers'

interface QuoteParams {
  sellToken: string
  buyToken: string
  sellAmount?: string
  buyAmount?: string
  takerAddress?: string
}

interface QuoteResponse {
  price: string
  guaranteedPrice: string
  to: string
  data: string
  value: string
  gas: string
  estimatedGas: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
}

export class AggregatorService {
  private readonly baseUrl: string
  private readonly isTestnet: boolean
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds
  
  constructor(network: 'mainnet' | 'mumbai' = 'mumbai') {
    this.baseUrl = network === 'mainnet' ? 'https://api.0x.org' : 'https://mumbai.api.0x.org'
    this.isTestnet = network === 'mumbai'
  }

  async getQuote(params: QuoteParams): Promise<QuoteResponse> {
    const url = new URL(`${this.baseUrl}/swap/v1/quote`)
    if (params.sellAmount) url.searchParams.set('sellAmount', params.sellAmount)
    if (params.buyAmount) url.searchParams.set('buyAmount', params.buyAmount)
    url.searchParams.set('sellToken', params.sellToken)
    url.searchParams.set('buyToken', params.buyToken)
    if (params.takerAddress) url.searchParams.set('takerAddress', params.takerAddress)
    
    // Add slippage protection for testnet
    url.searchParams.set('slippagePercentage', '0.5')


    const res = await fetch(url.toString())
    if (!res.ok) {
      const text = await res.text()
      
      // Handle specific error cases
      if (res.status === 400) {
        throw new Error('Invalid token pair or amount. Please check your selection.')
      } else if (res.status === 404) {
        // For testnet, provide a mock quote if no liquidity is available
        if (this.isTestnet) {
          return this.getMockQuote(params)
        }
        throw new Error('No liquidity available for this token pair on Sepolia testnet.')
      } else {
        throw new Error(`Quote failed: ${text}`)
      }
    }
    return res.json()
  }

  // Get real-time price from multiple sources
  async getRealTimePrice(sellToken: string, buyToken: string): Promise<number> {
    const cacheKey = `${sellToken}-${buyToken}`
    const cached = this.priceCache.get(cacheKey)
    
    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price
    }


    // For MATIC to USDC, try CoinGecko first (more reliable for mainnet prices)
    if (sellToken === '0x0000000000000000000000000000000000000000' && 
        buyToken === '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23') {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd')
        const data = await response.json()
        const price = data['matic-network'].usd
        this.priceCache.set(cacheKey, { price, timestamp: Date.now() })
        return price
      } catch (coingeckoError) {
      }
    }

    // Try 0x API as secondary option
    try {
      const quote = await this.getQuote({
        sellToken,
        buyToken,
        sellAmount: '1000000000000000000' // 1 ETH
      })
      
      const price = parseFloat(ethers.formatEther(quote.buyAmount))
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() })
      return price
    } catch (error) {
    }
    
          // Final fallback to static rate
      const fallbackPrice = 0.8 // 1 MATIC = 0.8 USDC (approximate)
      this.priceCache.set(cacheKey, { price: fallbackPrice, timestamp: Date.now() })
      return fallbackPrice
  }

  private getMockQuote(params: QuoteParams): QuoteResponse {
    // Mock quote for testnet when no real liquidity is available
    const sellAmount = params.sellAmount || '1000000000000000000' // 1 ETH default
    const mockPrice = '2000000000000000000000' // Mock price: 1 ETH = 2000 USDC
    
    return {
      price: mockPrice,
      guaranteedPrice: mockPrice,
      to: '0x0000000000000000000000000000000000000000', // Mock contract
      data: '0x', // Mock data
      value: params.sellToken === '0x0000000000000000000000000000000000000000' ? sellAmount : '0',
      gas: '21000',
      estimatedGas: '21000',
      buyAmount: ((BigInt(sellAmount) * BigInt(mockPrice)) / BigInt('1000000000000000000')).toString(),
      sellAmount: sellAmount,
      allowanceTarget: '0x0000000000000000000000000000000000000000',
      sellTokenToEthRate: '1000000000000000000',
      buyTokenToEthRate: '500000000000000000'
    }
  }

  async executeSwap(
    signer: ethers.JsonRpcSigner,
    quote: QuoteResponse
  ): Promise<string> {
    // Validate quote before execution
    if (!quote.to || quote.to === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid swap target: missing or zero address');
    }
    
    if (!quote.data || quote.data === '0x') {
      throw new Error('Invalid swap data: missing transaction data');
    }
    
    // Check if this is a mock quote (for testnet when no real DEX is available)
    if (quote.to === '0xE592427A0AEce92De3Edee1F18E0157C05861564' && quote.data === '0x') {
      
      // For mock quotes, we'll just simulate a transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64)
      
      return mockTxHash
    }

    // Execute real transactions when we have a valid quote

    // Real swap execution with proper gas estimation
    try {
      // Estimate gas for the transaction
      const gasEstimate = await signer.estimateGas({
        to: quote.to,
        data: quote.data as `0x${string}`,
        value: BigInt(quote.value || '0')
      });

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;


      // Get current gas price
      const feeData = await signer.provider?.getFeeData();
      const gasPrice = feeData?.gasPrice || BigInt('20000000000'); // 20 gwei default

      // Show transaction details to user
      const txDetails = {
        to: quote.to,
        value: ethers.formatEther(quote.value || '0'),
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost: ethers.formatEther(gasLimit * gasPrice)
      };


      // Execute the transaction
      const tx = await signer.sendTransaction({
        to: quote.to,
        data: quote.data as `0x${string}`,
        value: BigInt(quote.value || '0'),
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });

      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      return receipt?.hash || tx.hash;
    } catch (error) {
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aggregatorService = new AggregatorService('mumbai')


