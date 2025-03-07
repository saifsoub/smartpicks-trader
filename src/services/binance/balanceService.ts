
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { BinanceBalance, BalanceInfo, AccountInfoResponse } from './types';
import { FallbackDataProvider } from './fallbackDataProvider';
import { toast } from 'sonner';

export class BalanceService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private balanceCache: Record<string, BalanceInfo> | null = null;
  private lastCacheTime: number = 0;
  private cacheTTL: number = 30000; // 30 seconds
  private accountInfoCache: AccountInfoResponse | null = null;
  private fetchInProgress: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public resetCache(): void {
    this.balanceCache = null;
    this.accountInfoCache = null;
    this.lastCacheTime = 0;
    console.log("Balance cache reset");
  }
  
  public async getAccountInfo(): Promise<AccountInfoResponse> {
    if (this.fetchInProgress) {
      console.log("Account info fetch already in progress, waiting...");
      await this.waitForFetchToComplete();
    }
    
    // Return cached account info if available and recent
    if (this.accountInfoCache && Date.now() - this.lastCacheTime < this.cacheTTL) {
      console.log("Using cached account info");
      return this.accountInfoCache;
    }
    
    this.fetchInProgress = true;
    
    try {
      console.log("Fetching account information from Binance API");
      
      if (!this.apiClient.hasCredentials()) {
        console.log("No API credentials available, returning default account data");
        const mockData = FallbackDataProvider.getMockAccountInfo();
        this.accountInfoCache = {
          balances: mockData.balances,
          isDefault: true,
          isLimitedAccess: true
        };
        return this.accountInfoCache;
      }
      
      let data;
      
      try {
        // Try to get real account data from Binance
        data = await this.apiClient.fetchWithProxy('account', { recvWindow: '30000' }, 'GET');
        
        if (data && Array.isArray(data.balances)) {
          console.log(`Successfully fetched account data with ${data.balances.length} assets`);
          this.retryCount = 0;
          
          // Store the successful data in cache
          this.accountInfoCache = {
            ...data,
            isDefault: false,
            isLimitedAccess: false
          };
          
          this.lastCacheTime = Date.now();
          return this.accountInfoCache;
        } else {
          console.warn("Invalid account data format received:", data);
          throw new Error("Invalid account data format received");
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
        
        // Check if we can try alternative endpoints for read-only API keys
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retry ${this.retryCount}/${this.maxRetries}: Attempting alternative endpoints for account data`);
          
          try {
            // Try capital/config/getall endpoint which sometimes works with read-only keys
            const assetData = await this.apiClient.fetchWithProxy('capital/config/getall', {}, 'GET');
            
            if (Array.isArray(assetData) && assetData.length > 0) {
              console.log(`Successfully fetched ${assetData.length} assets via alternative endpoint`);
              
              // Format the data to match account info structure
              const balances: BinanceBalance[] = assetData
                .filter(asset => asset.free !== undefined)
                .map(asset => ({
                  asset: asset.coin,
                  free: asset.free || '0',
                  locked: asset.locked || '0'
                }));
              
              this.accountInfoCache = {
                balances,
                isDefault: false,
                isLimitedAccess: true
              };
              
              this.lastCacheTime = Date.now();
              return this.accountInfoCache;
            }
          } catch (altErr) {
            console.error("Alternative endpoint also failed:", altErr);
          }
        }
        
        // If we reach here, both approaches failed
        // Provide fallback data while showing the appropriate error
        this.logManager.addTradingLog("Unable to fetch your account data. Using sample data for demonstration.", 'warning');
        
        const mockData = FallbackDataProvider.getMockAccountInfo();
        this.accountInfoCache = {
          balances: mockData.balances,
          isDefault: true,
          isLimitedAccess: true
        };
        
        this.lastCacheTime = Date.now();
        return this.accountInfoCache;
      }
    } finally {
      this.fetchInProgress = false;
    }
  }
  
  private async waitForFetchToComplete(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    while (this.fetchInProgress && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.fetchInProgress) {
      console.warn(`Wait for fetch to complete timed out after ${timeout}ms`);
    }
  }
  
  public async getAccountBalance(forceRefresh: boolean = false): Promise<Record<string, BalanceInfo>> {
    if (this.balanceCache && !forceRefresh && Date.now() - this.lastCacheTime < this.cacheTTL) {
      console.log("Using cached balance data");
      return this.balanceCache;
    }
    
    try {
      console.log("Fetching account balance");
      
      // Get fresh account info
      const accountInfo = await this.getAccountInfo();
      
      // Get prices for converting to USD values
      let prices: Record<string, string> = {};
      try {
        prices = await this.apiClient.fetchWithProxy('ticker/price', {}, 'GET', true);
        
        // Convert to a more usable format
        if (Array.isArray(prices)) {
          prices = prices.reduce((acc, item) => {
            if (item.symbol && item.price) {
              acc[item.symbol] = item.price;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (priceError) {
        console.error("Error fetching prices:", priceError);
        // Use mock prices as fallback
        prices = FallbackDataProvider.getMockPrices();
      }
      
      if (!accountInfo || !Array.isArray(accountInfo.balances)) {
        throw new Error('Invalid account info format');
      }
      
      // Process balances
      const balanceInfo: Record<string, BalanceInfo> = {};
      
      // Helper to get USD value of an asset
      const getUsdValue = (asset: string, amount: number): number => {
        if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC' || asset === 'DAI') {
          return amount;
        }
        
        // Try common pairs first
        const symbolsToTry = [`${asset}USDT`, `${asset}BUSD`, `${asset}USDC`];
        
        for (const symbol of symbolsToTry) {
          if (prices[symbol]) {
            return amount * parseFloat(prices[symbol]);
          }
        }
        
        // If no direct USD pair, try BTC pairs and convert BTC to USD
        const btcSymbol = `${asset}BTC`;
        if (prices[btcSymbol] && prices['BTCUSDT']) {
          return amount * parseFloat(prices[btcSymbol]) * parseFloat(prices['BTCUSDT']);
        }
        
        return 0; // Unable to determine USD value
      };
      
      // Process each balance
      for (const balance of accountInfo.balances) {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;
        
        // Skip assets with zero balance
        if (total <= 0) continue;
        
        const usdValue = getUsdValue(balance.asset, total);
        
        // Standardize the format
        balanceInfo[balance.asset] = {
          available: balance.free,
          total: total.toString(),
          usdValue,
          rawAsset: balance.asset,
          isDefault: accountInfo.isDefault || false
        };
      }
      
      // Include small subset of important assets even if zero balance
      const importantAssets = ['BTC', 'ETH', 'BNB', 'USDT'];
      for (const asset of importantAssets) {
        if (!balanceInfo[asset]) {
          balanceInfo[asset] = {
            available: '0',
            total: '0',
            usdValue: 0,
            rawAsset: asset,
            isDefault: accountInfo.isDefault || false
          };
        }
      }
      
      // Sort assets by USD value (descending)
      const sortedBalances = Object.entries(balanceInfo)
        .sort(([, a], [, b]) => b.usdValue - a.usdValue)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, BalanceInfo>);
      
      // Cache the result
      this.balanceCache = sortedBalances;
      this.lastCacheTime = Date.now();
      
      console.log(`Processed ${Object.keys(sortedBalances).length} assets with balance`);
      return sortedBalances;
    } catch (error) {
      console.error("Error in getAccountBalance:", error);
      
      // If this is a total failure, provide mock data
      if (!this.balanceCache) {
        console.log("Generating fallback balance data");
        const mockBalances = FallbackDataProvider.getSafeBalances();
        const fallbackData: Record<string, BalanceInfo> = {};
        
        mockBalances.forEach(balance => {
          fallbackData[balance.asset] = {
            available: balance.free,
            total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
            usdValue: balance.asset === 'USDT' ? parseFloat(balance.free) : 0,
            rawAsset: balance.asset,
            isDefault: true
          };
        });
        
        this.balanceCache = fallbackData;
        this.lastCacheTime = Date.now();
      }
      
      this.logManager.addTradingLog("Error fetching balance data. Using cached or sample data.", 'error');
      toast.error("Failed to fetch latest balance data");
      
      return this.balanceCache || {};
    }
  }
}
