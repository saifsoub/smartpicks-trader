
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

    try {
      console.info('Testing API connection with credentials:', this.apiClient.getApiKey());
      
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
          } else {
            toast.error("Proxy connection failed after multiple attempts. Consider disabling proxy mode if you don't need it.");
            this.logManager.addTradingLog("Proxy connection failed after multiple attempts", 'warning');
            
            if (directApiWorks) {
              toast.info("Falling back to direct API for basic market data.");
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
  
  private async handleConnectionResults(directApiWorks: boolean, proxyWorks: boolean): Promise<boolean> {
    if (directApiWorks || proxyWorks) {
      this.reconnectionManager.resetReconnectAttempts();
      this.accountService.setConnectionStatus('connected');
      this.accountService.setLastConnectionError(null);
      
      // Try to detect API permissions but don't fail if it doesn't work
      try {
        const permissions = await this.accountService.detectApiPermissions();
        
        if (!permissions.read) {
          console.warn("API key doesn't have read permission or can't verify it");
          this.logManager.addTradingLog("We couldn't verify if your API key has read permissions. Basic market data will still be available.", 'info');
          this.accountService.setLastConnectionError("Connected to API, but couldn't verify your API permissions. You can still use basic features, but portfolio data may be limited.");
        } else if (!proxyWorks && this.apiClient.getProxyMode()) {
          this.accountService.setLastConnectionError("API connected, but proxy mode is having issues. You may need to disable proxy mode if you don't need it.");
        } else {
          // Everything working properly
          this.logManager.addTradingLog("Successfully connected to Binance API", 'success');
        }
      } catch (permissionError) {
        console.warn("Failed to detect API permissions:", permissionError);
        // Don't change connection status on permission detection failure
      }
      
      return true;
    } else {
      this.accountService.setConnectionStatus('disconnected');
      
      if (this.apiClient.getProxyMode()) {
        const errorMessage = "Both direct API and proxy connections failed. Check your network connection and API credentials.";
        this.accountService.setLastConnectionError(errorMessage);
        this.logManager.addTradingLog(errorMessage, 'error');
        
        // Suggest solutions
        toast.error("Connection failed. Try disabling proxy mode in settings or check your credentials.");
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
}
