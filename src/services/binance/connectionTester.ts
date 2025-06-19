
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
   * Enhanced direct API connection test with better error handling
   */
  public async testDirectConnection(): Promise<boolean> {
    this.testingInProgress = true;
    this.lastTestTime = Date.now();
    
    try {
      console.log('Testing direct connection to Binance API...');
      
      // Test multiple direct endpoints for better reliability
      const tests = [
        fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          cache: 'no-store'
        }),
        fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          cache: 'no-store'
        })
      ];
      
      const results = await Promise.allSettled(tests);
      const hasSuccess = results.some(result => 
        result.status === 'fulfilled' && result.value.ok
      );
      
      if (hasSuccess) {
        this.logManager.addTradingLog('Direct API connection test successful', 'success');
        this.resetNetworkErrorCount();
        this.testingInProgress = false;
        return true;
      } else {
        throw new Error('All direct API tests failed');
      }
    } catch (error) {
      console.error('Direct API connection test failed:', error);
      this.logManager.addTradingLog(`Direct API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.incrementNetworkErrorCount();
      this.testingInProgress = false;
      return false;
    }
  }
  
  /**
   * Enhanced proxy connection test with multiple fallbacks
   */
  public async testProxyConnection(): Promise<boolean> {
    this.testingInProgress = true;
    
    try {
      console.log('Testing proxy connection to Binance API...');
      
      // Test multiple proxy endpoints
      const proxyUrls = [
        'https://binance-proxy.vercel.app/api/ping',
        // Fallback to direct API time endpoint as proxy alternative
        'https://api.binance.com/api/v3/time'
      ];
      
      let lastError = null;
      
      for (const url of proxyUrls) {
        try {
          console.log(`Testing proxy endpoint: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            signal: AbortSignal.timeout(12000),
            cache: 'no-store'
          });
          
          if (response.ok) {
            console.log(`Proxy test successful for: ${url}`);
            this.logManager.addTradingLog('Proxy connection test successful', 'success');
            this.resetNetworkErrorCount();
            this.testingInProgress = false;
            return true;
          }
        } catch (error) {
          console.warn(`Proxy test failed for ${url}:`, error);
          lastError = error;
        }
      }
      
      throw lastError || new Error('All proxy tests failed');
    } catch (error) {
      console.error('Proxy connection test failed:', error);
      this.logManager.addTradingLog(`Proxy connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.incrementNetworkErrorCount();
      this.testingInProgress = false;
      return false;
    }
  }
  
  /**
   * Enhanced API key format validation
   */
  public validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Binance API keys are typically 64 characters long and alphanumeric
    const apiKeyPattern = /^[a-zA-Z0-9]{64}$/;
    const isValidFormat = apiKeyPattern.test(apiKey);
    
    if (!isValidFormat) {
      console.warn('API key format validation failed');
      this.logManager.addTradingLog('Invalid API key format detected', 'error');
    }
    
    return isValidFormat;
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
  
  /**
   * Get connection quality assessment
   */
  public getConnectionQuality(): 'good' | 'poor' | 'bad' {
    if (this.networkErrorCount === 0) return 'good';
    if (this.networkErrorCount < 3) return 'poor';
    return 'bad';
  }
}
