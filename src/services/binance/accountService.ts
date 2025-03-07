import { BinanceApiClient } from './apiClient';
import { BinanceBalance, BalanceInfo } from './types';
import { LogManager } from './logManager';
import { toast } from 'sonner';

export class AccountService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private readPermission: boolean = false;
  private tradingPermission: boolean = false;
  private connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  private lastConnectionError: string | null = null;
  private defaultTradingPairs: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'XRPUSDT'];
  private lastAccountInfoTimestamp: number = 0;
  private cachedAccountInfo: { balances: BinanceBalance[] } | null = null;
  private isRetrievingAccountInfo: boolean = false;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.readPermission = readPermission;
    this.tradingPermission = tradingPermission;
  }
  
  public getApiPermissions(): { read: boolean, trading: boolean } {
    return {
      read: this.readPermission,
      trading: this.tradingPermission
    };
  }
  
  public getConnectionStatus(): 'connected' | 'disconnected' | 'unknown' {
    return this.connectionStatus;
  }
  
  public setConnectionStatus(status: 'connected' | 'disconnected' | 'unknown'): void {
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

  public async detectApiPermissions(): Promise<{ read: boolean, trading: boolean }> {
    if (!this.apiClient.hasCredentials()) {
      return { read: false, trading: false };
    }

    try {
      let readPermission = false;
      
      try {
        const publicEndpoint = 'https://api.binance.com/api/v3/ticker/price';
        const response = await fetch(publicEndpoint);
        
        if (response.ok) {
          readPermission = true;
          console.log("Basic API connectivity successful");
        }
        
        if (this.apiClient.getProxyMode()) {
          try {
            const accountResult = await this.apiClient.fetchWithProxy('account');
            if (accountResult && accountResult.balances) {
              readPermission = true;
              console.log("Read permission confirmed via proxy:", readPermission);
            }
          } catch (proxyError) {
            console.warn("Proxy account check failed:", proxyError);
            try {
              const endpoint = 'https://api.binance.com/api/v3/account';
              const timestamp = Date.now();
              const queryString = `timestamp=${timestamp}`;
              
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
                  readPermission = true;
                  console.log("Read permission confirmed via direct API");
                }
              }
            } catch (directError) {
              console.warn("Direct API account check also failed:", directError);
            }
          }
        } else {
          try {
            const endpoint = 'https://api.binance.com/api/v3/account';
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
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
                readPermission = true;
                console.log("Read permission confirmed via direct API");
              }
            }
          } catch (directError) {
            console.warn("Direct API account check failed:", directError);
          }
        }
      } catch (error) {
        console.warn("Read permission test failed:", error);
        readPermission = false;
      }

      let tradingPermission = false;
      try {
        if (this.apiClient.getProxyMode()) {
          try {
            const orderResult = await this.apiClient.fetchWithProxy('allOrders', { symbol: 'BTCUSDT', limit: '1' });
            if (Array.isArray(orderResult)) {
              tradingPermission = true;
              console.log("Trading permission confirmed via proxy");
            }
          } catch (proxyError) {
            console.warn("Proxy trading check failed:", proxyError);
            
            try {
              const endpoint = 'https://api.binance.com/api/v3/allOrders';
              const timestamp = Date.now();
              const queryString = `symbol=BTCUSDT&limit=1&timestamp=${timestamp}`;
              
              const signature = await this.apiClient.generateSignature(queryString);
              const url = `${endpoint}?${queryString}&signature=${signature}`;
              
              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'X-MBX-APIKEY': this.apiClient.getApiKey()
                }
              });
              
              if (response.ok) {
                tradingPermission = true;
                console.log("Trading permission confirmed via direct API");
              }
            } catch (directError) {
              console.warn("Direct API trading check failed:", directError);
            }
          }
        } else {
          try {
            const endpoint = 'https://api.binance.com/api/v3/allOrders';
            const timestamp = Date.now();
            const queryString = `symbol=BTCUSDT&limit=1&timestamp=${timestamp}`;
            
            const signature = await this.apiClient.generateSignature(queryString);
            const url = `${endpoint}?${queryString}&signature=${signature}`;
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'X-MBX-APIKEY': this.apiClient.getApiKey()
              }
            });
            
            if (response.ok) {
              tradingPermission = true;
              console.log("Trading permission confirmed via direct API");
            }
          } catch (directError) {
            console.warn("Direct API trading check failed:", directError);
          }
        }
      } catch (error) {
        console.warn("Trading permission test failed:", error);
      }

      this.setApiPermissions(readPermission, tradingPermission);
      this.logManager.addTradingLog(`API permissions detected - Read: ${readPermission ? 'Yes' : 'No'}, Trading: ${tradingPermission ? 'Yes' : 'No'}`, 'info');
      
      return { read: readPermission, trading: tradingPermission };
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      return this.getApiPermissions();
    }
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
        return this.getDefaultAccountInfo();
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
          const result = await this.apiClient.fetchWithProxy('account');
          
          if (result && Array.isArray(result.balances)) {
            console.log("Successfully retrieved account balances via proxy");
            this.cachedAccountInfo = result;
            this.lastAccountInfoTimestamp = now;
            this.isRetrievingAccountInfo = false;
            return result;
          }
        } catch (proxyError) {
          console.warn("Failed to fetch account info via proxy:", proxyError);
        }
      }
      
      try {
        const endpoint = 'https://api.binance.com/api/v3/account';
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        
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
      return this.getDefaultAccountInfo();
    }
  }
  
  private getDefaultAccountInfo(): { balances: BinanceBalance[] } {
    console.warn("Using default balances as fallback");
    const defaultBalances = this.defaultTradingPairs.map(pair => {
      const asset = pair.replace('USDT', '');
      return { asset, free: '0', locked: '0' };
    }).concat({ asset: 'USDT', free: '0', locked: '0' });
    
    return { balances: defaultBalances };
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
        const balanceMap: Record<string, BalanceInfo> = {};
        
        for (const balance of accountInfo.balances) {
          if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
            balanceMap[balance.asset] = {
              available: balance.free,
              total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
              usdValue: 0 // Will be filled in by binanceService
            };
          }
        }
        
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
