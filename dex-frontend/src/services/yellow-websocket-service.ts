import { YELLOW_NETWORK_CONFIG } from '@/config/yellow-network';

/**
 * Yellow Network WebSocket Service
 * 
 * Handles real-time communication with Yellow Network broker nodes
 * Implements the pub/sub system described in the technical paper
 */
export class YellowWebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = YELLOW_NETWORK_CONFIG.websocket.maxReconnectAttempts;
  private reconnectInterval = YELLOW_NETWORK_CONFIG.websocket.reconnectInterval;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.setupHeartbeat();
  }

  /**
   * Connect to Yellow Network WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(YELLOW_NETWORK_CONFIG.websocket.brokerUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to Yellow Network WebSocket');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onerror = (error) => {
          console.error('Yellow Network WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = (event) => {
          console.log('Yellow Network WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
  }

  /**
   * Subscribe to order book updates for a trading pair
   */
  subscribeToOrderBook(pair: string, callback: (data: any) => void): () => void {
    const topic = `orderbook:${pair}`;
    return this.subscribe(topic, callback, () => {
      this.send({
        type: 'subscribe',
        channel: YELLOW_NETWORK_CONFIG.websocket.topics.orderBook,
        pair: pair
      });
    });
  }

  /**
   * Subscribe to trade executions
   */
  subscribeToTrades(pair: string, callback: (data: any) => void): () => void {
    const topic = `trades:${pair}`;
    return this.subscribe(topic, callback, () => {
      this.send({
        type: 'subscribe',
        channel: YELLOW_NETWORK_CONFIG.websocket.topics.trades,
        pair: pair
      });
    });
  }

  /**
   * Subscribe to state channel updates
   */
  subscribeToStateChannel(callback: (data: any) => void): () => void {
    const topic = 'statechannel';
    return this.subscribe(topic, callback, () => {
      this.send({
        type: 'subscribe',
        channel: YELLOW_NETWORK_CONFIG.websocket.topics.stateChannel
      });
    });
  }

  /**
   * Subscribe to price updates
   */
  subscribeToPrices(callback: (data: any) => void): () => void {
    const topic = 'prices';
    return this.subscribe(topic, callback, () => {
      this.send({
        type: 'subscribe',
        channel: YELLOW_NETWORK_CONFIG.websocket.topics.priceUpdates
      });
    });
  }

  /**
   * Generic subscription method
   */
  private subscribe(topic: string, callback: Function, subscribeAction: () => void): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    
    this.subscriptions.get(topic)!.push(callback);
    
    // Send subscription message if connected
    if (this.isConnected) {
      subscribeAction();
    }
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(topic) || [];
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // If no more handlers for this topic, unsubscribe
      if (handlers.length === 0) {
        this.subscriptions.delete(topic);
        this.send({
          type: 'unsubscribe',
          topic: topic
        });
      }
    };
  }

  /**
   * Send message to WebSocket
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    console.log('Received Yellow Network message:', data);
    
    // Route message to appropriate handlers
    if (data.type === 'orderbook_update') {
      this.notifySubscribers(`orderbook:${data.pair}`, data);
    } else if (data.type === 'trade_execution') {
      this.notifySubscribers(`trades:${data.pair}`, data);
    } else if (data.type === 'state_channel_update') {
      this.notifySubscribers('statechannel', data);
    } else if (data.type === 'price_update') {
      this.notifySubscribers('prices', data);
    } else if (data.type === 'pong') {
      // Heartbeat response
      console.log('Received pong from Yellow Network');
    } else {
      console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Notify subscribers of a topic
   */
  private notifySubscribers(topic: string, data: any): void {
    const handlers = this.subscriptions.get(topic) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in subscription handler:', error);
      }
    });
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat(): void {
    // Heartbeat will be started when connection is established
  }

  /**
   * Start sending heartbeat messages
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, YELLOW_NETWORK_CONFIG.websocket.heartbeatInterval);
  }

  /**
   * Stop sending heartbeat messages
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      } else {
        console.error('Max reconnection attempts reached');
      }
    }, delay);
  }

  /**
   * Get connection status
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(): number {
    let total = 0;
    for (const handlers of this.subscriptions.values()) {
      total += handlers.length;
    }
    return total;
  }
}

// Export singleton instance
export const yellowWebSocketService = new YellowWebSocketService();
