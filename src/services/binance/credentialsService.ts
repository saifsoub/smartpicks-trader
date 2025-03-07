
import { BinanceApiClient } from './apiClient';
import { StorageManager } from './storageManager';
import { BinanceCredentials } from './types';
import { toast } from 'sonner';

export class CredentialsService {
  private apiClient: BinanceApiClient;
  private isOfflineMode: boolean = false;
  
  constructor(apiClient: BinanceApiClient) {
    this.apiClient = apiClient;
    // Load offline mode setting
    this.isOfflineMode = StorageManager.getOfflineMode();
    
    // Set up network status monitoring
    this.setupNetworkMonitoring();
  }
  
  private setupNetworkMonitoring(): void {
    // Auto-enable offline mode when network goes down
    window.addEventListener('offline', () => {
      if (!this.isOfflineMode) {
        console.log('Network went offline, automatically enabling offline mode');
        this.setOfflineMode(true);
        toast.info("Network is offline. Automatically switched to offline mode.");
      }
    });
    
    // When coming back online, suggest disabling offline mode
    window.addEventListener('online', () => {
      if (this.isOfflineMode) {
        console.log('Network came back online, suggesting to disable offline mode');
        setTimeout(() => {
          toast.info("Network connection restored. You can disable offline mode in settings.", {
            duration: 8000,
            action: {
              label: "Disable Offline Mode",
              onClick: () => this.setOfflineMode(false)
            }
          });
        }, 2000); // Short delay to ensure network is stable
      }
    });
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
  
  public setOfflineMode(enabled: boolean): void {
    this.isOfflineMode = enabled;
    StorageManager.saveOfflineMode(enabled);
    
    // Broadcast event for components to update
    window.dispatchEvent(new CustomEvent('offline-mode-changed', { 
      detail: { enabled } 
    }));
    
    console.log(`Offline mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  public isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }
}
