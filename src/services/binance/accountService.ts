
import { BinanceApiClient } from './apiClient';
import { BinanceBalance, BalanceInfo, ConnectionStatus } from './types';
import { LogManager } from './logManager';
import { toast } from 'sonner';
import { formatBalanceData, getDefaultAccountInfo, checkHasRealBalances } from './accountUtils';
import { PermissionsManager } from './permissionsManager';

export class AccountService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private permissionsManager: PermissionsManager;
  private connectionStatus: ConnectionStatus = 'unknown';
  private lastConnectionError: string | null = null;
  private defaultTradingPairs: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'XRPUSDT'];
  private lastAccountInfoTimestamp: number = 0;
  private cachedAccountInfo: { balances: BinanceBalance[] } | null = null;
  private isRetrievingAccountInfo: boolean = false;
  private readOnlyMode: boolean = false;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.permissionsManager = new PermissionsManager(apiClient, logManager);
  }
  
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.permissionsManager.setApiPermissions(readPermission, tradingPermission);
    // Update read-only mode based on permissions
    this.readOnlyMode = readPermission && !tradingPermission;
    console.log(`Account service mode: ${this.readOnlyMode ? 'Read-only' : 'Full access'}`);
  }
  
  public getApiPermissions() {
    return this.permissionsManager.getApiPermissions();
  }
  
  public async detectApiPermissions() {
    const permissions = await this.permissionsManager.detectApiPermissions();
    // Update read-only mode based on detected permissions
    this.readOnlyMode = permissions.read && !permissions.trading;
    return permissions;
  }
  
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  public setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    
    if (status === 'connected') {
      toast.success("Successfully connected to Binance API");
    } else if (status === 'disconnected') {
      toast.error("Disconnected from Binance API");
    }
  }
  
  public getLastConnectionError(): string | null {
    return this.lastConnectionError;
  }
  
  public setLastConnectionError(error: string | null): void {
    this.lastConnectionError = error;
  }
  
  public getDefaultTradingPairs(): string[] {
    return [...this.defaultTradingPairs];
  }
  
  public isReadOnlyMode(): boolean {
    return this.readOnlyMode;
  }

  public async getAccountInfo(): Promise<{ balances: BinanceBalance[] }> {
    if (this.isRetrievingAccountInfo) {
      console.log("Already retrieving account info, returning cached info or waiting");
      if (this.cachedAccountInfo) {
        return this.cachedAccountInfo;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!this.isRetrievingAccountInfo) {
        return this.getAccountInfo();
      } else {
        return getDefaultAccountInfo(this.defaultTradingPairs);
      }
    }
    
    const now = Date.now();
    if (this.cachedAccountInfo && now - this.lastAccountInfoTimestamp < 30000) {
      console.log("Using cached account info (less than 30 seconds old)");
      return this.cachedAccountInfo;
    }
    
    if (!this.apiClient.hasCredentials()) {
      console.error("Cannot get account info: No credentials found");
      throw new Error('API credentials not configured');
    }

    try {
      this.isRetrievingAccountInfo = true;
      console.log("Attempting to fetch account info from Binance");
      
      if (this.connectionStatus !== 'connected') {
        throw new Error('Cannot fetch account info: Connection test failed. Please check your API credentials.');
      }

      if (this.apiClient.getProxyMode()) {
        try {
          // Add recvWindow parameter for better handling of time differences
          const result = await this.apiClient.fetchWithProxy('account', { recvWindow: '10000' });
          
          if (result && Array.isArray(result.balances)) {
            console.log("Successfully retrieved account balances via proxy");
            this.cachedAccountInfo = result;
            this.lastAccountInfoTimestamp = now;
            this.isRetrievingAccountInfo = false;
            return result;
          }
        } catch (proxyError) {
          console.warn("Failed to fetch account info via proxy:", proxyError);
          
          // Try alternative endpoint for account data
          try {
            const userData = await this.apiClient.fetchWithProxy('userDataStream', {}, 'POST');
            if (userData && userData.listenKey) {
              console.log("Successfully created user data stream, trying snapshot");
              // If we can create a user data stream, we have API access but might not have
              // permission for full account data. Generate a placeholder response.
              const placeholderData = getDefaultAccountInfo(this.defaultTradingPairs);
              placeholderData.isLimitedAccess = true;
              this.cachedAccountInfo = placeholderData;
              this.lastAccountInfoTimestamp = now;
              this.isRetrievingAccountInfo = false;
              return placeholderData;
            }
          } catch (userDataError) {
            console.warn("User data stream creation failed:", userDataError);
          }
        }
      }
      
      try {
        const endpoint = 'https://api.binance.com/api/v3/account';
        // Get server time first for accurate timestamp
        const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
        const serverTimeData = await serverTimeResponse.json();
        const timestamp = serverTimeData.serverTime || Date.now();
        
        // Add recvWindow parameter for better handling of time differences
        const queryString = `timestamp=${timestamp}&recvWindow=10000`;
        
        const signature = await this.apiClient.generateSignature(queryString);
        const url = `${endpoint}?${queryString}&signature=${signature}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.apiClient.getApiKey()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.balances)) {
            console.log("Successfully retrieved account balances via direct API");
            this.cachedAccountInfo = data;
            this.lastAccountInfoTimestamp = now;
            this.isRetrievingAccountInfo = false;
            return data;
          }
        } else {
          const errorData = await response.text();
          console.error("API Error:", response.status, errorData);
          
          // Check if it's a permissions issue
          if (errorData.includes("API-key has no permission")) {
            console.log("API key has limited permissions, using fallback data");
            // Mark that we have limited permissions and use placeholder data
            this.readOnlyMode = true;
            const placeholderData = getDefaultAccountInfo(this.defaultTradingPairs);
            placeholderData.isLimitedAccess = true;
            this.cachedAccountInfo = placeholderData;
            this.lastAccountInfoTimestamp = now;
            this.isRetrievingAccountInfo = false;
            return placeholderData;
          }
          
          throw new Error(`API Error: ${response.status} - ${errorData}`);
        }
      } catch (directError) {
        console.warn("Failed to fetch account info via direct API:", directError);
        throw directError;
      }
      
      throw new Error("Failed to retrieve account information from Binance");
    } catch (error) {
      console.error('Error fetching account info:', error);
      this.logManager.addTradingLog("Failed to fetch account info: " + (error instanceof Error ? error.message : String(error)), 'error');
      
      if (this.cachedAccountInfo) {
        this.isRetrievingAccountInfo = false;
        return this.cachedAccountInfo;
      }
      
      this.isRetrievingAccountInfo = false;
      return getDefaultAccountInfo(this.defaultTradingPairs);
    }
  }

  public async getAccountBalance(): Promise<Record<string, BalanceInfo>> {
    console.log("Getting account balance");
    if (!this.apiClient.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const { read } = await this.detectApiPermissions();
      
      if (!read) {
        console.warn("API key doesn't have read permission or proxy isn't working.");
        this.logManager.addTradingLog("Your API key doesn't have permission to read account data or proxy mode is needed.", 'error');
        
        if (!this.apiClient.getProxyMode()) {
          this.logManager.addTradingLog("Try enabling proxy mode in settings to access your account data securely.", 'info');
        }
        
        throw new Error("API key doesn't have read permission");
      }
      
      const accountInfo = await this.getAccountInfo();
      console.log("Account info received:", accountInfo);
      
      if (accountInfo && accountInfo.balances) {
        const balanceMap = formatBalanceData(accountInfo.balances);
        
        if (Object.keys(balanceMap).length === 0 && this.connectionStatus === 'connected') {
          console.warn("Only zero balances received - likely limited API access or empty account");
          this.logManager.addTradingLog("Connection successful, but no non-zero balances found in your account.", 'info');
          
          throw new Error("No non-zero balances found in your account");
        } else if (Object.keys(balanceMap).length > 0) {
          this.logManager.addTradingLog(`Successfully retrieved ${Object.keys(balanceMap).length} assets with non-zero balances`, 'success');
        }
        
        console.log("Processed balance map:", balanceMap);
        this.connectionStatus = 'connected';
        return balanceMap;
      }
      
      throw new Error("Failed to retrieve account balances");
    } catch (error) {
      console.error('Error fetching account balance:', error);
      this.logManager.addTradingLog("Failed to fetch account balance: " + (error instanceof Error ? error.message : String(error)), 'error');
      
      if (error instanceof Error && 
         (error.message.includes("API key") || 
          error.message.includes("connection") || 
          error.message.includes("network"))) {
        this.connectionStatus = 'disconnected';
      }
      
      throw error;
    }
  }
  
  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    if (!this.apiClient.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    const { trading } = await this.detectApiPermissions();
    if (!trading) {
      throw new Error('Your API key does not have trading permissions. Please update your API key settings on Binance.');
    }

    try {
      if (this.apiClient.getProxyMode()) {
        const params = {
          symbol,
          side,
          type: 'MARKET',
          quantity
        };
        
        console.log(`Placing ${side} market order for ${quantity} ${symbol} via proxy`);
        this.logManager.addTradingLog(`${side} ${quantity} ${symbol} at market price`, 'info');
        
        const result = await this.apiClient.fetchWithProxy('order', params, 'POST');
        this.logManager.addTradingLog(`Order ${result.orderId || 'unknown'} ${result.status || 'PENDING'}`, 'success');
        return result;
      } else {
        const endpoint = 'https://api.binance.com/api/v3/order';
        const timestamp = Date.now();
        const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
        
        const signature = await this.apiClient.generateSignature(queryString);
        const url = `${endpoint}?${queryString}&signature=${signature}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': this.apiClient.getApiKey()
          }
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        this.logManager.addTradingLog(`Order ${result.orderId || 'unknown'} ${result.status || 'PENDING'}`, 'success');
        return result;
      }
    } catch (error) {
      console.error('Error placing market order:', error);
      this.logManager.addTradingLog(`Failed to place ${side} order for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }
}
