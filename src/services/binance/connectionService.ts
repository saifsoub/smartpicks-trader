
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { toast } from 'sonner';

export class ConnectionService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
  }
  
  public async testConnection(): Promise<boolean> {
    if (!this.apiClient.hasCredentials()) {
      console.warn("Cannot test connection: No credentials found");
      this.accountService.setConnectionStatus('disconnected');
      this.accountService.setLastConnectionError("No API credentials found");
      return false;
    }

    try {
      console.info('Testing API connection with credentials:', this.apiClient.getApiKey());
      
      let directApiWorks = false;
      let proxyWorks = false;
      
      try {
        console.log("Testing direct connection to Binance...");
        const response = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        console.log("Basic ping test response:", response.status, response.statusText);
        if (response.ok) {
          directApiWorks = true;
          const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
          if (tickerResponse.ok) {
            this.accountService.setConnectionStatus('connected');
          }
        }
      } catch (directError) {
        console.warn("Direct connection failed:", directError);
        directApiWorks = false;
      }
      
      if (this.apiClient.getProxyMode() || !directApiWorks) {
        try {
          console.log("Testing proxy connection...");
          const result = await this.apiClient.fetchWithProxy('ping');
          if (result && (result.success === true || result.serverTime)) {
            proxyWorks = true;
            if (!directApiWorks) {
              console.log("Proxy connection works but direct API failed");
            }
          }
        } catch (proxyError) {
          console.warn("Proxy connection failed:", proxyError);
          proxyWorks = false;
          
          if (this.apiClient.getProxyMode()) {
            // If proxy mode is enabled but proxy isn't working, notify the user
            toast.error("Proxy connection failed. The proxy server might be temporarily unavailable.");
            this.logManager.addTradingLog("Proxy connection failed. This may be a temporary issue with our proxy server.", 'error');
          }
        }
      }
      
      if (directApiWorks || proxyWorks) {
        this.accountService.setConnectionStatus('connected');
        this.accountService.setLastConnectionError(null);
        
        // Mark the API as connected even if we can't detect permissions fully
        const isConnected = true;
        
        // Try to detect API permissions but don't fail if it doesn't work
        try {
          const permissions = await this.accountService.detectApiPermissions();
          
          if (!permissions.read) {
            console.warn("API key doesn't have read permission or can't verify it");
            this.logManager.addTradingLog("We couldn't verify if your API key has read permissions. You may still be able to use basic functionality.", 'info');
            this.accountService.setLastConnectionError("Connected to API, but couldn't verify your API permissions. You can still use basic features, but portfolio data may be limited.");
          } else if (!proxyWorks && this.apiClient.getProxyMode()) {
            this.accountService.setLastConnectionError("API connected, but proxy mode is having issues. You may need to disable proxy mode if you don't need it.");
          }
        } catch (permissionError) {
          console.warn("Failed to detect API permissions:", permissionError);
          // Don't change connection status on permission detection failure
        }
        
        return isConnected;
      } else {
        this.accountService.setConnectionStatus('disconnected');
        if (this.apiClient.getProxyMode()) {
          this.accountService.setLastConnectionError("Both direct API and proxy connections failed. Check your network connection and API credentials.");
        } else {
          this.accountService.setLastConnectionError("API connection failed. Try enabling proxy mode in settings, which helps bypass CORS restrictions.");
        }
        return false;
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      this.accountService.setLastConnectionError(error instanceof Error ? error.message : String(error));
      this.accountService.setConnectionStatus('disconnected');
      return false;
    }
  }
}
