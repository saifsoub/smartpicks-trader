
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastConnectionAttempt: number = 0;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
  }
  
  public canTest(): boolean {
    if (!this.apiClient.hasCredentials()) {
      console.warn("Cannot test connection: No credentials found");
      this.accountService.setConnectionStatus('disconnected');
      this.accountService.setLastConnectionError("No API credentials found");
      return false;
    }

    // Prevent multiple connection tests in quick succession
    const now = Date.now();
    if (now - this.lastConnectionAttempt < 3000) { // 3 second cooldown
      console.log("Connection test throttled, try again in a few seconds");
      return false;
    }
    
    this.lastConnectionAttempt = now;
    return true;
  }
  
  public async testDirectConnection(): Promise<boolean> {
    try {
      console.log("Testing direct connection to Binance...");
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      console.log("Basic ping test response:", response.status, response.statusText);
      if (response.ok) {
        const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        if (tickerResponse.ok) {
          console.log("Direct API ticker test successful");
          return true;
        }
      }
      return false;
    } catch (directError) {
      console.warn("Direct connection failed:", directError);
      return false;
    }
  }
  
  public async testProxyConnection(): Promise<boolean> {
    try {
      console.log("Testing proxy connection...");
      const result = await this.apiClient.fetchWithProxy('ping');
      if (result && (result.success === true || result.serverTime)) {
        console.log("Proxy connection successful");
        return true;
      }
      return false;
    } catch (proxyError) {
      console.warn("Proxy connection failed:", proxyError);
      return false;
    }
  }
  
  public updateLastConnectionAttempt(): void {
    this.lastConnectionAttempt = Date.now();
  }
}
