
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { toast } from 'sonner';

export class ConnectionService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastConnectionAttempt: number = 0;
  private reconnectDelay: number = 5000; // 5 seconds between reconnection attempts
  private maxReconnectAttempts: number = 3;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  
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

    // Prevent multiple connection tests in quick succession
    const now = Date.now();
    if (now - this.lastConnectionAttempt < 3000) { // 3 second cooldown
      console.log("Connection test throttled, try again in a few seconds");
      return this.accountService.getConnectionStatus() === 'connected';
    }
    
    this.lastConnectionAttempt = now;
    this.accountService.setConnectionStatus('unknown');

    try {
      console.info('Testing API connection with credentials:', this.apiClient.getApiKey());
      
      let directApiWorks = false;
      let proxyWorks = false;
      
      // Step 1: Test direct connection to Binance API
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
            console.log("Direct API ticker test successful");
            this.accountService.setConnectionStatus('connected');
          }
        }
      } catch (directError) {
        console.warn("Direct connection failed:", directError);
        directApiWorks = false;
      }
      
      // Step 2: Test proxy connection if direct failed or proxy mode is enabled
      if (this.apiClient.getProxyMode() || !directApiWorks) {
        try {
          console.log("Testing proxy connection...");
          const result = await this.apiClient.fetchWithProxy('ping');
          if (result && (result.success === true || result.serverTime)) {
            proxyWorks = true;
            console.log("Proxy connection successful");
            
            if (!directApiWorks) {
              console.log("Proxy connection works but direct API failed");
              this.logManager.addTradingLog("Using proxy connection for API access", 'info');
            }
          }
        } catch (proxyError) {
          console.warn("Proxy connection failed:", proxyError);
          proxyWorks = false;
          
          // Schedule retry if proxy mode is enabled but proxy fails
          if (this.apiClient.getProxyMode() && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else if (this.apiClient.getProxyMode()) {
            // If max reconnection attempts reached, notify the user
            toast.error("Proxy connection failed after multiple attempts. Consider disabling proxy mode if you don't need it.");
            this.logManager.addTradingLog("Proxy connection failed after multiple attempts", 'warning');
            
            if (directApiWorks) {
              toast.info("Falling back to direct API for basic market data.");
              this.logManager.addTradingLog("Using direct API for basic market data. Portfolio data may be limited.", 'info');
            }
          }
        }
      }
      
      // Step 3: Handle connection results
      if (directApiWorks || proxyWorks) {
        this.reconnectAttempts = 0; // Reset reconnect attempts on success
        this.accountService.setConnectionStatus('connected');
        this.accountService.setLastConnectionError(null);
        
        // Mark the API as connected even if we can't detect permissions fully
        const isConnected = true;
        
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
        
        return isConnected;
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

    } catch (error) {
      console.error('Error testing connection:', error);
      this.accountService.setLastConnectionError(error instanceof Error ? error.message : String(error));
      this.accountService.setConnectionStatus('disconnected');
      
      this.logManager.addTradingLog(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
      
      return false;
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.logManager.addTradingLog(`Connection failed, retrying in ${delay / 1000} seconds...`, 'info');
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Executing reconnection attempt ${this.reconnectAttempts}`);
      this.testConnection().then(success => {
        if (success) {
          toast.success("Reconnected to API successfully");
          this.logManager.addTradingLog("Reconnected to API successfully", 'success');
        }
      });
    }, delay);
  }
  
  public cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.reconnectAttempts = 0;
    }
  }
}
