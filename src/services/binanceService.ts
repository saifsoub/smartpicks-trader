
import { BinanceApiClient } from './binance/apiClient';
import { StorageManager } from './binance/storageManager';
import { LogManager } from './binance/logManager';
import { AccountService } from './binance/accountService';
import { MarketDataService } from './binance/marketDataService';
import { ConnectionService } from './binance/connectionService';
import { BalanceService } from './binance/balanceService';
import { TradingService } from './binance/tradingService';
import { CredentialsService } from './binance/credentialsService';
import { FallbackDataProvider } from './binance/fallbackDataProvider';
import { 
  BinanceCredentials, 
  BinanceBalance, 
  BinanceSymbol,
  BalanceInfo,
  AccountInfoResponse
} from './binance/types';
import { toast } from 'sonner';

class BinanceService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private marketDataService: MarketDataService;
  private connectionService: ConnectionService;
  private balanceService: BalanceService;
  private tradingService: TradingService;
  private credentialsService: CredentialsService;
  private connectionErrors: number = 0;
  private maxConnectionErrors: number = 5;
  private lastSuccessfulConnection: number = 0;
  
  constructor() {
    const credentials = StorageManager.loadCredentials();
    const useLocalProxy = StorageManager.getProxyMode();
    
    this.apiClient = new BinanceApiClient(credentials, useLocalProxy);
    this.logManager = new LogManager();
    this.accountService = new AccountService(this.apiClient, this.logManager);
    this.marketDataService = new MarketDataService(this.apiClient, this.logManager);
    this.connectionService = new ConnectionService(this.apiClient, this.logManager, this.accountService);
    this.balanceService = new BalanceService(this.apiClient, this.logManager);
    this.tradingService = new TradingService(this.apiClient, this.logManager);
    this.credentialsService = new CredentialsService(this.apiClient);
    
    const permissions = StorageManager.loadApiPermissions();
    this.accountService.setApiPermissions(permissions.read, permissions.trading);
    
    // Check server time difference on startup
    this.apiClient.checkServerTimeDifference().catch(err => {
      console.warn("Failed to check server time:", err);
    });
    
    // Initialize with last successful connection time if available
    const lastConnection = localStorage.getItem('lastSuccessfulConnection');
    if (lastConnection) {
      this.lastSuccessfulConnection = parseInt(lastConnection);
    }
    
    // Set up auto-reconnect on window focus
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }
  
  private handleWindowFocus(): void {
    // Only auto-reconnect if we haven't had a successful connection in a while
    const hoursSinceLastConnection = (Date.now() - this.lastSuccessfulConnection) / (1000 * 60 * 60);
    if (hoursSinceLastConnection > 1 && this.hasCredentials()) {
      console.log("Window focused, testing connection after inactivity...");
      this.testConnection().catch(err => {
        console.warn("Auto-reconnect failed:", err);
      });
    }
  }

  public hasCredentials(): boolean {
    return this.credentialsService.hasCredentials();
  }

  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      const success = this.credentialsService.saveCredentials(credentials);
      
      this.accountService.setConnectionStatus('unknown');
      this.accountService.setLastConnectionError(null);
      this.balanceService.resetCache(); // Clear cache when credentials change
      
      // After saving credentials, immediately test the connection
      // This helps users get feedback right away
      this.logManager.addTradingLog("API credentials updated, testing connection...", 'info');
      
      setTimeout(() => {
        this.testConnection().then(success => {
          if (success) {
            this.logManager.addTradingLog("Successfully connected with new credentials", 'success');
            this.getAccountBalance(true);
          } else {
            this.logManager.addTradingLog("Connection test with new credentials failed", 'error');
          }
        });
      }, 500);
      
      return success;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      this.logManager.addTradingLog(`Failed to save credentials: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }

  public getApiKey(): string {
    return this.credentialsService.getApiKey();
  }

  public setProxyMode(useLocalProxy: boolean) {
    this.credentialsService.setProxyMode(useLocalProxy);
    
    this.accountService.setConnectionStatus('unknown');
    this.accountService.setLastConnectionError(null);
    this.balanceService.resetCache(); // Clear cache when proxy mode changes
    
    setTimeout(() => {
      this.testConnection().then(success => {
        if (success) {
          this.getAccountBalance(true);
        }
      });
    }, 500);
    
    return true;
  }

  public getProxyMode(): boolean {
    return this.credentialsService.getProxyMode();
  }

  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.accountService.setApiPermissions(readPermission, tradingPermission);
    this.credentialsService.setApiPermissions(readPermission, tradingPermission);
  }
  
  public getApiPermissions(): { read: boolean, trading: boolean } {
    return this.accountService.getApiPermissions();
  }

  public async detectApiPermissions(): Promise<{ read: boolean, trading: boolean }> {
    try {
      const permissions = await this.accountService.detectApiPermissions();
      this.credentialsService.setApiPermissions(permissions.read, permissions.trading);
      return permissions;
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      // Default to assuming read permission if we can't detect
      const fallback = { read: true, trading: false };
      this.credentialsService.setApiPermissions(fallback.read, fallback.trading);
      return fallback;
    }
  }

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
    try {
      const result = await this.connectionService.testConnection();
      if (result) {
        this.balanceService.resetCache();
        // Store the successful connection
        this.lastSuccessfulConnection = Date.now();
        localStorage.setItem('lastSuccessfulConnection', this.lastSuccessfulConnection.toString());
        this.connectionErrors = 0;
      } else {
        this.connectionErrors++;
        
        // Check when was the last successful connection
        const hoursSinceLastConnection = (Date.now() - this.lastSuccessfulConnection) / (1000 * 60 * 60);
        if (hoursSinceLastConnection > 24) {
          toast.warning("No successful connection in over 24 hours. Consider updating your API keys or checking network.");
        }
        
        if (this.connectionErrors >= this.maxConnectionErrors) {
          toast.error("Multiple connection failures. Switching to offline demo mode.");
          this.logManager.addTradingLog("Multiple connection failures. Using offline demo mode.", 'warning');
        }
      }
      return result;
    } catch (error) {
      console.error("Test connection error:", error);
      this.connectionErrors++;
      return false;
    }
  }

  public isInTestMode(): boolean {
    return false;
  }

  public getDefaultTradingPairs(): string[] {
    try {
      return this.accountService.getDefaultTradingPairs();
    } catch (error) {
      return FallbackDataProvider.getDefaultTradingPairs();
    }
  }

  public async getAccountInfo(): Promise<AccountInfoResponse> {
    try {
      if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
        await this.testConnection();
      }
      
      return await this.balanceService.getAccountInfo();
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      toast.error('Failed to fetch account information. Using demo data.');
      
      // Return fallback data
      return {
        balances: FallbackDataProvider.getSafeBalances(),
        isDefault: true,
        isLimitedAccess: true
      };
    }
  }

  public async getAccountBalance(forceRefresh: boolean = false): Promise<Record<string, BalanceInfo>> {
    try {
      if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
        await this.testConnection();
      }
      
      return await this.balanceService.getAccountBalance(forceRefresh);
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      toast.error('Failed to fetch account balance. Using demo data.');
      
      // Create fallback data
      const fallbackData: Record<string, BalanceInfo> = {};
      const mockBalances = FallbackDataProvider.getSafeBalances();
      
      mockBalances.forEach(balance => {
        fallbackData[balance.asset] = {
          available: balance.free,
          total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
          usdValue: balance.asset === 'USDT' ? parseFloat(balance.free) : 0,
          rawAsset: balance.asset,
          isDefault: true
        };
      });
      
      return fallbackData;
    }
  }

  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    const result = await this.tradingService.placeMarketOrder(symbol, side, quantity);
    this.balanceService.resetCache();
    return result;
  }

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
