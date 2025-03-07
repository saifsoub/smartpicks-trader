
import { LogManager } from './logManager';

export class ReconnectionManager {
  private reconnectDelay: number = 5000; // 5 seconds between reconnection attempts
  private maxReconnectAttempts: number = 5; // Increased from 3 to 5
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private logManager: LogManager;
  private onReconnect: () => Promise<boolean>;
  private backoffFactor: number = 1.5; // Add exponential backoff
  
  constructor(logManager: LogManager, onReconnect: () => Promise<boolean>) {
    this.logManager = logManager;
    this.onReconnect = onReconnect;
  }
  
  public scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    // Use exponential backoff for more reliable reconnection
    const delay = this.calculateBackoffDelay();
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.logManager.addTradingLog(`Connection failed, retrying in ${Math.round(delay / 1000)} seconds...`, 'info');
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Executing reconnection attempt ${this.reconnectAttempts}`);
      this.onReconnect().then(success => {
        if (success) {
          this.logManager.addTradingLog("Reconnected to API successfully", 'success');
          this.resetReconnectAttempts(); // Reset attempts on success
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Schedule another attempt if unsuccessful and under max attempts
          this.scheduleReconnect();
        } else {
          this.logManager.addTradingLog("Max reconnection attempts reached. Please check your API settings.", 'error');
        }
      });
    }, delay);
  }
  
  private calculateBackoffDelay(): number {
    // Exponential backoff formula: initialDelay * (backoffFactor ^ attemptNumber)
    // Cap at 30 seconds
    const calculatedDelay = this.reconnectDelay * Math.pow(this.backoffFactor, this.reconnectAttempts - 1);
    return Math.min(calculatedDelay, 30000); // Cap at 30 seconds
  }
  
  public cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.reconnectAttempts = 0;
    }
  }
  
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  public getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }
  
  public resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}
