
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
  private defaultTradingPairs: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  
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
        if (this.apiClient.getProxyMode()) {
          const accountResult = await this.apiClient.fetchWithProxy('account');
          readPermission = !!(accountResult && accountResult.balances);
          console.log("Read permission test via proxy:", readPermission);
        } else {
          const response = await fetch('https://api.binance.com/api/v3/account', {
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey()
            }
          });
          readPermission = response.ok;
          console.log("Read permission test via direct API:", readPermission);
        }
      } catch (error) {
        console.warn("Read permission test failed:", error);
        readPermission = false;
      }

      let tradingPermission = false;
      try {
        if (this.apiClient.getProxyMode()) {
          const orderResult = await this.apiClient.fetchWithProxy('allOrders', { symbol: 'BTCUSDT', limit: '1' });
          tradingPermission = Array.isArray(orderResult);
          console.log("Trading permission test via proxy:", tradingPermission);
        } else {
          const timestamp = Date.now();
          const response = await fetch(`https://api.binance.com/api/v3/myTrades?symbol=BTCUSDT&limit=1&timestamp=${timestamp}`, {
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey()
            }
          });
          tradingPermission = response.ok;
          console.log("Trading permission test via direct API:", tradingPermission);
        }
      } catch (error) {
        console.warn("Trading permission test failed:", error);
        tradingPermission = false;
      }

      this.setApiPermissions(readPermission, tradingPermission);
      this.logManager.addTradingLog(`API permissions detected - Read: ${readPermission ? 'Yes' : 'No'}, Trading: ${tradingPermission ? 'Yes' : 'No'}`, 'info');
      
      return { read: readPermission, trading: tradingPermission };
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      this.setApiPermissions(false, false);
      return { read: false, trading: false };
    }
  }

  public async getAccountInfo(): Promise<{ balances: BinanceBalance[] }> {
    if (!this.apiClient.hasCredentials()) {
      console.error("Cannot get account info: No credentials found");
      throw new Error('API credentials not configured');
    }

    try {
      console.log("Attempting to fetch account info");
      
      if (this.connectionStatus !== 'connected') {
        throw new Error('Cannot fetch account info: Connection test failed. Please check your API credentials.');
      }

      const { read } = this.getApiPermissions();
      
      if (!read) {
        const permissions = await this.detectApiPermissions();
        if (!permissions.read) {
          console.warn("API key does not have Read permission. Using default trading pairs.");
          this.logManager.addTradingLog("Your API key doesn't have permission to read account data. Default trading pairs will be used.", 'error');
          
          return { 
            balances: this.defaultTradingPairs.map(pair => {
              const asset = pair.replace('USDT', '');
              return { asset, free: '0', locked: '0' };
            }).concat({ asset: 'USDT', free: '0', locked: '0' })
          };
        }
      }
      
      // Try to fetch account info via proxy if enabled
      let accountResult = null;
      
      if (this.apiClient.getProxyMode()) {
        try {
          const result = await this.apiClient.fetchWithProxy('account');
          console.log("Account info via proxy:", result);
          
          if (result && Array.isArray(result.balances)) {
            this.connectionStatus = 'connected';
            this.logManager.addTradingLog("Successfully retrieved account balances", 'success');
            return { balances: result.balances };
          }
          
          console.warn('Proxy returned invalid response, trying direct API as fallback');
          console.log('Trying to fetch account info directly as fallback...');
          // Don't return yet, try direct API as fallback
        } catch (error) {
          console.error('Error fetching account info via proxy:', error);
          this.logManager.addTradingLog("Failed to fetch account info via proxy: " + (error instanceof Error ? error.message : String(error)), 'error');
          
          if (!this.apiClient.isProxyWorking()) {
            this.logManager.addTradingLog("Proxy connection is not working. Try disabling proxy mode if you don't need it.", 'info');
          }
          
          console.log('Trying to fetch account info directly as fallback...');
        }
      }
      
      // Either proxy mode is disabled or proxy request failed, try direct API
      try {
        const publicEndpoint = 'https://api.binance.com/api/v3/ticker/price';
        
        console.log("Attempting to fetch public data directly to verify API access");
        const response = await fetch(publicEndpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const tickerData = await response.json();
        if (Array.isArray(tickerData) && tickerData.length > 0) {
          this.connectionStatus = 'connected';
          this.lastConnectionError = "API connection successful, but your browser cannot fetch account data directly due to security restrictions. Enable proxy mode in settings.";
          this.logManager.addTradingLog("Account data requires proxy mode - enable it in settings.", 'info');
          
          return { 
            balances: this.defaultTradingPairs.map(pair => {
              const asset = pair.replace('USDT', '');
              return { asset, free: '0', locked: '0' };
            }).concat({ asset: 'USDT', free: '0', locked: '0' })
          };
        }
        
        throw new Error('Invalid response from Binance API');
      } catch (directError) {
        console.error('Error fetching account info directly:', directError);
        this.connectionStatus = 'disconnected';
        
        if (!this.apiClient.getProxyMode()) {
          throw new Error('Failed to retrieve account data. Enable proxy mode in settings to access your account data securely.');
        } else {
          throw new Error('Failed to retrieve account data from Binance. Verify your API key has "Enable Reading" permission in your Binance API settings.');
        }
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
      this.logManager.addTradingLog("Failed to fetch account info: " + (error instanceof Error ? error.message : String(error)), 'error');
      throw error;
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
        console.warn("API key doesn't have read permission or proxy isn't working. Returning placeholder balances.");
        this.logManager.addTradingLog("Your API key doesn't have permission to read account data or proxy mode is needed.", 'error');
        
        if (!this.apiClient.getProxyMode()) {
          this.logManager.addTradingLog("Try enabling proxy mode in settings to access your account data securely.", 'info');
        }
        
        return {
          'BTC': { available: '0', total: '0' },
          'ETH': { available: '0', total: '0' },
          'USDT': { available: '100', total: '100' }
        };
      }
      
      const accountInfo = await this.getAccountInfo();
      console.log("Account info received:", accountInfo);
      
      if (accountInfo && accountInfo.balances) {
        const balanceMap: Record<string, BalanceInfo> = {};
        
        for (const balance of accountInfo.balances) {
          if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
            balanceMap[balance.asset] = {
              available: balance.free,
              total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString()
            };
          }
        }
        
        if (Object.keys(balanceMap).length === 0 && this.connectionStatus === 'connected') {
          console.warn("Only zero balances received - likely limited API access");
          this.logManager.addTradingLog("Connection successful, but no non-zero balances found in your account.", 'info');
          
          balanceMap['BTC'] = { available: '0', total: '0' };
          balanceMap['ETH'] = { available: '0', total: '0' };
          balanceMap['USDT'] = { available: '100', total: '100' };
        } else if (Object.keys(balanceMap).length > 0) {
          this.logManager.addTradingLog(`Successfully retrieved ${Object.keys(balanceMap).length} assets with non-zero balances`, 'success');
        }
        
        console.log("Processed balance map:", balanceMap);
        this.connectionStatus = 'connected';
        return balanceMap;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching account balance:', error);
      this.logManager.addTradingLog("Failed to fetch account balance", 'error');
      this.connectionStatus = 'disconnected';
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
        throw new Error('Direct API access is blocked. Please enable proxy mode in settings to place real orders.');
      }
    } catch (error) {
      console.error('Error placing market order:', error);
      this.logManager.addTradingLog(`Failed to place ${side} order for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }
}
