
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { BalanceInfo, AccountInfoResponse } from './types';
import { formatBalanceData, logBalanceSummary, isDefaultBalance } from './accountUtils';
import { toast } from 'sonner';

export class BalanceService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private lastBalanceCheck: number = 0;
  private cachedBalances: Record<string, BalanceInfo> | null = null;
  private isGettingBalances: boolean = false;
  private retryDelay: number = 2000;
  private maxBalanceCacheAge: number = 30000; // 30 seconds
  private balanceFetchPromise: Promise<Record<string, BalanceInfo>> | null = null;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public resetCache(): void {
    this.cachedBalances = null;
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
        
        if (!this.apiClient.hasCredentials()) {
          throw new Error('API credentials not configured');
        }
        
        const balances = await this.fetchBalancesFromApi();
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
          await this.enrichBalancesWithUsdValues(balances);
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
  
  private async fetchBalancesFromApi(): Promise<Record<string, BalanceInfo>> {
    try {
      const accountInfo = await this.getAccountInfo();
      
      if (accountInfo && accountInfo.balances) {
        const balances = formatBalanceData(accountInfo.balances);
        return balances;
      }
      
      throw new Error('Failed to retrieve balances from API');
    } catch (error) {
      console.error('Error fetching account balances:', error);
      throw error;
    }
  }
  
  public async getAccountInfo(): Promise<AccountInfoResponse> {
    try {
      const accountInfo = await this.apiClient.fetchWithProxy('account');
      
      if (accountInfo && Array.isArray(accountInfo.balances)) {
        const isDefaultData = isDefaultBalance(accountInfo.balances);
        accountInfo.isDefault = isDefaultData;
        
        if (isDefaultData) {
          console.warn("WARNING: Using default account data, not real balances");
        }
        
        return accountInfo;
      }
      
      throw new Error('Invalid account data received');
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      toast.error('Failed to fetch account information. Please check your connection settings.');
      throw error;
    }
  }
  
  private async enrichBalancesWithUsdValues(balances: Record<string, BalanceInfo>): Promise<void> {
    try {
      const prices = await this.getPrices();
      
      for (const asset in balances) {
        if (asset === 'USDT') {
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
    } catch (error) {
      console.error('Error enriching balances with USD values:', error);
    }
  }
  
  private async getPrices(): Promise<Record<string, string>> {
    // This is a simplified version - in a real implementation, 
    // you might want to use the MarketDataService
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');
      
      if (!response.ok) {
        throw new Error(`Error fetching prices: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const priceMap: Record<string, string> = {};
      for (const item of data) {
        priceMap[item.symbol] = item.price;
      }
      
      return priceMap;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw new Error('Could not fetch current market prices');
    }
  }
}
