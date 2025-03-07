
import { BinanceApiClient } from './binance/apiClient';
import { StorageManager } from './binance/storageManager';
import { LogManager } from './binance/logManager';
import { AccountService } from './binance/accountService';
import { MarketDataService } from './binance/marketDataService';
import { ConnectionService } from './binance/connectionService';
import { BalanceService } from './binance/balanceService';
import { TradingService } from './binance/tradingService';
import { CredentialsService } from './binance/credentialsService';
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
      
      setTimeout(() => {
        this.testConnection().then(success => {
          if (success) {
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
    const permissions = await this.accountService.detectApiPermissions();
    this.credentialsService.setApiPermissions(permissions.read, permissions.trading);
    return permissions;
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
    const result = await this.connectionService.testConnection();
    if (result) {
      this.balanceService.resetCache();
    }
    return result;
  }

  public isInTestMode(): boolean {
    return false;
  }

  public getDefaultTradingPairs(): string[] {
    return this.accountService.getDefaultTradingPairs();
  }

  public async getAccountInfo(): Promise<AccountInfoResponse> {
    try {
      if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
        await this.testConnection();
      }
      
      return await this.balanceService.getAccountInfo();
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      toast.error('Failed to fetch account information. Please check your connection settings.');
      throw error;
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
      toast.error('Failed to fetch account balance. Please check your connection settings.');
      throw error;
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
