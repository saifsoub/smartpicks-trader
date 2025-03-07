
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
  private permissionDetectionAttempts: number = 0;
  private maxPermissionDetectionAttempts: number = 3;
  
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
    if (now - this.lastPermissionCheck < this.permissionCheckCooldown && 
        (this.readPermission || this.permissionDetectionAttempts >= this.maxPermissionDetectionAttempts)) {
      console.log("Using cached API permissions to prevent frequent checks");
      return this.getApiPermissions();
    }
    
    this.lastPermissionCheck = now;
    this.permissionDetectionAttempts++;
    
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
      
      // First try direct API methods which are more reliable
      try {
        const result = await this.testDirectAccountAccess();
        if (result) {
          console.log("Read permission confirmed via direct API");
          return true;
        }
      } catch (directError) {
        console.warn("Direct read permission test failed:", directError);
      }
      
      // Then try proxy methods as fallback
      if (this.apiClient.getProxyMode()) {
        try {
          // First try with proxy
          const accountResult = await this.apiClient.fetchWithProxy('account', { recvWindow: '10000' }, 'GET', true);
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
          
          // Try user data stream as another option
          try {
            const userDataResult = await this.apiClient.fetchWithProxy('userDataStream', {}, 'POST', true);
            if (userDataResult && userDataResult.listenKey) {
              console.log("Read permission confirmed via user data stream");
              return true;
            }
          } catch (userDataError) {
            console.warn("User data stream check failed:", userDataError);
          }
        }
      }
      
      // Try to get open orders - requires read permission but not full account access
      try {
        const openOrdersEndpoint = 'https://api.binance.com/api/v3/openOrders';
        
        // Get server time first for accurate timestamp
        const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
        const serverTimeData = await serverTimeResponse.json();
        const timestamp = serverTimeData.serverTime || Date.now();
        
        const queryString = `timestamp=${timestamp}&recvWindow=10000`;
        const signature = await this.apiClient.generateSignature(queryString);
        const url = `${openOrdersEndpoint}?${queryString}&signature=${signature}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.apiClient.getApiKey()
          }
        });
        
        if (response.ok) {
          console.log("Read permission confirmed via open orders endpoint");
          return true;
        } else {
          const errorText = await response.text();
          if (errorText.includes("API-key has no permission")) {
            console.warn("API key does not have permission for orders:", errorText);
            return false;
          }
        }
      } catch (ordersError) {
        console.warn("Open orders check failed:", ordersError);
      }
      
      // If all above checks fail, assume no read permission
      console.warn("API key doesn't have read permission or can't verify it");
      return false;
    } catch (error) {
      console.warn("Read permission test error:", error);
      return false;
    }
  }
  
  private async testDirectAccountAccess(): Promise<boolean> {
    try {
      const endpoint = 'https://api.binance.com/api/v3/account';
      
      // Get server time first for accurate timestamp
      const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
      const serverTimeData = await serverTimeResponse.json();
      const timestamp = serverTimeData.serverTime || Date.now();
      
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
          console.log("Read permission confirmed via direct API");
          return true;
        }
      } else {
        const errorText = await response.text();
        console.warn("Direct API account check failed with status:", response.status, errorText);
        
        // Special case: If error mentions "no permission" but API key is valid
        if (errorText.includes("API-key has no permission") && !errorText.includes("invalid API-key")) {
          // This means the API key is valid but doesn't have account permission
          // Depending on what other permissions the key has, we might still mark read as true
          // We'll use a heuristic here: if the status is 400 or 403, likely a permission issue
          if (response.status === 400 || response.status === 403) {
            console.log("API key appears valid but with limited permissions");
            // We'll check other endpoints in the parent method
          }
        }
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
      
      // First try direct API method which is more reliable
      try {
        // Try getting open orders - a good test for trading permission
        const endpoint = 'https://api.binance.com/api/v3/openOrders';
        
        // Get server time first for accurate timestamp
        const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
        const serverTimeData = await serverTimeResponse.json();
        const timestamp = serverTimeData.serverTime || Date.now();
        
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
      
      // Then try proxy methods as fallback
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
      
      // Finally, fallback to checking for specific permission key
      try {
        const endpoint = 'https://api.binance.com/api/v3/account';
        
        // Get server time first for accurate timestamp
        const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
        const serverTimeData = await serverTimeResponse.json();
        const timestamp = serverTimeData.serverTime || Date.now();
        
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
