
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
  private minTestInterval: number = 2000; // Reduced to 2 seconds between tests
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
      
      // Try multiple Binance endpoints with different timeouts for better reliability
      const endpoints = [
        { url: 'https://api.binance.com/api/v3/time', timeout: 15000 },
        { url: 'https://api.binance.com/api/v3/ping', timeout: 10000 },
        { url: 'https://api.binance.com/api/v3/exchangeInfo', timeout: 20000 },
        { url: 'https://api.binance.us/api/v3/ping', timeout: 10000 } // Try binance.us as fallback
      ];
      
      for (const endpoint of endpoints) {
        try {
          this.logManager.addTradingLog(`Testing Binance connection via ${endpoint.url}...`, 'info');
          
          const response = await fetch(endpoint.url, {
            method: 'GET',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: AbortSignal.timeout(endpoint.timeout)
          });
          
          if (response.ok) {
            this.logManager.addTradingLog(`Binance connection successful via ${endpoint.url}`, 'success');
            this.resetNetworkErrorCount(); // Reset network error counter
            return true;
          }
        } catch (error) {
          this.logManager.addTradingLog(`Endpoint ${endpoint.url} check failed: ${error instanceof Error ? error.message : String(error)}`, 'warning');
          
          if (this.isNetworkError(error)) {
            this.recordNetworkError(`Failed to connect to ${endpoint.url}`);
            this.logManager.addTradingLog(`Network error detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          }
          
          // Continue with next endpoint
        }
      }
      
      // If all Binance checks fail but general internet is working
      if (hasInternetAccess) {
        this.logManager.addTradingLog('Internet is working, but Binance API is unreachable. This might be due to region blocking, firewall settings, or a temporary Binance outage.', 'warning');
        
        // Test if it's a CORS issue
        this.logManager.addTradingLog('Testing if this might be a CORS restriction issue...', 'info');
        
        // Suggest enabling proxy mode if direct access fails
        if (!this.apiClient.getProxyMode()) {
          this.logManager.addTradingLog('Direct API access failed. This might be due to CORS restrictions. Consider enabling proxy mode in settings.', 'info');
        }
      }
      
      // All checks failed
      this.logManager.addTradingLog('All direct API connection tests failed', 'error');
      return false;
    } catch (error) {
      this.logManager.addTradingLog(`Direct API connection test error: ${error instanceof Error ? error.message : String(error)}`, 'error');
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
      
      // Test using multiple endpoints through proxy
      this.logManager.addTradingLog('Testing proxy connection to Binance...', 'info');
      
      // Array of endpoints to test with proxy
      const proxyEndpoints = [
        { endpoint: 'ticker/price', params: { symbol: 'BTCUSDT' }, method: 'GET' },
        { endpoint: 'ping', params: {}, method: 'GET' },
        { endpoint: 'time', params: {}, method: 'GET' }
      ];
      
      for (const endpoint of proxyEndpoints) {
        try {
          this.logManager.addTradingLog(`Testing proxy with ${endpoint.endpoint}...`, 'info');
          
          const data = await this.apiClient.fetchWithProxy(
            endpoint.endpoint,
            endpoint.params,
            endpoint.method as 'GET',
            true
          );
          
          if (data) {
            this.logManager.addTradingLog(`Proxy connection successful with ${endpoint.endpoint}`, 'success');
            this.resetNetworkErrorCount(); // Reset error count on success
            return true;
          }
        } catch (error) {
          this.logManager.addTradingLog(`Proxy endpoint ${endpoint.endpoint} failed: ${error instanceof Error ? error.message : String(error)}`, 'warning');
          
          if (this.isNetworkError(error)) {
            this.recordNetworkError(`Failed to connect to Binance API proxy: ${endpoint.endpoint}`);
            this.logManager.addTradingLog(`Network error detected (${this.networkErrorCount} consecutive errors)`, 'warning');
          }
          
          // Continue to next endpoint
        }
      }
      
      // If we have internet but all proxy tests fail
      if (hasInternetAccess) {
        // Try to diagnose if it's an API key issue
        this.logManager.addTradingLog('Checking if this might be an API key configuration issue...', 'info');
        
        const apiKey = this.apiClient.getApiKey();
        if (!this.validateApiKeyFormat(apiKey)) {
          this.logManager.addTradingLog('Your API key format appears to be invalid. Please check your API key configuration.', 'error');
        } else {
          this.logManager.addTradingLog('Your API key format looks valid, but authentication is failing. Check your secret key and ensure your API key is active on Binance.', 'warning');
        }
      }
      
      // All proxy checks failed
      this.logManager.addTradingLog('All proxy connection tests failed', 'error');
      return false;
    } catch (error) {
      this.logManager.addTradingLog(`Proxy connection test error: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    } finally {
      this.testingInProgress = false;
    }
  }
  
  /**
   * Comprehensive check for different kinds of connectivity issues
   */
  public async diagnoseConnectionIssues(): Promise<{
    hasInternet: boolean;
    canReachBinance: boolean;
    apiKeyValid: boolean;
    errorDetails: string;
  }> {
    let result = {
      hasInternet: false,
      canReachBinance: false,
      apiKeyValid: false,
      errorDetails: ""
    };
    
    try {
      // Step 1: Check internet connectivity
      result.hasInternet = await this.checkInternetConnectivity();
      if (!result.hasInternet) {
        result.errorDetails = "No internet connection detected. Please check your network settings.";
        return result;
      }
      
      // Step 2: Check Binance reachability (without authentication)
      try {
        const response = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(10000)
        });
        
        result.canReachBinance = response.ok;
      } catch (error) {
        result.canReachBinance = false;
        
        // Check if it's likely a CORS issue
        if (error instanceof TypeError && 
            (error.message.includes("Failed to fetch") || 
             error.message.includes("Network request failed") ||
             error.message.includes("Load failed"))) {
          result.errorDetails = "Binance API is unreachable due to browser security restrictions (CORS). Try enabling proxy mode.";
        } else {
          result.errorDetails = "Cannot reach Binance API. The service might be blocked in your region or there's a temporary outage.";
        }
      }
      
      // Step 3: Check API key validity
      if (result.canReachBinance || this.apiClient.getProxyMode()) {
        const apiKey = this.apiClient.getApiKey();
        
        // Basic format validation
        if (!this.validateApiKeyFormat(apiKey)) {
          result.apiKeyValid = false;
          result.errorDetails = "API key format is invalid. Please check your API key.";
          return result;
        }
        
        // Try authenticated request
        try {
          if (this.apiClient.getProxyMode()) {
            // Test through proxy
            await this.apiClient.fetchWithProxy('account', { recvWindow: '5000' }, 'GET');
            result.apiKeyValid = true;
          } else {
            // Can't easily test auth with direct API due to CORS
            // Just assume it might be valid if format check passed
            result.apiKeyValid = true;
            result.errorDetails = "API key format looks valid, but couldn't verify authentication due to CORS restrictions.";
          }
        } catch (error) {
          result.apiKeyValid = false;
          
          // Check for specific error messages
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          if (errorMsg.includes('Invalid API-key') || 
              errorMsg.includes('API-key format invalid') ||
              errorMsg.includes('Signature') ||
              errorMsg.includes('authorization') ||
              errorMsg.includes('Invalid credentials')) {
            result.errorDetails = "Invalid API key or secret. Please check your credentials.";
          } else {
            result.errorDetails = "Authentication failed. Your API key may be inactive or have insufficient permissions.";
          }
        }
      }
      
      return result;
    } catch (error) {
      result.errorDetails = `Unexpected error during diagnosis: ${error instanceof Error ? error.message : String(error)}`;
      return result;
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
        'https://httpbin.org/status/200',
        'https://1.1.1.1/cdn-cgi/trace'
      ];
      
      // Try each endpoint with a proper timeout
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
