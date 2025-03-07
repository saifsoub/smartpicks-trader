
import { BinanceCredentials, ApiPermissions } from './types';

export class StorageManager {
  private static CREDENTIALS_KEY = 'binanceCredentials';
  private static PERMISSIONS_KEY = 'binanceApiPermissions';
  private static PROXY_MODE_KEY = 'useLocalProxy';
  private static OFFLINE_MODE_KEY = 'offlineMode';
  
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
}
