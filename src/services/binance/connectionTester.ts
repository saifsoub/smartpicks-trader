
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { StorageManager } from './storageManager';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastTestTime: number = 0;
  private testingInProgress: boolean = false;
  private minTestInterval: number = 5000; // 5 seconds between tests
  private networkErrorCount: number = 0;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
    
    // Load error count from storage
    this.networkErrorCount = StorageManager.getNetworkErrorCount();
  }
  
  /**
   * Checks if we can perform a connection test based on time interval
   */
  public canTest(): boolean {
    const now = Date.now();
    return !this.testingInProgress && (now - this.lastTestTime >= this.minTestInterval);
  }
  
  /**
   * Tests the direct API connection to Binance
   */
  public async testDirectConnection(): Promise<boolean> {
    this.testingInProgress = true;
    this.lastTestTime = Date.now();
    
    try {
      console.log('Testing direct connection to Binance API...');
      
      // Test basic ping endpoint
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Direct API test failed: ${response.status} ${response.statusText}`);
      }
      
      this.logManager.addTradingLog('Direct API connection test successful', 'success');
      this.resetNetworkErrorCount();
      this.testingInProgress = false;
      return true;
    } catch (error) {
      console.error('Direct API connection test failed:', error);
      this.logManager.addTradingLog(`Direct API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.incrementNetworkErrorCount();
      this.testingInProgress = false;
      return false;
    }
  }
  
  /**
   * Tests the proxy connection to Binance
   */
  public async testProxyConnection(): Promise<boolean> {
    this.testingInProgress = true;
    
    try {
      console.log('Testing proxy connection to Binance API...');
      
      // Test through proxy
      const response = await fetch('https://binance-proxy.vercel.app/api/ping', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`Proxy test failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.logManager.addTradingLog('Proxy connection test successful', 'success');
      this.resetNetworkErrorCount();
      this.testingInProgress = false;
      return true;
    } catch (error) {
      console.error('Proxy connection test failed:', error);
      this.logManager.addTradingLog(`Proxy connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.incrementNetworkErrorCount();
      this.testingInProgress = false;
      return false;
    }
  }
  
  /**
   * Validate API key format
   */
  public validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Binance API keys are typically 64 characters long and alphanumeric
    const apiKeyPattern = /^[a-zA-Z0-9]{64}$/;
    return apiKeyPattern.test(apiKey);
  }
  
  /**
   * Increment network error count
   */
  private incrementNetworkErrorCount(): void {
    this.networkErrorCount++;
    StorageManager.saveNetworkErrorCount(this.networkErrorCount);
    StorageManager.saveLastNetworkError(new Date().toISOString());
  }
  
  /**
   * Reset network error counters
   */
  public resetNetworkErrorCount(): void {
    this.networkErrorCount = 0;
    StorageManager.saveNetworkErrorCount(0);
    StorageManager.saveLastNetworkError(null);
  }
  
  /**
   * Get current network error count
   */
  public getNetworkErrorCount(): number {
    return this.networkErrorCount;
  }
}
