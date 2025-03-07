
import { LogManager } from './logManager';

export class ReconnectionManager {
  private reconnectDelay: number = 2000; // Initial delay at 2 seconds
  private maxReconnectAttempts: number = 20; // Increased from 15 to 20 attempts
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private logManager: LogManager;
  private onReconnect: () => Promise<boolean>;
  private backoffFactor: number = 1.5; // Exponential backoff multiplier
  private maxDelay: number = 60000; // Maximum delay cap at 1 minute
  private reconnectInProgress: boolean = false;
  private lastReconnectAttempt: number = 0;
  private reconnectCooldown: number = 3000; // Reduced from 5s to 3s
  private connectionSuccessful: boolean = false;
  
  constructor(logManager: LogManager, onReconnect: () => Promise<boolean>) {
    this.logManager = logManager;
    this.onReconnect = onReconnect;
  }
  
  public scheduleReconnect(): void {
    if (this.reconnectInProgress) {
      console.log("Reconnection already in progress, not scheduling another");
      return;
    }
    
    // Check cooldown to prevent too frequent reconnections
    const now = Date.now();
    if (now - this.lastReconnectAttempt < this.reconnectCooldown) {
      console.log(`Reconnection attempt too soon, waiting for cooldown to expire (${Math.round((this.reconnectCooldown - (now - this.lastReconnectAttempt)) / 1000)}s)`);
      return;
    }
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    this.lastReconnectAttempt = now;
    
    // Use exponential backoff for more reliable reconnection
    const delay = this.calculateBackoffDelay();
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    this.logManager.addTradingLog(`Connection issue detected, retrying in ${Math.round(delay / 1000)} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
    
    this.reconnectTimer = window.setTimeout(() => this.executeReconnect(), delay);
  }
  
  private async executeReconnect(): Promise<void> {
    if (this.reconnectInProgress) {
      return;
    }
    
    this.reconnectInProgress = true;
    console.log(`Executing reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    try {
      const success = await this.onReconnect();
      this.connectionSuccessful = success;
      
      if (success) {
        this.logManager.addTradingLog("Reconnected to Binance API successfully", 'success');
        this.resetReconnectAttempts();
      } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Schedule another attempt if unsuccessful and under max attempts
        this.scheduleReconnect();
      } else {
        this.logManager.addTradingLog(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Please check your API settings or try again later.`, 'error');
      }
    } catch (error) {
      console.error("Error during reconnection attempt:", error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        this.logManager.addTradingLog(`Reconnection failed after ${this.maxReconnectAttempts} attempts. Please verify your network connection and API settings.`, 'error');
      }
    } finally {
      this.reconnectInProgress = false;
    }
  }
  
  private calculateBackoffDelay(): number {
    // Exponential backoff formula: initialDelay * (backoffFactor ^ attemptNumber)
    // With jitter to prevent thundering herd problem
    const calculatedDelay = this.reconnectDelay * Math.pow(this.backoffFactor, this.reconnectAttempts - 1);
    const jitter = Math.random() * 0.3 * calculatedDelay; // Add up to 30% random jitter
    return Math.min(calculatedDelay + jitter, this.maxDelay);
  }
  
  public cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.reconnectInProgress = false;
    }
    this.resetReconnectAttempts();
  }
  
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  public getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }
  
  public isConnectionSuccessful(): boolean {
    return this.connectionSuccessful;
  }
  
  public resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
    this.reconnectInProgress = false;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
