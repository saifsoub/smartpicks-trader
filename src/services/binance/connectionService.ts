import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { toast } from 'sonner';
import { ReconnectionManager } from './reconnectionManager';
import { ConnectionTester } from './connectionTester';

export class ConnectionService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private reconnectionManager: ReconnectionManager;
  private connectionTester: ConnectionTester;
  private lastPermissionCheck: number = 0;
  private permissionCheckInterval: number = 120000; // 2 minutes
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
    this.connectionTester = new ConnectionTester(apiClient, logManager, accountService);
    this.reconnectionManager = new ReconnectionManager(logManager, this.testConnection.bind(this));
  }
  
  public async testConnection(): Promise<boolean> {
    if (!this.connectionTester.canTest()) {
      return this.accountService.getConnectionStatus() === 'connected';
    }

    this.accountService.setConnectionStatus('unknown');
    this.logManager.addTradingLog("Testing connection to Binance API...", 'info');

    try {
      console.info('Testing API connection with credentials:', this.maskApiKey(this.apiClient.getApiKey()));
      
      // Check if we have credentials before proceeding
      if (!this.apiClient.hasCredentials()) {
        this.logManager.addTradingLog("Missing API credentials. Please configure your Binance API keys.", 'warning');
        this.accountService.setConnectionStatus('disconnected');
        this.accountService.setLastConnectionError("Missing API credentials. Please configure your Binance API keys.");
        return false;
      }
      
      // Validate API key format before attempting connection
      const apiKey = this.apiClient.getApiKey();
      if (!this.connectionTester.validateApiKeyFormat(apiKey)) {
        this.logManager.addTradingLog("Invalid API key format. Please check your API key.", 'error');
        this.accountService.setConnectionStatus('disconnected');
        this.accountService.setLastConnectionError("Invalid API key format. Please check your Binance API key.");
        toast.error("Invalid API key format. Please check your Binance API key.");
        return false;
      }
      
      // Test both connection methods
      let directApiWorks = false;
      try {
        directApiWorks = await this.connectionTester.testDirectConnection();
      } catch (directError) {
        // Check if this is a network error
        if (directError instanceof Error && directError.message.includes("Network connectivity")) {
          this.logManager.addTradingLog("Network connectivity issue detected. Please check your internet connection.", 'error');
          this.accountService.setConnectionStatus('disconnected');
          this.accountService.setLastConnectionError("Network connectivity issue detected. Please check your internet connection.");
          toast.error("Network connectivity issue detected. Please check your internet connection.");
          return false;
        }
        // Other errors will continue to proxy test
      }
      
      // Always log the direct API status
      if (directApiWorks) {
        this.logManager.addTradingLog("Direct API connection successful", 'success');
      } else {
        this.logManager.addTradingLog("Direct API connection failed", 'warning');
      }
      
      let proxyWorks = false;
      
      // Test proxy connection if direct failed or proxy mode is enabled
      if (this.apiClient.getProxyMode() || !directApiWorks) {
        try {
          proxyWorks = await this.connectionTester.testProxyConnection();
        } catch (proxyError) {
          // Check if this is a network error
          if (proxyError instanceof Error && proxyError.message.includes("Network connectivity")) {
            this.logManager.addTradingLog("Network connectivity issue detected. Please check your internet connection.", 'error');
            this.accountService.setConnectionStatus('disconnected');
            this.accountService.setLastConnectionError("Network connectivity issue detected. Please check your internet connection.");
            toast.error("Network connectivity issue detected. Please check your internet connection.");
            return false;
          }
        }
        
        if (proxyWorks) {
          this.logManager.addTradingLog("Proxy connection successful", 'success');
        } else {
          this.logManager.addTradingLog("Proxy connection failed", 'warning');
        }
        
        // Handle proxy connection results
        if (!proxyWorks && this.apiClient.getProxyMode()) {
          if (this.reconnectionManager.getReconnectAttempts() < this.reconnectionManager.getMaxReconnectAttempts()) {
            this.reconnectionManager.scheduleReconnect();
            this.logManager.addTradingLog("Proxy connection failed, scheduling reconnection", 'warning');
          } else {
            toast.error("Proxy connection failed after multiple attempts. Consider using direct API mode or check your network.");
            this.logManager.addTradingLog("Proxy connection failed after multiple attempts", 'warning');
            
            if (directApiWorks) {
              toast.info("Using direct API for basic market data. Some features may be limited due to CORS restrictions.");
              this.logManager.addTradingLog("Using direct API for basic market data. Portfolio data may be limited.", 'info');
            }
          }
        }
      }
      
      // Verify API credentials even if connection test passed
      if (directApiWorks || proxyWorks) {
        try {
          this.logManager.addTradingLog("Verifying API credentials...", 'info');
          const verificationResult = await this.verifyApiCredentials();
          
          if (!verificationResult.valid) {
            this.logManager.addTradingLog(`API key verification failed: ${verificationResult.reason}`, 'error');
            this.accountService.setConnectionStatus('disconnected');
            this.accountService.setLastConnectionError(`API key verification failed: ${verificationResult.reason}`);
            toast.error(`API key verification failed: ${verificationResult.reason}`);
            return false;
          }
        } catch (verificationError) {
          // Only log as warning since we got a successful connection
          this.logManager.addTradingLog(`API key verification check failed: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`, 'warning');
        }
      }
      
      // Handle overall connection results
      return this.handleConnectionResults(directApiWorks, proxyWorks);

    } catch (error) {
      console.error('Error testing connection:', error);
      this.accountService.setLastConnectionError(error instanceof Error ? error.message : String(error));
      this.accountService.setConnectionStatus('disconnected');
      
      this.logManager.addTradingLog(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
      
      return false;
    }
  }
  
  /**
   * Verify if API credentials are valid and have sufficient permissions
   */
  private async verifyApiCredentials(): Promise<{valid: boolean, reason?: string}> {
    try {
      // Try a simple authenticated endpoint to verify credentials
      if (this.apiClient.getProxyMode()) {
        // Through proxy
        try {
          await this.apiClient.fetchWithProxy('account', { recvWindow: '5000' }, 'GET');
          return { valid: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          // Check for specific error messages indicating invalid credentials
          if (errorMsg.includes('Invalid API-key') || 
              errorMsg.includes('API-key format invalid') ||
              errorMsg.includes('Signature') ||
              errorMsg.includes('authorization') ||
              errorMsg.includes('Invalid credentials')) {
            return { 
              valid: false, 
              reason: 'Invalid API key or secret. Please check your credentials.' 
            };
          }
          
          // We got some other error, but can't confirm it's due to invalid credentials
          // Let's treat connection as potentially successful
          return { valid: true };
        }
      } else {
        // Direct API - verify key format only since we can't easily test auth
        // due to CORS restrictions on signed endpoints
        const apiKey = this.apiClient.getApiKey();
        if (!this.connectionTester.validateApiKeyFormat(apiKey)) {
          return { 
            valid: false, 
            reason: 'Invalid API key format. Please check your Binance API key.' 
          };
        }
        return { valid: true };
      }
    } catch (error) {
      console.error('Error verifying API credentials:', error);
      throw error;
    }
  }
  
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }
  
  private async handleConnectionResults(directApiWorks: boolean, proxyWorks: boolean): Promise<boolean> {
    if (directApiWorks || proxyWorks) {
      this.reconnectionManager.resetReconnectAttempts();
      this.connectionTester.resetNetworkErrorCount();
      this.accountService.setConnectionStatus('connected');
      this.accountService.setLastConnectionError(null);
      
      // Auto-select the best connection method
      if (this.apiClient.getProxyMode() && !proxyWorks && directApiWorks) {
        this.logManager.addTradingLog("Proxy connection failed but direct API works. Consider disabling proxy mode.", 'info');
      } else if (!this.apiClient.getProxyMode() && !directApiWorks && proxyWorks) {
        this.logManager.addTradingLog("Direct API limited. Consider enabling proxy mode for better access.", 'info');
      }
      
      // Try to detect API permissions only if enough time has passed since last check
      const now = Date.now();
      if (now - this.lastPermissionCheck > this.permissionCheckInterval) {
        this.lastPermissionCheck = now;
        try {
          const permissions = await this.accountService.detectApiPermissions();
          
          if (!permissions.read) {
            console.warn("API key doesn't have read permission or can't verify it");
            this.logManager.addTradingLog("We couldn't verify if your API key has read permissions. Basic market data will still be available.", 'info');
            toast.warning("Connected, but API keys may have limited permissions. For full functionality, please ensure your API keys have read access.");
            this.accountService.setLastConnectionError("Connected to API, but couldn't verify your API permissions. You can still use basic features, but portfolio data may be limited.");
          } else if (!permissions.trading && directApiWorks) {
            this.logManager.addTradingLog("Connected successfully with READ permission, but no TRADING permission detected.", 'info');
            toast.info("Connected with read-only access. To enable trading, update your API key permissions.");
          } else if (!proxyWorks && this.apiClient.getProxyMode()) {
            this.accountService.setLastConnectionError("API connected, but proxy mode is having issues. You may need to disable proxy mode if you don't need it.");
          } else {
            // Everything working properly
            this.logManager.addTradingLog("Successfully connected to Binance API with all required permissions", 'success');
            toast.success("Successfully connected to Binance API");
          }
        } catch (permissionError) {
          console.warn("Failed to detect API permissions:", permissionError);
          // Don't change connection status on permission detection failure
          this.logManager.addTradingLog("Connected to API, but couldn't verify permissions. Some features may be limited.", 'warning');
        }
      }
      
      return true;
    } else {
      this.accountService.setConnectionStatus('disconnected');
      
      if (this.apiClient.getProxyMode()) {
        const errorMessage = "Both direct API and proxy connections failed. Check your network connection and API credentials.";
        this.accountService.setLastConnectionError(errorMessage);
        this.logManager.addTradingLog(errorMessage, 'error');
        
        // Provide more specific guidance
        toast.error("Connection failed. Please verify your API keys are correct and valid.");
        this.logManager.addTradingLog("Make sure you've entered the correct API key and secret, and that they are active on Binance. Also check your internet connection.", 'info');
      } else {
        const errorMessage = "API connection failed. Try enabling proxy mode in settings, which helps bypass CORS restrictions.";
        this.accountService.setLastConnectionError(errorMessage);
        this.logManager.addTradingLog(errorMessage, 'error');
        
        // Suggest enabling proxy
        toast.error("Connection failed. Try enabling proxy mode in settings.");
      }
      
      return false;
    }
  }
  
  public cancelReconnect(): void {
    this.reconnectionManager.cancelReconnect();
  }
  
  // Perform a quick connection test without changing status
  public async quickConnectionTest(): Promise<{directWorks: boolean, proxyWorks: boolean}> {
    try {
      const directWorks = await this.connectionTester.testDirectConnection();
      let proxyWorks = false;
      
      if (this.apiClient.getProxyMode()) {
        proxyWorks = await this.connectionTester.testProxyConnection();
      }
      
      return { directWorks, proxyWorks };
    } catch (error) {
      console.error("Quick connection test failed:", error);
      return { directWorks: false, proxyWorks: false };
    }
  }
}
