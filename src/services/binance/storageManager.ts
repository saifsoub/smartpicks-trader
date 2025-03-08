
import { BinanceCredentials, ApiPermissions } from './types';

export class StorageManager {
  private static CREDENTIALS_KEY = 'binanceCredentials';
  private static PERMISSIONS_KEY = 'binanceApiPermissions';
  private static PROXY_MODE_KEY = 'useLocalProxy';
  private static OFFLINE_MODE_KEY = 'offlineMode';
  private static LAST_NETWORK_ERROR_KEY = 'lastNetworkError';
  private static NETWORK_ERROR_COUNT_KEY = 'networkErrorCount';
  private static NOTIFICATION_SUPPRESS_KEY = 'suppressNetworkNotifications';
  private static BYPASS_CONNECTION_CHECKS_KEY = 'bypassConnectionChecks';
  private static MAX_CONNECTION_RETRIES_KEY = 'maxConnectionRetries';
  
  public static loadCredentials(): BinanceCredentials | null {
    const savedCredentials = localStorage.getItem(this.CREDENTIALS_KEY);
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        console.log("Credentials loaded successfully:", credentials ? "API Key found" : "No API key");
        return credentials;
      } catch (error) {
        console.error("Failed to parse credentials from localStorage:", error);
        localStorage.removeItem(this.CREDENTIALS_KEY);
        return null;
      }
    }
    return null;
  }
  
  public static saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
      console.log("Credentials saved successfully");
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }
  
  public static loadApiPermissions(): ApiPermissions {
    const savedPermissions = localStorage.getItem(this.PERMISSIONS_KEY);
    if (savedPermissions) {
      try {
        return JSON.parse(savedPermissions);
      } catch (error) {
        console.error("Failed to parse API permissions:", error);
        return { read: false, trading: false };
      }
    }
    return { read: false, trading: false };
  }
  
  public static saveApiPermissions(permissions: ApiPermissions): void {
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
    console.log(`API permissions set: Read=${permissions.read}, Trading=${permissions.trading}`);
  }
  
  public static getProxyMode(): boolean {
    return localStorage.getItem(this.PROXY_MODE_KEY) !== 'false';
  }
  
  public static saveProxyMode(useLocalProxy: boolean): void {
    localStorage.setItem(this.PROXY_MODE_KEY, String(useLocalProxy));
    console.log(`Proxy mode set to: ${useLocalProxy ? 'Local Proxy' : 'Direct API Mode'}`);
  }
  
  public static getOfflineMode(): boolean {
    return localStorage.getItem(this.OFFLINE_MODE_KEY) === 'true';
  }
  
  public static saveOfflineMode(offlineMode: boolean): void {
    localStorage.setItem(this.OFFLINE_MODE_KEY, String(offlineMode));
    console.log(`Offline mode set to: ${offlineMode ? 'Enabled' : 'Disabled'}`);
  }
  
  public static saveLastNetworkError(error: string): void {
    localStorage.setItem(this.LAST_NETWORK_ERROR_KEY, error);
    
    // Increment network error count
    const errorCount = this.getNetworkErrorCount();
    this.saveNetworkErrorCount(errorCount + 1);
  }
  
  public static getLastNetworkError(): string | null {
    return localStorage.getItem(this.LAST_NETWORK_ERROR_KEY);
  }
  
  public static saveNetworkErrorCount(count: number): void {
    localStorage.setItem(this.NETWORK_ERROR_COUNT_KEY, String(count));
  }
  
  public static getNetworkErrorCount(): number {
    const count = localStorage.getItem(this.NETWORK_ERROR_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  }
  
  public static resetNetworkErrorCount(): void {
    localStorage.removeItem(this.NETWORK_ERROR_COUNT_KEY);
    localStorage.removeItem(this.LAST_NETWORK_ERROR_KEY);
  }
  
  public static suppressNotifications(suppress: boolean): void {
    localStorage.setItem(this.NOTIFICATION_SUPPRESS_KEY, String(suppress));
  }
  
  public static areNotificationsSuppressed(): boolean {
    return localStorage.getItem(this.NOTIFICATION_SUPPRESS_KEY) === 'true';
  }
  
  public static bypassConnectionChecks(bypass: boolean): void {
    localStorage.setItem(this.BYPASS_CONNECTION_CHECKS_KEY, String(bypass));
    console.log(`Connection checks bypass set to: ${bypass ? 'Enabled' : 'Disabled'}`);
  }
  
  public static shouldBypassConnectionChecks(): boolean {
    return localStorage.getItem(this.BYPASS_CONNECTION_CHECKS_KEY) === 'true';
  }
  
  public static setMaxConnectionRetries(retries: number): void {
    localStorage.setItem(this.MAX_CONNECTION_RETRIES_KEY, String(retries));
  }
  
  public static getMaxConnectionRetries(): number {
    const retries = localStorage.getItem(this.MAX_CONNECTION_RETRIES_KEY);
    return retries ? parseInt(retries, 10) : 5; // Default to 5 retries
  }
}
