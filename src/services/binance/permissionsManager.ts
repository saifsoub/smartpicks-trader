
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { ApiPermissions } from './types';

export class PermissionsManager {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private readPermission: boolean = false;
  private tradingPermission: boolean = false;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.readPermission = readPermission;
    this.tradingPermission = tradingPermission;
  }
  
  public getApiPermissions(): ApiPermissions {
    return {
      read: this.readPermission,
      trading: this.tradingPermission
    };
  }
  
  public async detectApiPermissions(): Promise<ApiPermissions> {
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
}
