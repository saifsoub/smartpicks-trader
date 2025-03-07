
import { LogManager } from './logManager';

export class ReconnectionManager {
  private reconnectDelay: number = 5000; // 5 seconds between reconnection attempts
  private maxReconnectAttempts: number = 3;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private logManager: LogManager;
  private onReconnect: () => Promise<boolean>;
  
  constructor(logManager: LogManager, onReconnect: () => Promise<boolean>) {
    this.logManager = logManager;
    this.onReconnect = onReconnect;
  }
  
  public scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.logManager.addTradingLog(`Connection failed, retrying in ${delay / 1000} seconds...`, 'info');
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Executing reconnection attempt ${this.reconnectAttempts}`);
      this.onReconnect().then(success => {
        if (success) {
          this.logManager.addTradingLog("Reconnected to API successfully", 'success');
        }
      });
    }, delay);
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
