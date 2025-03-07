
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

class BinanceService {
  private credentials: BinanceCredentials | null = null;
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private marketDataService: MarketDataService;
  private connectionService: ConnectionService;
  
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
      
      window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      
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
    return this.connectionService.testConnection();
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
    await this.testConnection();
    return this.accountService.getAccountInfo();
  }

  public async getAccountBalance(): Promise<Record<string, BalanceInfo>> {
    return this.accountService.getAccountBalance();
  }

  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    return this.accountService.placeMarketOrder(symbol, side, quantity);
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

  public addTradingLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.logManager.addTradingLog(message, type);
  }
}

const binanceService = new BinanceService();
export default binanceService;
