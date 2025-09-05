import { ethers } from 'ethers';
import { dexService } from './dex-service';

export interface OrderMatch {
  buyOrderId: string;
  sellOrderId: string;
  matchedAmount: string;
  matchedPrice: string;
  timestamp: number;
  txHash?: string;
}

export interface MatchingResult {
  matched: boolean;
  matchDetails?: OrderMatch;
  remainingBuyAmount?: string;
  remainingSellAmount?: string;
  error?: string;
}

export interface OrderBookSnapshot {
  buyOrders: Array<{
    id: string;
    price: string;
    amount: string;
    trader: string;
    timestamp: number;
  }>;
  sellOrders: Array<{
    id: string;
    price: string;
    amount: string;
    trader: string;
    timestamp: number;
  }>;
}

export class OrderMatchingService {
  private readonly PRICE_TOLERANCE = 0.001; // 0.1% price tolerance for matching

  // Check if two orders can be matched
  canMatchOrders(
    buyOrder: { price: string; amount: string },
    sellOrder: { price: string; amount: string }
  ): boolean {
    const buyPrice = parseFloat(buyOrder.price);
    const sellPrice = parseFloat(sellOrder.price);
    
    // Buy order price must be >= sell order price
    return buyPrice >= sellPrice;
  }

  // Calculate match amount between two orders
  calculateMatchAmount(
    buyOrder: { amount: string },
    sellOrder: { amount: string }
  ): string {
    const buyAmount = parseFloat(buyOrder.amount);
    const sellAmount = parseFloat(sellOrder.amount);
    
    // Return the smaller of the two amounts
    return Math.min(buyAmount, sellAmount).toString();
  }

  // Calculate match price (weighted average)
  calculateMatchPrice(
    buyOrder: { price: string; amount: string },
    sellOrder: { price: string; amount: string },
    matchAmount: string
  ): string {
    const buyPrice = parseFloat(buyOrder.price);
    const sellPrice = parseFloat(sellOrder.price);
    const matchAmountNum = parseFloat(matchAmount);
    
    // Weighted average price
    const weightedPrice = (buyPrice + sellPrice) / 2;
    
    return weightedPrice.toFixed(6);
  }

  // Find matching orders in order book
  findMatches(orderBook: OrderBookSnapshot): OrderMatch[] {
    const matches: OrderMatch[] = [];
    const buyOrders = [...orderBook.buyOrders].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    const sellOrders = [...orderBook.sellOrders].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        if (this.canMatchOrders(buyOrder, sellOrder)) {
          const matchAmount = this.calculateMatchAmount(buyOrder, sellOrder);
          const matchPrice = this.calculateMatchPrice(buyOrder, sellOrder, matchAmount);
          
          if (parseFloat(matchAmount) > 0) {
            matches.push({
              buyOrderId: buyOrder.id,
              sellOrderId: sellOrder.id,
              matchedAmount,
              matchedPrice: matchPrice,
              timestamp: Date.now()
            });
          }
        }
      }
    }

    return matches;
  }

  // Execute a market order by finding matches
  async executeMarketOrder(
    baseToken: string,
    quoteToken: string,
    amount: string,
    isBuy: boolean,
    signer: ethers.JsonRpcSigner
  ): Promise<MatchingResult> {
    try {
      await dexService.initialize(signer);
      
      // Get current order book
      const orderBook = await dexService.getOrderBook(baseToken, quoteToken);
      
      // Convert to our format
      const orderBookSnapshot: OrderBookSnapshot = {
        buyOrders: orderBook.buyOrders.map(order => ({
          id: order.id,
          price: ethers.formatEther(order.price),
          amount: ethers.formatEther(order.amount),
          trader: order.trader,
          timestamp: order.timestamp
        })),
        sellOrders: orderBook.sellOrders.map(order => ({
          id: order.id,
          price: ethers.formatEther(order.price),
          amount: ethers.formatEther(order.amount),
          trader: order.trader,
          timestamp: order.timestamp
        }))
      };

      let remainingAmount = parseFloat(amount);
      const matches: OrderMatch[] = [];

      if (isBuy) {
        // Market buy - find sell orders to match against
        const sellOrders = orderBookSnapshot.sellOrders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        
        for (const sellOrder of sellOrders) {
          if (remainingAmount <= 0) break;
          
          const matchAmount = Math.min(remainingAmount, parseFloat(sellOrder.amount));
          const matchPrice = this.calculateMatchPrice(
            { price: sellOrder.price, amount: matchAmount.toString() },
            sellOrder,
            matchAmount.toString()
          );
          
          matches.push({
            buyOrderId: 'market-buy',
            sellOrderId: sellOrder.id,
            matchedAmount: matchAmount.toString(),
            matchedPrice: matchPrice,
            timestamp: Date.now()
          });
          
          remainingAmount -= matchAmount;
        }
      } else {
        // Market sell - find buy orders to match against
        const buyOrders = orderBookSnapshot.buyOrders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        
        for (const buyOrder of buyOrders) {
          if (remainingAmount <= 0) break;
          
          const matchAmount = Math.min(remainingAmount, parseFloat(buyOrder.amount));
          const matchPrice = this.calculateMatchPrice(
            buyOrder,
            { price: buyOrder.price, amount: matchAmount.toString() },
            matchAmount.toString()
          );
          
          matches.push({
            buyOrderId: buyOrder.id,
            sellOrderId: 'market-sell',
            matchedAmount: matchAmount.toString(),
            matchedPrice: matchPrice,
            timestamp: Date.now()
          });
          
          remainingAmount -= matchAmount;
        }
      }

      if (matches.length === 0) {
        return {
          matched: false,
          error: 'No matching orders found'
        };
      }

      // Execute the matches
      const executedMatches: OrderMatch[] = [];
      for (const match of matches) {
        try {
          // In a real implementation, you would execute the trade here
          // For now, we'll simulate the execution
          executedMatches.push({
            ...match,
            txHash: `0x${Math.random().toString(16).slice(2, 66)}` // Simulated tx hash
          });
        } catch (error) {
          console.error('Error executing match:', error);
        }
      }

      return {
        matched: executedMatches.length > 0,
        matchDetails: executedMatches[0], // Return first match for simplicity
        remainingBuyAmount: isBuy ? remainingAmount.toString() : undefined,
        remainingSellAmount: !isBuy ? remainingAmount.toString() : undefined
      };

    } catch (error) {
      console.error('Error executing market order:', error);
      return {
        matched: false,
        error: error instanceof Error ? error.message : 'Failed to execute market order'
      };
    }
  }

  // Check if a limit order can be filled immediately
  async checkImmediateFill(
    baseToken: string,
    quoteToken: string,
    amount: string,
    price: string,
    isBuy: boolean,
    signer: ethers.JsonRpcSigner
  ): Promise<{
    canFill: boolean;
    fillAmount?: string;
    fillPrice?: string;
    estimatedSlippage?: string;
  }> {
    try {
      await dexService.initialize(signer);
      
      const orderBook = await dexService.getOrderBook(baseToken, quoteToken);
      
      if (isBuy) {
        // Check if there are sell orders at or below our price
        const matchingSells = orderBook.sellOrders.filter(order => 
          parseFloat(ethers.formatEther(order.price)) <= parseFloat(price)
        );
        
        if (matchingSells.length === 0) {
          return { canFill: false };
        }
        
        // Calculate total available at our price or better
        const totalAvailable = matchingSells.reduce((sum, order) => 
          sum + parseFloat(ethers.formatEther(order.amount)), 0
        );
        
        const requestedAmount = parseFloat(amount);
        const canFill = totalAvailable >= requestedAmount;
        const fillAmount = Math.min(totalAvailable, requestedAmount).toString();
        
        // Calculate average fill price
        const totalValue = matchingSells.reduce((sum, order) => {
          const orderPrice = parseFloat(ethers.formatEther(order.price));
          const orderAmount = parseFloat(ethers.formatEther(order.amount));
          return sum + (orderPrice * orderAmount);
        }, 0);
        
        const fillPrice = (totalValue / totalAvailable).toFixed(6);
        const estimatedSlippage = ((parseFloat(fillPrice) - parseFloat(price)) / parseFloat(price) * 100).toFixed(2);
        
        return {
          canFill,
          fillAmount,
          fillPrice,
          estimatedSlippage
        };
      } else {
        // Check if there are buy orders at or above our price
        const matchingBuys = orderBook.buyOrders.filter(order => 
          parseFloat(ethers.formatEther(order.price)) >= parseFloat(price)
        );
        
        if (matchingBuys.length === 0) {
          return { canFill: false };
        }
        
        // Calculate total available at our price or better
        const totalAvailable = matchingBuys.reduce((sum, order) => 
          sum + parseFloat(ethers.formatEther(order.amount)), 0
        );
        
        const requestedAmount = parseFloat(amount);
        const canFill = totalAvailable >= requestedAmount;
        const fillAmount = Math.min(totalAvailable, requestedAmount).toString();
        
        // Calculate average fill price
        const totalValue = matchingBuys.reduce((sum, order) => {
          const orderPrice = parseFloat(ethers.formatEther(order.price));
          const orderAmount = parseFloat(ethers.formatEther(order.amount));
          return sum + (orderPrice * orderAmount);
        }, 0);
        
        const fillPrice = (totalValue / totalAvailable).toFixed(6);
        const estimatedSlippage = ((parseFloat(price) - parseFloat(fillPrice)) / parseFloat(price) * 100).toFixed(2);
        
        return {
          canFill,
          fillAmount,
          fillPrice,
          estimatedSlippage
        };
      }
    } catch (error) {
      console.error('Error checking immediate fill:', error);
      return { canFill: false };
    }
  }

  // Get order book depth analysis
  async getOrderBookDepth(
    baseToken: string,
    quoteToken: string,
    signer: ethers.JsonRpcSigner
  ): Promise<{
    buyDepth: Array<{ price: string; totalAmount: string }>;
    sellDepth: Array<{ price: string; totalAmount: string }>;
    spread: string;
    midPrice: string;
  }> {
    try {
      await dexService.initialize(signer);
      
      const orderBook = await dexService.getOrderBook(baseToken, quoteToken);
      
      // Aggregate buy orders by price
      const buyDepth = new Map<string, number>();
      orderBook.buyOrders.forEach(order => {
        const price = ethers.formatEther(order.price);
        const amount = parseFloat(ethers.formatEther(order.amount));
        buyDepth.set(price, (buyDepth.get(price) || 0) + amount);
      });
      
      // Aggregate sell orders by price
      const sellDepth = new Map<string, number>();
      orderBook.sellOrders.forEach(order => {
        const price = ethers.formatEther(order.price);
        const amount = parseFloat(ethers.formatEther(order.amount));
        sellDepth.set(price, (sellDepth.get(price) || 0) + amount);
      });
      
      // Calculate spread and mid price
      const buyPrices = Array.from(buyDepth.keys()).map(Number).sort((a, b) => b - a);
      const sellPrices = Array.from(sellDepth.keys()).map(Number).sort((a, b) => a - b);
      
      let spread = '0.0000';
      let midPrice = '0.0000';
      
      if (buyPrices.length > 0 && sellPrices.length > 0) {
        const bestBuy = buyPrices[0];
        const bestSell = sellPrices[0];
        spread = (bestSell - bestBuy).toFixed(4);
        midPrice = ((bestBuy + bestSell) / 2).toFixed(4);
      }
      
      return {
        buyDepth: Array.from(buyDepth.entries())
          .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
          .map(([price, totalAmount]) => ({
            price,
            totalAmount: totalAmount.toFixed(4)
          })),
        sellDepth: Array.from(sellDepth.entries())
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
          .map(([price, totalAmount]) => ({
            price,
            totalAmount: totalAmount.toFixed(4)
          })),
        spread,
        midPrice
      };
    } catch (error) {
      console.error('Error getting order book depth:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const orderMatchingService = new OrderMatchingService(); 