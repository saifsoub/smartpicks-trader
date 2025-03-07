
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { StorageManager } from './storageManager';
import { AccountInfoResponse } from './types';

export class PermissionsManager {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private readPermission: boolean = true;
  private tradingPermission: boolean = false;
  private lastPermissionCheck: number = 0;
  private permissionCheckInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    
    // Load saved permissions from storage
    const savedPermissions = StorageManager.loadApiPermissions();
    this.readPermission = savedPermissions.read;
    this.tradingPermission = savedPermissions.trading;
  }
  
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.readPermission = readPermission;
    this.tradingPermission = tradingPermission;
    StorageManager.saveApiPermissions({read: readPermission, trading: tradingPermission});
  }
  
  public getApiPermissions() {
    return {
      read: this.readPermission,
      trading: this.tradingPermission
    };
  }
  
  public async detectApiPermissions(): Promise<{ read: boolean, trading: boolean }> {
    const now = Date.now();
    const permissions = { read: false, trading: false };
    
    // Skip if we checked recently
    if (now - this.lastPermissionCheck < this.permissionCheckInterval) {
      return this.getApiPermissions();
    }
    
    if (!this.apiClient.hasCredentials()) {
      return permissions;
    }
    
    try {
      this.logManager.addTradingLog("Detecting API key permissions...", 'info');
      let accountInfo: AccountInfoResponse | null = null;
      
      // Test read permission with account endpoint
      try {
        accountInfo = await this.apiClient.fetchWithProxy('account', { recvWindow: '5000' }, 'GET');
        if (accountInfo && Array.isArray(accountInfo.balances)) {
          permissions.read = true;
          this.logManager.addTradingLog("READ permission detected for API key", 'success');
        }
      } catch (readError) {
        console.warn("Failed to verify READ permission:", readError);
        
        // Try alternative endpoint for read permission
        try {
          const assetInfo = await this.apiClient.fetchWithProxy('capital/config/getall', {}, 'GET');
          if (Array.isArray(assetInfo) && assetInfo.length > 0) {
            permissions.read = true;
            this.logManager.addTradingLog("READ permission detected via alternative endpoint", 'success');
          }
        } catch (altReadError) {
          console.warn("Alternative READ permission check failed:", altReadError);
          permissions.read = false;
        }
      }
      
      // Test trading permission by checking account info if available
      if (permissions.read && accountInfo) {
        try {
          // First check account for trading status
          if (accountInfo.canTrade) {
            permissions.trading = true;
            this.logManager.addTradingLog("TRADING permission detected from account info", 'info');
          } else {
            // Test with API permissions array if available
            if (Array.isArray(accountInfo.permissions)) {
              if (accountInfo.permissions.includes('SPOT') || 
                  accountInfo.permissions.includes('MARGIN') ||
                  accountInfo.permissions.includes('FUTURES')) {
                permissions.trading = true;
                this.logManager.addTradingLog("TRADING permission detected from permissions list", 'info');
              }
            }
          }
        } catch (tradeError) {
          console.warn("Failed to verify TRADING permission:", tradeError);
          permissions.trading = false;
        }
      }
      
      this.lastPermissionCheck = now;
      this.setApiPermissions(permissions.read, permissions.trading);
      return permissions;
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      // Return current permissions if detection fails
      return this.getApiPermissions();
    }
  }
}
