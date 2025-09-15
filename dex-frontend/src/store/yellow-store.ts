import { create } from 'zustand';
import { StateChannel, Order, OrderBook, MarketData } from '@/config/yellow-network';

interface YellowStore {
  // State Channel Management
  stateChannels: StateChannel[];
  activeStateChannel: StateChannel | null;
  
  // Trading Data
  orderBooks: Map<string, OrderBook>;
  userOrders: Order[];
  marketData: Map<string, MarketData>;
  
  // Network Status
  isConnected: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Actions
  setStateChannels: (channels: StateChannel[]) => void;
  setActiveStateChannel: (channel: StateChannel | null) => void;
  addStateChannel: (channel: StateChannel) => void;
  removeStateChannel: (channelId: string) => void;
  updateStateChannel: (channelId: string, updates: Partial<StateChannel>) => void;
  
  setOrderBook: (pair: string, orderBook: OrderBook) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  setUserOrders: (orders: Order[]) => void;
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  
  setMarketData: (pair: string, data: MarketData) => void;
  
  setConnectionStatus: (isConnected: boolean) => void;
  setInitializing: (isInitializing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getOrderBook: (pair: string) => OrderBook | null;
  getMarketData: (pair: string) => MarketData | null;
  getActiveOrders: () => Order[];
  getStateChannelById: (channelId: string) => StateChannel | null;
}

export const useYellowStore = create<YellowStore>((set, get) => ({
  // Initial state
  stateChannels: [],
  activeStateChannel: null,
  orderBooks: new Map(),
  userOrders: [],
  marketData: new Map(),
  isConnected: false,
  isInitializing: false,
  error: null,

  // State Channel Actions
  setStateChannels: (channels) => set({ stateChannels: channels }),
  
  setActiveStateChannel: (channel) => set({ activeStateChannel: channel }),
  
  addStateChannel: (channel) => set((state) => ({
    stateChannels: [...state.stateChannels, channel]
  })),
  
  removeStateChannel: (channelId) => set((state) => ({
    stateChannels: state.stateChannels.filter(channel => channel.id !== channelId),
    activeStateChannel: state.activeStateChannel?.id === channelId ? null : state.activeStateChannel
  })),
  
  updateStateChannel: (channelId, updates) => set((state) => ({
    stateChannels: state.stateChannels.map(channel =>
      channel.id === channelId ? { ...channel, ...updates } : channel
    ),
    activeStateChannel: state.activeStateChannel?.id === channelId 
      ? { ...state.activeStateChannel, ...updates }
      : state.activeStateChannel
  })),

  // Trading Actions
  setOrderBook: (pair, orderBook) => set((state) => {
    const newOrderBooks = new Map(state.orderBooks);
    newOrderBooks.set(pair, orderBook);
    return { orderBooks: newOrderBooks };
  }),
  
  addOrder: (order) => set((state) => {
    const newUserOrders = [...state.userOrders, order];
    return { userOrders: newUserOrders };
  }),
  
  updateOrder: (orderId, updates) => set((state) => ({
    userOrders: state.userOrders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    )
  })),
  
  removeOrder: (orderId) => set((state) => ({
    userOrders: state.userOrders.filter(order => order.id !== orderId)
  })),
  
  setUserOrders: (orders) => set({ userOrders: orders }),

  // Place order action
  placeOrder: async (orderData) => {
    const order: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    
    set((state) => ({
      userOrders: [...state.userOrders, order]
    }));
    
    // In a real implementation, this would call the Yellow Network service
    console.log('Order placed:', order);
  },

  // Market Data Actions
  setMarketData: (pair, data) => set((state) => {
    const newMarketData = new Map(state.marketData);
    newMarketData.set(pair, data);
    return { marketData: newMarketData };
  }),

  // Network Status Actions
  setConnectionStatus: (isConnected) => set({ isConnected }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setError: (error) => set({ error }),

  // Computed values
  getOrderBook: (pair) => {
    const state = get();
    return state.orderBooks.get(pair) || null;
  },
  
  getMarketData: (pair) => {
    const state = get();
    return state.marketData.get(pair) || null;
  },
  
  getActiveOrders: () => {
    const state = get();
    return state.userOrders.filter(order => 
      order.status === 'pending' || order.status === 'partially-filled'
    );
  },
  
  getStateChannelById: (channelId) => {
    const state = get();
    return state.stateChannels.find(channel => channel.id === channelId) || null;
  },
}));

// Selector hooks for better performance
export const useStateChannels = () => useYellowStore(state => state.stateChannels);
export const useActiveStateChannel = () => useYellowStore(state => state.activeStateChannel);
export const useOrderBook = (pair: string) => useYellowStore(state => state.getOrderBook(pair));
export const useUserOrders = () => useYellowStore(state => state.userOrders);
export const useActiveOrders = () => useYellowStore(state => state.getActiveOrders());
export const useMarketData = (pair: string) => useYellowStore(state => state.getMarketData(pair));
export const useYellowConnectionStatus = () => useYellowStore(state => ({
  isConnected: state.isConnected,
  isInitializing: state.isInitializing,
  error: state.error,
}));

// Action hooks
export const useYellowActions = () => useYellowStore(state => ({
  setStateChannels: state.setStateChannels,
  setActiveStateChannel: state.setActiveStateChannel,
  addStateChannel: state.addStateChannel,
  removeStateChannel: state.removeStateChannel,
  updateStateChannel: state.updateStateChannel,
  setOrderBook: state.setOrderBook,
  addOrder: state.addOrder,
  updateOrder: state.updateOrder,
  removeOrder: state.removeOrder,
  setUserOrders: state.setUserOrders,
  placeOrder: state.placeOrder,
  setMarketData: state.setMarketData,
  setConnectionStatus: state.setConnectionStatus,
  setInitializing: state.setInitializing,
  setError: state.setError,
}));
