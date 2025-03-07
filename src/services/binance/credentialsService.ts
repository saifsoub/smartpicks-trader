
import { BinanceApiClient } from './apiClient';
import { StorageManager } from './storageManager';
import { BinanceCredentials } from './types';

export class CredentialsService {
  private apiClient: BinanceApiClient;
  
  constructor(apiClient: BinanceApiClient) {
    this.apiClient = apiClient;
  }
  
  public hasCredentials(): boolean {
    return this.apiClient.hasCredentials();
  }
  
  public getApiKey(): string {
    return this.apiClient.getApiKey();
  }
  
  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.apiClient.setCredentials(credentials);
      const success = StorageManager.saveCredentials(credentials);
      
      if (success) {
        window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      }
      
      return success;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }
  
  public setProxyMode(useLocalProxy: boolean): boolean {
    this.apiClient.setProxyMode(useLocalProxy);
    StorageManager.saveProxyMode(useLocalProxy);
    return true;
  }
  
  public getProxyMode(): boolean {
    return this.apiClient.getProxyMode();
  }
  
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    StorageManager.saveApiPermissions({ read: readPermission, trading: tradingPermission });
  }
  
  public getApiPermissions(): { read: boolean, trading: boolean } {
    return StorageManager.loadApiPermissions();
  }
}
