
import { WebSocketStreamData } from '../trading/types';
import { StorageManager } from './storageManager';
import { toast } from 'sonner';

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Binance WebSocket Stream Manager
 * Handles real-time data streams from Binance
 */
export class WebSocketService {
  private sockets: Map<string, WebSocket> = new Map();
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds
  private status: WebSocketStatus = 'disconnected';
  private lastHeartbeat: Map<string, number> = new Map();
  private heartbeatInterval: number | null = null;
  
  /**
   * Connect to a Binance WebSocket stream
   */
  public connect(streamName: string, symbol: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const streamKey = this.getStreamKey(streamName, symbol);
        
        // Check if already connected
        if (this.sockets.has(streamKey) && this.sockets.get(streamKey)?.readyState === WebSocket.OPEN) {
          console.log(`Already connected to ${streamKey}`);
          resolve(true);
          return;
        }
        
        // Reset reconnect attempts if this is a new connection
        this.reconnectAttempts.set(streamKey, 0);
        
        // Build WebSocket URL
        const baseUrl = 'wss://stream.binance.com:9443/ws';
        const wsUrl = `${baseUrl}/${symbol.toLowerCase()}@${streamName}`;
        
        console.log(`Connecting to WebSocket: ${wsUrl}`);
        this.status = 'connecting';
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log(`WebSocket connected: ${streamKey}`);
          this.sockets.set(streamKey, ws);
          this.status = 'connected';
          this.lastHeartbeat.set(streamKey, Date.now());
          
          // Start heartbeat check if not already running
          if (this.heartbeatInterval === null) {
            this.startHeartbeatCheck();
          }
          
          resolve(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.lastHeartbeat.set(streamKey, Date.now());
            
            // Create stream data object
            const streamData: WebSocketStreamData = {
              stream: streamKey,
              data,
              timestamp: Date.now()
            };
            
            // Notify listeners
            const streamListeners = this.listeners.get(streamKey) || [];
            streamListeners.forEach(listener => {
              try {
                listener(streamData);
              } catch (listenerError) {
                console.error(`Error in stream listener for ${streamKey}:`, listenerError);
              }
            });
          } catch (parseError) {
            console.error(`Error parsing WebSocket data from ${streamKey}:`, parseError);
          }
        };
        
        ws.onerror = (error) => {
          console.error(`WebSocket error for ${streamKey}:`, error);
          this.status = 'error';
          
          // Only reject if this is the initial connection attempt
          if (this.reconnectAttempts.get(streamKey) === 0) {
            reject(error);
          }
          
          this.attemptReconnect(streamKey);
        };
        
        ws.onclose = () => {
          console.log(`WebSocket closed: ${streamKey}`);
          this.status = 'disconnected';
          this.attemptReconnect(streamKey);
        };
      } catch (error) {
        console.error(`Error connecting to WebSocket:`, error);
        this.status = 'error';
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from a specific stream
   */
  public disconnect(streamName: string, symbol: string): void {
    const streamKey = this.getStreamKey(streamName, symbol);
    const ws = this.sockets.get(streamKey);
    
    if (ws) {
      ws.close();
      this.sockets.delete(streamKey);
      console.log(`Disconnected from ${streamKey}`);
    }
  }
  
  /**
   * Disconnect from all streams
   */
  public disconnectAll(): void {
    this.sockets.forEach((ws, streamKey) => {
      ws.close();
      console.log(`Disconnected from ${streamKey}`);
    });
    
    this.sockets.clear();
    this.status = 'disconnected';
    
    // Stop heartbeat check
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Subscribe to stream data
   */
  public subscribe(streamName: string, symbol: string, listener: (data: WebSocketStreamData) => void): void {
    const streamKey = this.getStreamKey(streamName, symbol);
    
    if (!this.listeners.has(streamKey)) {
      this.listeners.set(streamKey, []);
    }
    
    const streamListeners = this.listeners.get(streamKey)!;
    streamListeners.push(listener);
    
    // Connect if not already connected
    if (!this.sockets.has(streamKey) || this.sockets.get(streamKey)?.readyState !== WebSocket.OPEN) {
      this.connect(streamName, symbol)
        .catch(error => {
          console.error(`Error connecting to ${streamKey}:`, error);
          toast.error(`Failed to connect to ${symbol} ${streamName} stream`);
        });
    }
  }
  
  /**
   * Unsubscribe from stream data
   */
  public unsubscribe(streamName: string, symbol: string, listener: (data: any) => void): void {
    const streamKey = this.getStreamKey(streamName, symbol);
    
    if (this.listeners.has(streamKey)) {
      const streamListeners = this.listeners.get(streamKey)!;
      const index = streamListeners.indexOf(listener);
      
      if (index !== -1) {
        streamListeners.splice(index, 1);
      }
      
      // Disconnect if no more listeners
      if (streamListeners.length === 0) {
        this.disconnect(streamName, symbol);
      }
    }
  }
  
  /**
   * Get current connection status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }
  
  /**
   * Get the number of active connections
   */
  public getConnectionCount(): number {
    return this.sockets.size;
  }
  
  /**
   * Get all active streams
   */
  public getActiveStreams(): string[] {
    return Array.from(this.sockets.keys());
  }
  
  /**
   * Attempt to reconnect to a stream
   */
  private attemptReconnect(streamKey: string): void {
    const [streamName, symbol] = this.parseStreamKey(streamKey);
    const attempts = this.reconnectAttempts.get(streamKey) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnect attempts reached for ${streamKey}`);
      toast.error(`Failed to reconnect to ${symbol} data stream after ${attempts} attempts`);
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(1.5, attempts);
    console.log(`Attempting to reconnect to ${streamKey} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts.set(streamKey, attempts + 1);
      this.connect(streamName, symbol)
        .then(() => {
          toast.success(`Reconnected to ${symbol} data stream`);
          this.reconnectAttempts.set(streamKey, 0);
        })
        .catch(error => {
          console.error(`Reconnect attempt failed for ${streamKey}:`, error);
        });
    }, delay);
  }
  
  /**
   * Start heartbeat check to detect stale connections
   */
  private startHeartbeatCheck(): void {
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    const MAX_HEARTBEAT_AGE = 60000; // 1 minute
    
    this.heartbeatInterval = window.setInterval(() => {
      const now = Date.now();
      
      this.lastHeartbeat.forEach((lastHeartbeat, streamKey) => {
        if (now - lastHeartbeat > MAX_HEARTBEAT_AGE) {
          console.warn(`No heartbeat received for ${streamKey} in ${(now - lastHeartbeat) / 1000}s, reconnecting...`);
          
          const ws = this.sockets.get(streamKey);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
          
          this.sockets.delete(streamKey);
          
          // Trigger reconnect
          const [streamName, symbol] = this.parseStreamKey(streamKey);
          this.connect(streamName, symbol).catch(error => {
            console.error(`Error reconnecting to ${streamKey}:`, error);
          });
        }
      });
    }, HEARTBEAT_INTERVAL);
  }
  
  /**
   * Get a unique key for a stream
   */
  private getStreamKey(streamName: string, symbol: string): string {
    return `${streamName}_${symbol.toLowerCase()}`;
  }
  
  /**
   * Parse a stream key into its components
   */
  private parseStreamKey(streamKey: string): [string, string] {
    const [streamName, symbol] = streamKey.split('_');
    return [streamName, symbol];
  }
}

export default new WebSocketService();
