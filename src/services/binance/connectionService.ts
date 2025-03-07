
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
      
      // Test both connection methods
      const directApiWorks = await this.connectionTester.testDirectConnection();
      let proxyWorks = false;
      
      // Test proxy connection if direct failed or proxy mode is enabled
      if (this.apiClient.getProxyMode() || !directApiWorks) {
        proxyWorks = await this.connectionTester.testProxyConnection();
        
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
  
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }
  
  private async handleConnectionResults(directApiWorks: boolean, proxyWorks: boolean): Promise<boolean> {
    if (directApiWorks || proxyWorks) {
      this.reconnectionManager.resetReconnectAttempts();
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
        
        // Suggest solutions
        toast.error("Connection failed. Try again later or check your API credentials.");
        
        // Provide more specific guidance
        this.logManager.addTradingLog("Make sure you've created an API key on Binance with proper permissions and IP restrictions.", 'info');
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
