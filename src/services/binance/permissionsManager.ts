
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { ApiPermissions } from './types';
import { toast } from 'sonner';

export class PermissionsManager {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private readPermission: boolean = false;
  private tradingPermission: boolean = false;
  private lastPermissionCheck: number = 0;
  private permissionCheckCooldown: number = 60000; // 1 minute
  
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

    // Prevent frequent permission checks
    const now = Date.now();
    if (now - this.lastPermissionCheck < this.permissionCheckCooldown) {
      console.log("Using cached API permissions to prevent frequent checks");
      return this.getApiPermissions();
    }
    
    this.lastPermissionCheck = now;
    
    try {
      console.log("Detecting API permissions...");
      this.logManager.addTradingLog("Checking API key permissions...", 'info');
      
      // Initialize both permissions to false
      let readPermission = false;
      let tradingPermission = false;
      
      // First check if we can read basic public data
      try {
        const publicEndpoint = 'https://api.binance.com/api/v3/ticker/price';
        const response = await fetch(publicEndpoint);
        
        if (response.ok) {
          console.log("Basic API connectivity test successful");
        }
      } catch (publicError) {
        console.warn("Basic API connectivity test failed:", publicError);
      }
      
      // Test account/balance access
      readPermission = await this.testReadPermission();
      
      // Only test trading permission if we have read permission
      if (readPermission) {
        tradingPermission = await this.testTradingPermission();
      }
      
      // Update permissions
      this.setApiPermissions(readPermission, tradingPermission);
      
      // Log the detected permissions
      this.logManager.addTradingLog(
        `API permissions detected: ${readPermission ? 'Read ✅' : 'Read ❌'}, ${tradingPermission ? 'Trading ✅' : 'Trading ❌'}`,
        'info'
      );
      
      // Show user feedback for permissions
      if (!readPermission) {
        toast.warning("Your API key doesn't have read permissions. Update your API key on Binance.");
      } else if (!tradingPermission) {
        toast.info("Your API key has read-only access. For trading, update permissions on Binance.");
      } else {
        toast.success("API key has all required permissions");
      }
      
      return { read: readPermission, trading: tradingPermission };
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      return this.getApiPermissions();
    }
  }
  
  private async testReadPermission(): Promise<boolean> {
    try {
      console.log("Testing read permission...");
      
      if (this.apiClient.getProxyMode()) {
        try {
          // First try with proxy
          const accountResult = await this.apiClient.fetchWithProxy('account', {}, 'GET', true);
          if (accountResult && Array.isArray(accountResult.balances)) {
            console.log("Read permission confirmed via proxy:", accountResult.balances.length, "balances");
            return true;
          }
        } catch (proxyError) {
          console.warn("Proxy account check failed:", proxyError);
          
          // Try alternative proxy endpoint
          try {
            const assetResult = await this.apiClient.fetchWithProxy('capital/config/getall', {}, 'GET', true);
            if (assetResult && Array.isArray(assetResult)) {
              console.log("Read permission confirmed via alternative proxy endpoint");
              return true;
            }
          } catch (altProxyError) {
            console.warn("Alternative proxy endpoint check failed:", altProxyError);
          }
          
          // Try direct API as fallback
          return this.testDirectAccountAccess();
        }
      } else {
        // Direct API test
        return this.testDirectAccountAccess();
      }
      
      return false;
    } catch (error) {
      console.warn("Read permission test error:", error);
      return false;
    }
  }
  
  private async testDirectAccountAccess(): Promise<boolean> {
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
          console.log("Read permission confirmed via direct API");
          return true;
        }
      } else {
        const errorText = await response.text();
        console.warn("Direct API account check failed with status:", response.status, errorText);
      }
      
      return false;
    } catch (directError) {
      console.warn("Direct API account check failed:", directError);
      return false;
    }
  }
  
  private async testTradingPermission(): Promise<boolean> {
    try {
      console.log("Testing trading permission...");
      
      if (this.apiClient.getProxyMode()) {
        try {
          // First try order history
          const orderResult = await this.apiClient.fetchWithProxy('allOrders', { symbol: 'BTCUSDT', limit: '1' }, 'GET', true);
          if (Array.isArray(orderResult)) {
            console.log("Trading permission confirmed via proxy (order history)");
            return true;
          }
        } catch (proxyOrderError) {
          console.warn("Proxy trading check (orders) failed:", proxyOrderError);
          
          // Try open orders as fallback
          try {
            const openOrdersResult = await this.apiClient.fetchWithProxy('openOrders', {}, 'GET', true);
            if (Array.isArray(openOrdersResult)) {
              console.log("Trading permission confirmed via proxy (open orders)");
              return true;
            }
          } catch (openOrdersError) {
            console.warn("Proxy trading check (open orders) failed:", openOrdersError);
          }
        }
      }
      
      // Try direct API method as fallback
      try {
        const endpoint = 'https://api.binance.com/api/v3/openOrders';
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
          console.log("Trading permission confirmed via direct API");
          return true;
        } else {
          const errorData = await response.text();
          // If the error is permission related, it will usually say so
          if (errorData.includes("permission") || response.status === 403) {
            console.warn("No trading permission confirmed:", errorData);
            return false;
          }
          
          // Some other error occurred, which might not be permission related
          console.warn("Direct API trading check gave inconclusive result:", errorData);
        }
      } catch (directError) {
        console.warn("Direct API trading check failed:", directError);
      }
      
      // Finally, fallback to checking for specific permission key
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
          // Check for trading status in permissions (might not be available)
          if (data.permissions && Array.isArray(data.permissions)) {
            return data.permissions.includes('SPOT');
          }
        }
      } catch (error) {
        console.warn("Permission fallback check failed:", error);
      }
      
      return false;
    } catch (error) {
      console.warn("Trading permission test error:", error);
      return false;
    }
  }
}
