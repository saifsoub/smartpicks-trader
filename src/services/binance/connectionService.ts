
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
        }
      }
      
      if (directApiWorks || proxyWorks) {
        this.accountService.setConnectionStatus('connected');
        this.accountService.setLastConnectionError(null);
        
        // Detect API permissions and store the result
        const permissions = await this.accountService.detectApiPermissions();
        
        if (!permissions.read) {
          console.warn("API key doesn't have read permission");
          this.logManager.addTradingLog("Your API key doesn't have permission to read account data. Please update your API key permissions in Binance.", 'error');
          this.accountService.setLastConnectionError("Connected to API, but your key doesn't have account data access. Please enable 'Enable Reading' permission for your API key on Binance.");
          
          // Use toast notification to make it more visible
          toast.error("API key missing read permission. Enable 'Enable Reading' in your Binance API settings.");
        } else if (!proxyWorks && this.apiClient.getProxyMode()) {
          this.accountService.setLastConnectionError("API connected, but proxy mode is having issues. You may need to disable proxy mode if you don't need it.");
        }
        
        return true;
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
