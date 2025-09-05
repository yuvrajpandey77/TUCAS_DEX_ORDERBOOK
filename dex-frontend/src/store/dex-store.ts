import { create } from 'zustand'
import { ethers } from 'ethers'
import { dexService } from '@/services/dex-service'
import { walletService } from '@/services/wallet-service'
import { getTradingPairs, getDefaultTradingPair } from '@/config/trading-pairs'

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    }
  }
}

export interface Order {
  id: string
  trader: string
  baseToken: string
  quoteToken: string
  amount: string
  price: string
  isBuy: boolean
  isActive: boolean
  timestamp: number
}

export interface TradingPair {
  baseToken: string
  quoteToken: string
  baseTokenSymbol: string
  quoteTokenSymbol: string
  isActive: boolean
  minOrderSize: string
  pricePrecision: string
}

export interface OrderBook {
  buyOrders: Order[]
  sellOrders: Order[]
}

export interface UserBalance {
  [tokenAddress: string]: string
}

interface DEXStore {
  // Trading data
  tradingPairs: TradingPair[]
  selectedPair: TradingPair | null
  orderBook: OrderBook
  userOrders: Order[]
  userBalances: UserBalance
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setSelectedPair: (pair: TradingPair) => void
  setOrderBook: (orderBook: OrderBook) => void
  setUserOrders: (orders: Order[]) => void
  setUserBalances: (balances: UserBalance) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  checkContractDeployment: () => Promise<boolean>
}

export const useDEXStore = create<DEXStore>((set, get) => ({
  // Load trading pairs from environment
  tradingPairs: getTradingPairs(),
  selectedPair: getDefaultTradingPair(),
  orderBook: { buyOrders: [], sellOrders: [] },
  userOrders: [],
  userBalances: {},
  
  isLoading: false,
  error: null,
  
  // Actions
  checkContractDeployment: async () => {
    try {
      const signer = walletService.getSigner();
      if (!signer) return false;
      
      // Initialize the DEX service with the signer first
      await dexService.initialize(signer);
      
      const isDeployed = await dexService.isContractDeployed();
      return isDeployed;
    } catch (error) {
      console.error('Contract deployment check failed:', error);
      return false;
    }
  },
  
  setSelectedPair: (pair) => {
    set({ selectedPair: pair })
  },
  
  setOrderBook: (orderBook) => {
    set({ orderBook })
  },
  
  setUserOrders: (orders) => {
    set({ userOrders: orders })
  },
  
  setUserBalances: (balances) => {
    set({ userBalances: balances })
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  setError: (error) => {
    set({ error })
  },
  
  clearError: () => {
    set({ error: null })
  }
})) 