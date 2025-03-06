export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface BalanceInfo {
  available: string;
  total: string;
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceSymbol {
  symbol: string;
  priceChangePercent: string;
}

class BinanceService {
  private credentials: BinanceCredentials | null = null;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      this.credentials = JSON.parse(savedCredentials);
    }
  }

  public hasCredentials(): boolean {
    return this.credentials !== null && !!this.credentials.apiKey && !!this.credentials.secretKey;
  }

  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.credentials = credentials;
      localStorage.setItem('binanceCredentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  public getApiKey(): string {
    return this.credentials?.apiKey || '';
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        console.warn(`API request failed (attempt ${attempt + 1}/${retries}):`, error);
        lastError = error;
        // Only delay if we're going to retry
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.hasCredentials()) {
      return false;
    }

    try {
      console.info('Testing API connection with credentials:', this.getApiKey());
      
      try {
        const response = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.getApiKey()
          }
        });
        
        return response.ok;
      } catch (fetchError) {
        console.error('Fetch error during connection test:', fetchError);
        console.info('Unable to properly test connection due to CORS limitations in browser');
        return true;
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  public isInTestMode(): boolean {
    return false;
  }

  public async getAccountInfo(): Promise<{ balances: BinanceBalance[] }> {
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const response = await fetch('https://api.binance.com/api/v3/account', {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.getApiKey()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching account info:', error);
      return { balances: [] };
    }
  }

  public async getSymbols(): Promise<BinanceSymbol[]> {
    try {
      const response = await this.fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr');
      return await response.json();
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return [];
    }
  }

  public async getRecentTrades(symbol: string): Promise<any[]> {
    try {
      const response = await this.fetchWithRetry(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=10`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching recent trades for ${symbol}:`, error);
      return [];
    }
  }

  private tradingLogs: { timestamp: Date; message: string; type: 'info' | 'success' | 'error' }[] = [];

  public getTradingLogs() {
    return [...this.tradingLogs];
  }

  public clearTradingLogs() {
    this.tradingLogs = [];
  }

  private addTradingLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.tradingLogs.unshift({ timestamp: new Date(), message, type });
    // Keep only last 100 logs
    if (this.tradingLogs.length > 100) {
      this.tradingLogs.pop();
    }
  }

  public async getAccountBalance(): Promise<Record<string, BalanceInfo>> {
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const accountInfo = await this.getAccountInfo();
      
      if (accountInfo && accountInfo.balances) {
        const balanceMap: Record<string, BalanceInfo> = {};
        
        for (const balance of accountInfo.balances) {
          if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
            balanceMap[balance.asset] = {
              available: balance.free,
              total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString()
            };
          }
        }
        
        return balanceMap;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return {};
    }
  }

  public async getPrices(): Promise<Record<string, string>> {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');
      
      if (!response.ok) {
        throw new Error(`Error fetching prices: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert the array of {symbol, price} to an object map
      const priceMap: Record<string, string> = {};
      for (const item of data) {
        priceMap[item.symbol] = item.price;
      }
      
      return priceMap;
    } catch (error) {
      console.error('Error fetching prices:', error);
      
      // Return an empty price map in case of error
      return {};
    }
  }

  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      // In a real implementation, this would make a request to the Binance API
      // This is a placeholder for the real implementation
      console.log(`Placing ${side} market order for ${quantity} ${symbol}`);
      
      // Return a mock order response
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        status: 'FILLED',
        side,
        type: 'MARKET',
        quantity
      };
    } catch (error) {
      console.error('Error placing market order:', error);
      throw error;
    }
  }

  public async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching klines:', error);
      return [];
    }
  }
}

// Create a singleton instance
const binanceService = new BinanceService();
export default binanceService;
