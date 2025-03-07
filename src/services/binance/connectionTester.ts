
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastTestTime: number = 0;
  private testingInProgress: boolean = false;
  private minTestInterval: number = 5000; // Minimum 5 seconds between tests
  private networkErrorCount: number = 0;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
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
    if (!this.apiClient.hasCredentials()) {
      this.logManager.addTradingLog("No API credentials configured for direct connection test", 'warning');
      return false;
    }
    
    try {
      this.testingInProgress = true;
      this.lastTestTime = Date.now();
      
      // Try to ping Binance API directly
      this.logManager.addTradingLog('Testing direct API connection to Binance...', 'info');
      
      // Try to get public data first which doesn't require authentication
      try {
        const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          signal: AbortSignal.timeout(15000), // Increased timeout further
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (timeResponse.ok) {
          this.logManager.addTradingLog('Direct API basic connectivity confirmed', 'success');
          // At minimum, we have basic connectivity
          return true;
        }
      } catch (timeError) {
        // Check if this is a network error
        this.logManager.addTradingLog(`Direct API time check failed: ${timeError instanceof Error ? timeError.message : String(timeError)}`, 'warning');
        
        if (this.isNetworkError(timeError)) {
          this.networkErrorCount++;
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 3) {
            this.logManager.addTradingLog("Multiple network errors detected. Please check your internet connection.", 'error');
            throw new Error("Network connectivity issue detected. Please check your internet connection.");
          }
        }
        // Continue with other checks
      }
      
      // Try a different public endpoint
      try {
        const priceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
          method: 'GET',
          signal: AbortSignal.timeout(15000),
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (priceResponse.ok) {
          this.logManager.addTradingLog('Direct API price check successful', 'success');
          this.networkErrorCount = 0; // Reset error count on success
          return true;
        }
      } catch (priceError) {
        if (this.isNetworkError(priceError)) {
          this.networkErrorCount++;
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 3) {
            this.logManager.addTradingLog("Multiple network errors detected. Please check your internet connection.", 'error');
            throw new Error("Network connectivity issue detected. Please check your internet connection.");
          }
        }
        this.logManager.addTradingLog(`Direct API price check failed: ${priceError instanceof Error ? priceError.message : String(priceError)}`, 'warning');
      }
      
      // If all checks fail
      this.logManager.addTradingLog('Direct API connection tests failed', 'warning');
      return false;
    } catch (error) {
      this.logManager.addTradingLog(`Direct API connection test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    } finally {
      this.testingInProgress = false;
    }
  }
  
  /**
   * Tests the proxy connection to Binance
   */
  public async testProxyConnection(): Promise<boolean> {
    if (!this.apiClient.hasCredentials()) {
      this.logManager.addTradingLog("No API credentials configured for proxy connection test", 'warning');
      return false;
    }
    
    try {
      this.testingInProgress = true;
      
      // Test using the simplest public endpoint
      this.logManager.addTradingLog('Testing proxy connection to Binance...', 'info');
      
      try {
        // Try testing with a public endpoint that doesn't require auth
        const tickerData = await this.apiClient.fetchWithProxy(
          'ticker/price',
          { symbol: 'BTCUSDT' },
          'GET',
          true
        );
        
        if (tickerData && tickerData.price) {
          this.logManager.addTradingLog('Proxy ticker check successful', 'success');
          this.networkErrorCount = 0; // Reset error count on success
          return true;
        }
      } catch (tickerError) {
        if (this.isNetworkError(tickerError)) {
          this.networkErrorCount++;
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 3) {
            this.logManager.addTradingLog("Multiple network errors detected. Please check your internet connection.", 'error');
            throw new Error("Network connectivity issue detected. Please check your internet connection.");
          }
        }
        this.logManager.addTradingLog(`Proxy ticker check failed: ${tickerError instanceof Error ? tickerError.message : String(tickerError)}`, 'warning');
      }
      
      // If that fails, try another simple endpoint
      try {
        const pingData = await this.apiClient.fetchWithProxy('ping', {}, 'GET', true);
        if (pingData) {
          this.logManager.addTradingLog('Proxy ping successful', 'success');
          this.networkErrorCount = 0; // Reset error count on success
          return true;
        }
      } catch (pingError) {
        if (this.isNetworkError(pingError)) {
          this.networkErrorCount++;
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 3) {
            this.logManager.addTradingLog("Multiple network errors detected. Please check your internet connection.", 'error');
            throw new Error("Network connectivity issue detected. Please check your internet connection.");
          }
        }
        this.logManager.addTradingLog(`Proxy ping failed: ${pingError instanceof Error ? pingError.message : String(pingError)}`, 'error');
      }
      
      return false;
    } catch (error) {
      this.logManager.addTradingLog(`Proxy connection test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    } finally {
      this.testingInProgress = false;
    }
  }
  
  /**
   * Checks if an error is likely a network connectivity issue
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Common network error patterns
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('internet') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Load failed') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ERR_CONNECTION')
    );
  }
  
  /**
   * Reset error counters
   */
  public resetErrorCounters(): void {
    this.networkErrorCount = 0;
  }
  
  /**
   * Validates API key format
   */
  public validateApiKeyFormat(apiKey: string): boolean {
    // Simple validation for Binance API key format
    // Real Binance API keys are typically 64 characters
    if (!apiKey) return false;
    
    // API keys should be at least 20 chars and contain only alphanumeric characters
    return apiKey.length >= 20 && /^[a-zA-Z0-9]+$/.test(apiKey);
  }
}
