
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
  private minTestInterval: number = 5000; // Minimum 5 seconds between tests
  private networkErrorCount: number = 0;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
    
    // Load previous network error count
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
    if (!this.apiClient.hasCredentials()) {
      this.logManager.addTradingLog("No API credentials configured for direct connection test", 'warning');
      return false;
    }
    
    try {
      this.testingInProgress = true;
      this.lastTestTime = Date.now();
      
      // Try to ping Binance API directly
      this.logManager.addTradingLog('Testing direct API connection to Binance...', 'info');
      
      // Check general internet connectivity first
      const hasInternetAccess = await this.checkInternetConnectivity();
      if (!hasInternetAccess) {
        this.logManager.addTradingLog("Internet connectivity issues detected. Your device appears to be offline.", 'error');
        this.recordNetworkError("Internet connectivity issues detected");
        throw new Error("Network connectivity issue detected. Your device appears to be offline.");
      }
      
      // Try to get public data first which doesn't require authentication
      try {
        const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          signal: AbortSignal.timeout(20000), // Increased timeout to 20 seconds
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (timeResponse.ok) {
          this.logManager.addTradingLog('Direct API basic connectivity confirmed', 'success');
          this.resetNetworkErrorCount(); // Reset network error counter
          // At minimum, we have basic connectivity
          return true;
        }
      } catch (timeError) {
        // Check if this is a network error
        this.logManager.addTradingLog(`Direct API time check failed: ${timeError instanceof Error ? timeError.message : String(timeError)}`, 'warning');
        
        if (this.isNetworkError(timeError)) {
          this.recordNetworkError("Failed to connect to Binance API");
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 2) { // Reduced threshold from 3 to 2
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
          signal: AbortSignal.timeout(20000), // Increased timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (priceResponse.ok) {
          this.logManager.addTradingLog('Direct API price check successful', 'success');
          this.resetNetworkErrorCount(); // Reset error count on success
          return true;
        }
      } catch (priceError) {
        if (this.isNetworkError(priceError)) {
          this.recordNetworkError("Failed to connect to Binance API");
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 2) { // Reduced threshold from 3 to 2
            this.logManager.addTradingLog("Multiple network errors detected. Please check your internet connection.", 'error');
            throw new Error("Network connectivity issue detected. Please check your internet connection.");
          }
        }
        this.logManager.addTradingLog(`Direct API price check failed: ${priceError instanceof Error ? priceError.message : String(priceError)}`, 'warning');
      }
      
      // If all checks fail but general internet is working, it might be specific to Binance
      if (hasInternetAccess) {
        this.logManager.addTradingLog('Internet is working, but Binance API seems unreachable. This may be a temporary issue with Binance.', 'warning');
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
      
      // Check general internet connectivity first
      const hasInternetAccess = await this.checkInternetConnectivity();
      if (!hasInternetAccess) {
        this.logManager.addTradingLog("Internet connectivity issues detected. Your device appears to be offline.", 'error');
        this.recordNetworkError("Internet connectivity issues detected");
        throw new Error("Network connectivity issue detected. Your device appears to be offline.");
      }
      
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
          this.resetNetworkErrorCount(); // Reset error count on success
          return true;
        }
      } catch (tickerError) {
        if (this.isNetworkError(tickerError)) {
          this.recordNetworkError("Failed to connect to Binance API proxy");
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 2) { // Reduced threshold from 3 to 2
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
          this.resetNetworkErrorCount(); // Reset error count on success
          return true;
        }
      } catch (pingError) {
        if (this.isNetworkError(pingError)) {
          this.recordNetworkError("Failed to connect to Binance API proxy");
          this.logManager.addTradingLog(`Network connectivity issue detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          
          if (this.networkErrorCount >= 2) { // Reduced threshold from 3 to 2
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
   * Check for general internet connectivity
   */
  private async checkInternetConnectivity(): Promise<boolean> {
    try {
      // Try multiple endpoints to improve reliability
      const endpoints = [
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://httpbin.org/status/200'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            console.log(`Internet connectivity confirmed via ${endpoint}`);
            return true;
          }
        } catch {
          // Try next endpoint
          continue;
        }
      }
      
      // All checks failed
      console.log('All internet connectivity checks failed');
      return false;
    } catch (error) {
      console.error('Error checking internet connectivity:', error);
      return false;
    }
  }
  
  /**
   * Checks if an error is likely a network connectivity issue
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Enhanced network error patterns
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('internet') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Load failed') || // Common in browser fetch errors
      errorMessage.includes('timeout') ||
      errorMessage.includes('ERR_CONNECTION') ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('network is offline') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('AbortError') ||
      errorMessage.includes('net::') // Chrome network error prefix
    );
  }
  
  /**
   * Record a network error and increment the counter
   */
  private recordNetworkError(errorMessage: string): void {
    this.networkErrorCount++;
    StorageManager.saveNetworkErrorCount(this.networkErrorCount);
    StorageManager.saveLastNetworkError(errorMessage);
  }
  
  /**
   * Reset error counters
   */
  public resetNetworkErrorCount(): void {
    this.networkErrorCount = 0;
    StorageManager.resetNetworkErrorCount();
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
