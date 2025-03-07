
import { BinanceApiClient } from './binance/apiClient';
import { StorageManager } from './binance/storageManager';
import { LogManager } from './binance/logManager';
import { AccountService } from './binance/accountService';
import { MarketDataService } from './binance/marketDataService';
import { ConnectionService } from './binance/connectionService';
import { 
  BinanceCredentials, 
  BinanceBalance, 
  BinanceSymbol,
  BalanceInfo
} from './binance/types';
import { toast } from 'sonner';

class BinanceService {
  private credentials: BinanceCredentials | null = null;
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private marketDataService: MarketDataService;
  private connectionService: ConnectionService;
  private lastBalanceCheck: number = 0;
  private cachedBalances: Record<string, BalanceInfo> | null = null;
  private isGettingBalances: boolean = false;
  private retryDelay: number = 2000;
  private maxBalanceCacheAge: number = 30000; // 30 seconds
  
  constructor() {
    this.credentials = StorageManager.loadCredentials();
    const useLocalProxy = StorageManager.getProxyMode();
    
    this.apiClient = new BinanceApiClient(this.credentials, useLocalProxy);
    this.logManager = new LogManager();
    this.accountService = new AccountService(this.apiClient, this.logManager);
    this.marketDataService = new MarketDataService(this.apiClient, this.logManager);
    this.connectionService = new ConnectionService(this.apiClient, this.logManager, this.accountService);
    
    const permissions = StorageManager.loadApiPermissions();
    this.accountService.setApiPermissions(permissions.read, permissions.trading);
  }

  // Credential and configuration methods
  public hasCredentials(): boolean {
    return this.apiClient.hasCredentials();
  }

  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.credentials = credentials;
      this.apiClient.setCredentials(credentials);
      const success = StorageManager.saveCredentials(credentials);
      
      this.accountService.setConnectionStatus('unknown');
      this.accountService.setLastConnectionError(null);
      this.cachedBalances = null; // Clear cache when credentials change
      
      // Dispatch event to notify the application that credentials have been updated
      window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      
      // Test connection after saving credentials
      setTimeout(() => {
        this.testConnection().then(success => {
          if (success) {
            // Force refresh balances after successful connection
            this.getAccountBalance(true);
          }
        });
      }, 500);
      
      return success;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  public getApiKey(): string {
    return this.apiClient.getApiKey();
  }

  public setProxyMode(useLocalProxy: boolean) {
    this.apiClient.setProxyMode(useLocalProxy);
    StorageManager.saveProxyMode(useLocalProxy);
    
    this.accountService.setConnectionStatus('unknown');
    this.accountService.setLastConnectionError(null);
    this.cachedBalances = null; // Clear cache when proxy mode changes
    
    // Test connection after changing proxy mode
    setTimeout(() => {
      this.testConnection().then(success => {
        if (success) {
          // Force refresh balances after successful connection
          this.getAccountBalance(true);
        }
      });
    }, 500);
    
    return true;
  }

  public getProxyMode(): boolean {
    return this.apiClient.getProxyMode();
  }

  // API permissions methods
  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.accountService.setApiPermissions(readPermission, tradingPermission);
    StorageManager.saveApiPermissions({ read: readPermission, trading: tradingPermission });
  }
  
  public getApiPermissions(): { read: boolean, trading: boolean } {
    return this.accountService.getApiPermissions();
  }

  public async detectApiPermissions(): Promise<{ read: boolean, trading: boolean }> {
    const permissions = await this.accountService.detectApiPermissions();
    StorageManager.saveApiPermissions(permissions);
    return permissions;
  }

  // Connection related methods
  public getConnectionStatus(): 'connected' | 'disconnected' | 'unknown' {
    return this.accountService.getConnectionStatus();
  }

  public isProxyWorking(): boolean {
    return this.apiClient.isProxyWorking();
  }

  public getLastConnectionError(): string | null {
    return this.accountService.getLastConnectionError();
  }

  public async testConnection(): Promise<boolean> {
    const result = await this.connectionService.testConnection();
    if (result) {
      // Connection test was successful, force refresh balances
      this.cachedBalances = null;
    }
    return result;
  }

  public isInTestMode(): boolean {
    return false;
  }

  // Trading pairs methods
  public getDefaultTradingPairs(): string[] {
    return this.accountService.getDefaultTradingPairs();
  }

  // Account methods
  public async getAccountInfo(): Promise<{ balances: BinanceBalance[] }> {
    try {
      // Ensure connection is tested if needed
      if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
        await this.testConnection();
      }
      
      return this.accountService.getAccountInfo();
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      toast.error('Failed to fetch account information. Please check your connection settings.');
      throw error;
    }
  }

  public async getAccountBalance(forceRefresh: boolean = false): Promise<Record<string, BalanceInfo>> {
    // Prevent multiple simultaneous balance requests
    if (this.isGettingBalances) {
      console.log("Already retrieving balances, returning cached data or waiting");
      if (this.cachedBalances) {
        return this.cachedBalances;
      }
      
      // Wait a bit and try again
      try {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        if (!this.isGettingBalances) {
          return this.getAccountBalance(forceRefresh);
        } else {
          throw new Error("Balance retrieval in progress");
        }
      } catch (error) {
        console.error("Error during balance retry:", error);
        if (this.cachedBalances) {
          return this.cachedBalances;
        }
        throw error;
      }
    }
    
    // Check if we have recent cached balances (less than 30 seconds old) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && this.cachedBalances && now - this.lastBalanceCheck < this.maxBalanceCacheAge) {
      console.log("Using cached balance data (less than 30 seconds old)");
      return this.cachedBalances;
    }
    
    try {
      this.isGettingBalances = true;
      console.log("Getting fresh account balances");
      
      // Ensure connection is tested before getting account balance
      if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
        await this.testConnection();
      }
      
      // Get balances from account service
      const balances = await this.accountService.getAccountBalance();
      
      // If we have balances, try to enrich them with USD values
      if (Object.keys(balances).length > 0) {
        const prices = await this.getPrices();
        
        for (const asset in balances) {
          // Skip if this is already USDT
          if (asset === 'USDT') {
            const available = parseFloat(balances[asset].available);
            const total = parseFloat(balances[asset].total);
            balances[asset].usdValue = total;
            continue;
          }
          
          // Get the price for this asset
          const symbol = `${asset}USDT`;
          const price = prices[symbol];
          
          if (price) {
            const total = parseFloat(balances[asset].total);
            balances[asset].usdValue = total * parseFloat(price);
          }
        }
      }
      
      // Cache the enriched balances
      this.cachedBalances = balances;
      this.lastBalanceCheck = now;
      
      return balances;
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      toast.error('Failed to fetch account balance. Please check your connection settings.');
      throw error;
    } finally {
      this.isGettingBalances = false;
    }
  }

  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    const result = await this.accountService.placeMarketOrder(symbol, side, quantity);
    // Clear cached balances after placing an order
    this.cachedBalances = null;
    return result;
  }

  // Market data methods
  public async getSymbols(): Promise<BinanceSymbol[]> {
    return this.marketDataService.getSymbols();
  }

  public async getRecentTrades(symbol: string): Promise<any[]> {
    return this.marketDataService.getRecentTrades(symbol);
  }

  public async getPrices(): Promise<Record<string, string>> {
    return this.marketDataService.getPrices();
  }

  public async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<any[]> {
    return this.marketDataService.getKlines(symbol, interval, limit);
  }

  // Logging methods
  public getTradingLogs() {
    return this.logManager.getTradingLogs();
  }

  public clearTradingLogs() {
    this.logManager.clearTradingLogs();
  }

  public addTradingLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    this.logManager.addTradingLog(message, type);
  }
}

const binanceService = new BinanceService();
export default binanceService;
