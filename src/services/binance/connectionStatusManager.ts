
import { ConnectionStatus } from './types';
import { toast } from 'sonner';

export class ConnectionStatusManager {
  private connectionStatus: ConnectionStatus = 'unknown';
  private lastConnectionError: string | null = null;
  private connectionErrors: number = 0;
  private maxConnectionErrors: number = 5;
  private lastSuccessfulConnection: number = 0;
  
  constructor() {
    // Initialize with last successful connection time if available
    const lastConnection = localStorage.getItem('lastSuccessfulConnection');
    if (lastConnection) {
      this.lastSuccessfulConnection = parseInt(lastConnection);
    }
  }
  
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  public setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    
    if (status === 'connected') {
      this.recordSuccessfulConnection();
    }
  }
  
  public getLastConnectionError(): string | null {
    return this.lastConnectionError;
  }
  
  public setLastConnectionError(error: string | null): void {
    this.lastConnectionError = error;
  }
  
  public incrementConnectionErrors(): number {
    this.connectionErrors++;
    return this.connectionErrors;
  }
  
  public resetConnectionErrors(): void {
    this.connectionErrors = 0;
  }
  
  public getConnectionErrors(): number {
    return this.connectionErrors;
  }
  
  public getMaxConnectionErrors(): number {
    return this.maxConnectionErrors;
  }
  
  public recordSuccessfulConnection(): void {
    this.lastSuccessfulConnection = Date.now();
    localStorage.setItem('lastSuccessfulConnection', this.lastSuccessfulConnection.toString());
    this.resetConnectionErrors();
  }
  
  public getLastSuccessfulConnection(): number {
    return this.lastSuccessfulConnection;
  }
  
  public getHoursSinceLastConnection(): number {
    return (Date.now() - this.lastSuccessfulConnection) / (1000 * 60 * 60);
  }
  
  public checkConnectionTimeAndNotify(): void {
    const hoursSinceLastConnection = this.getHoursSinceLastConnection();
    if (hoursSinceLastConnection > 24) {
      toast.warning("No successful connection in over 24 hours. Consider updating your API keys or checking network.");
    }
  }
}
