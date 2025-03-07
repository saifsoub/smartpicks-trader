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
  BalanceInfo,
  AccountInfoResponse
} from './binance/types';
import { formatBalanceData, logBalanceSummary, isDefaultBalance } from './binance/accountUtils';
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
  private balanceFetchPromise: Promise<Record<string, BalanceInfo>> | null = null;
  
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
      
      window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      
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
    return this.apiClient.getApiKey();
  }

  public setProxyMode(useLocalProxy: boolean) {
    this.apiClient.setProxyMode(useLocalProxy);
    StorageManager.saveProxyMode(useLocalProxy);
    
    this.accountService.setConnectionStatus('unknown');
    this.accountService.setLastConnectionError(null);
    this.cachedBalances = null; // Clear cache when proxy mode changes
    
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
    return this.apiClient.getProxyMode();
  }

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
      this.cachedBalances = null;
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
      
      const accountInfo = await this.accountService.getAccountInfo();
      
      if (accountInfo && accountInfo.balances) {
        const isDefaultData = isDefaultBalance(accountInfo.balances);
        // Add the isDefault flag to the account info
        accountInfo.isDefault = isDefaultData;
        
        if (isDefaultData) {
          console.warn("WARNING: Using default account data, not real balances");
        }
      }
      
      return accountInfo;
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      toast.error('Failed to fetch account information. Please check your connection settings.');
      throw error;
    }
  }

  public async getAccountBalance(forceRefresh: boolean = false): Promise<Record<string, BalanceInfo>> {
    if (this.isGettingBalances) {
      console.log("Already retrieving balances, waiting for completion");
      
      if (this.balanceFetchPromise) {
        return this.balanceFetchPromise;
      }
      
      if (this.cachedBalances) {
        return this.cachedBalances;
      }
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (this.isGettingBalances) {
            reject(new Error("Balance retrieval still in progress after waiting"));
          } else {
            this.getAccountBalance(forceRefresh).then(resolve).catch(reject);
          }
        }, this.retryDelay);
      });
    }
    
    const now = Date.now();
    if (!forceRefresh && this.cachedBalances && now - this.lastBalanceCheck < this.maxBalanceCacheAge) {
      console.log("Using cached balance data (less than 30 seconds old)");
      return this.cachedBalances;
    }
    
    try {
      this.isGettingBalances = true;
      
      this.balanceFetchPromise = (async () => {
        console.log("Getting fresh account balances");
        
        if (this.accountService.getConnectionStatus() === 'unknown' && this.hasCredentials()) {
          await this.testConnection();
        }
        
        const balances = await this.accountService.getAccountBalance();
        console.log("Raw balances received:", balances);
        
        const usingDefaultBalances = Object.values(balances).length >= 4 && 
          Object.keys(balances).includes('BTC') && 
          Object.keys(balances).includes('ETH') && 
          Object.keys(balances).includes('BNB') && 
          Object.keys(balances).includes('USDT') &&
          balances['BTC'].total === '0.01' &&
          balances['ETH'].total === '0.5' &&
          balances['BNB'].total === '2' &&
          balances['USDT'].total === '100';
          
        if (usingDefaultBalances) {
          console.warn("WARNING: Using default balances, not real data");
          Object.keys(balances).forEach(key => {
            balances[key].isDefault = true;
          });
        }
        
        if (Object.keys(balances).length > 0) {
          const prices = await this.getPrices();
          
          for (const asset in balances) {
            if (asset === 'USDT') {
              const available = parseFloat(balances[asset].available);
              const total = parseFloat(balances[asset].total);
              balances[asset].usdValue = total;
              continue;
            }
            
            const symbol = `${asset}USDT`;
            const price = prices[symbol];
            
            if (price) {
              const total = parseFloat(balances[asset].total);
              balances[asset].usdValue = total * parseFloat(price);
            }
          }
        }
        
        logBalanceSummary(balances);
        
        this.cachedBalances = balances;
        this.lastBalanceCheck = now;
        
        return balances;
      })();
      
      return await this.balanceFetchPromise;
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      toast.error('Failed to fetch account balance. Please check your connection settings.');
      throw error;
    } finally {
      this.isGettingBalances = false;
      this.balanceFetchPromise = null;
    }
  }

  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    const result = await this.accountService.placeMarketOrder(symbol, side, quantity);
    this.cachedBalances = null;
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
