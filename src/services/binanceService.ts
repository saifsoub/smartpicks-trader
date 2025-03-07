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
  private tradingLogs: { timestamp: Date; message: string; type: 'info' | 'success' | 'error' }[] = [];
  private proxyUrl: string = 'https://binance-proxy.vercel.app/api';
  private useLocalProxy: boolean = true;
  private connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  private lastConnectionError: string | null = null;
  private readPermission: boolean = false;
  private tradingPermission: boolean = false;
  private defaultTradingPairs: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  private lastProxyConnectionAttempt: number = 0;
  private proxyConnectionSuccessful: boolean = false;

  constructor() {
    this.loadCredentials();
    this.useLocalProxy = localStorage.getItem('useLocalProxy') !== 'false';
  }

  private loadCredentials() {
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      try {
        this.credentials = JSON.parse(savedCredentials);
        console.log("Credentials loaded successfully:", this.credentials ? "API Key found" : "No API key");
      } catch (error) {
        console.error("Failed to parse credentials from localStorage:", error);
        localStorage.removeItem('binanceCredentials');
        this.credentials = null;
      }
    }
    
    const savedPermissions = localStorage.getItem('binanceApiPermissions');
    if (savedPermissions) {
      try {
        const permissions = JSON.parse(savedPermissions);
        this.readPermission = permissions.read || false;
        this.tradingPermission = permissions.trading || false;
      } catch (error) {
        console.error("Failed to parse API permissions:", error);
      }
    }
  }

  public setApiPermissions(readPermission: boolean, tradingPermission: boolean): void {
    this.readPermission = readPermission;
    this.tradingPermission = tradingPermission;
    
    localStorage.setItem('binanceApiPermissions', JSON.stringify({
      read: readPermission,
      trading: tradingPermission
    }));
    
    console.log(`API permissions set: Read=${readPermission}, Trading=${tradingPermission}`);
  }
  
  public getApiPermissions(): { read: boolean, trading: boolean } {
    return {
      read: this.readPermission,
      trading: this.tradingPermission
    };
  }

  public setProxyMode(useLocalProxy: boolean) {
    this.useLocalProxy = useLocalProxy;
    localStorage.setItem('useLocalProxy', String(useLocalProxy));
    console.log(`Proxy mode set to: ${useLocalProxy ? 'Local Proxy' : 'Direct API'}`);
    
    this.connectionStatus = 'unknown';
    this.lastConnectionError = null;
    this.proxyConnectionSuccessful = false;
    
    return true;
  }

  public getProxyMode(): boolean {
    return this.useLocalProxy;
  }

  public hasCredentials(): boolean {
    return this.credentials !== null && !!this.credentials.apiKey && !!this.credentials.secretKey;
  }

  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.credentials = credentials;
      localStorage.setItem('binanceCredentials', JSON.stringify(credentials));
      
      this.connectionStatus = 'unknown';
      this.lastConnectionError = null;
      
      window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      
      console.log("Credentials saved successfully");
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  public getApiKey(): string {
    return this.credentials?.apiKey || '';
  }

  public getLastConnectionError(): string | null {
    return this.lastConnectionError;
  }

  private async fetchWithProxy(endpoint: string, params: Record<string, string> = {}, method: string = 'GET'): Promise<any> {
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.proxyUrl}/${endpoint}?${queryString}`;
      
      const headers = {
        'X-API-KEY': this.credentials?.apiKey || '',
        'X-API-SECRET-HASH': btoa(this.credentials?.secretKey?.slice(-8) || ''),
      };

      console.log(`Fetching via proxy: ${url}`);
      this.lastProxyConnectionAttempt = Date.now();
      
      const response = await fetch(url, {
        method,
        headers,
        mode: 'cors',
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.warn(`HTTP error ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.proxyConnectionSuccessful = true;
      return data;
    } catch (error) {
      console.error('Error in fetchWithProxy:', error);
      this.proxyConnectionSuccessful = false;
      throw error;
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}: Fetching ${url}`);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          console.warn(`HTTP error ${response.status}: ${response.statusText}`);
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        console.log(`Request to ${url} successful`);
        return response;
      } catch (error) {
        console.warn(`API request failed (attempt ${attempt + 1}/${retries}):`, error);
        lastError = error;
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.error(`All ${retries} attempts to ${url} failed`);
    throw lastError;
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'unknown' {
    return this.connectionStatus;
  }

  public isProxyWorking(): boolean {
    return this.proxyConnectionSuccessful;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.hasCredentials()) {
      console.warn("Cannot test connection: No credentials found");
      this.connectionStatus = 'disconnected';
      this.lastConnectionError = "No API credentials found";
      return false;
    }

    try {
      console.info('Testing API connection with credentials:', this.getApiKey());
      
      let directApiWorks = false;
      let proxyWorks = false;
      
      try {
        console.log("Testing direct connection to Binance...");
        const response = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        console.log("Basic ping test response:", response.status, response.statusText);
        if (response.ok) {
          directApiWorks = true;
          const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
          if (tickerResponse.ok) {
            this.connectionStatus = 'connected';
          }
        }
      } catch (directError) {
        console.warn("Direct connection failed:", directError);
        directApiWorks = false;
      }
      
      if (this.getProxyMode() || !directApiWorks) {
        try {
          console.log("Testing proxy connection...");
          const result = await this.fetchWithProxy('ping');
          if (result && (result.success === true || result.serverTime)) {
            proxyWorks = true;
            this.proxyConnectionSuccessful = true;
            if (!directApiWorks) {
              console.log("Proxy connection works but direct API failed");
            }
          }
        } catch (proxyError) {
          console.warn("Proxy connection failed:", proxyError);
          proxyWorks = false;
          this.proxyConnectionSuccessful = false;
        }
      }
      
      if (directApiWorks || proxyWorks) {
        this.connectionStatus = 'connected';
        this.lastConnectionError = null;
        
        await this.detectApiPermissions();
        
        if (!this.readPermission) {
          this.lastConnectionError = "Connected to API, but your key doesn't have account data access. Please enable 'Enable Reading' permission for your API key on Binance.";
        } else if (!proxyWorks && this.getProxyMode()) {
          this.lastConnectionError = "API connected, but proxy mode is having issues. You may need to disable proxy mode if you don't need it.";
        }
        
        return true;
      } else {
        this.connectionStatus = 'disconnected';
        if (this.getProxyMode()) {
          this.lastConnectionError = "Both direct API and proxy connections failed. Check your network connection and API credentials.";
        } else {
          this.lastConnectionError = "API connection failed. Try enabling proxy mode in settings, which helps bypass CORS restrictions.";
        }
        return false;
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      this.lastConnectionError = error instanceof Error ? error.message : String(error);
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  public isInTestMode(): boolean {
    return false;
  }

  public getDefaultTradingPairs(): string[] {
    return [...this.defaultTradingPairs];
  }

  public async detectApiPermissions(): Promise<{ read: boolean, trading: boolean }> {
    if (!this.hasCredentials()) {
      return { read: false, trading: false };
    }

    try {
      let readPermission = false;
      try {
        if (this.getProxyMode()) {
          const accountResult = await this.fetchWithProxy('account');
          readPermission = !!(accountResult && accountResult.balances);
          console.log("Read permission test via proxy:", readPermission);
        } else {
          const response = await fetch('https://api.binance.com/api/v3/account', {
            headers: {
              'X-MBX-APIKEY': this.credentials?.apiKey || ''
            }
          });
          readPermission = response.ok;
          console.log("Read permission test via direct API:", readPermission);
        }
      } catch (error) {
        console.warn("Read permission test failed:", error);
        readPermission = false;
      }

      let tradingPermission = false;
      try {
        if (this.getProxyMode()) {
          const orderResult = await this.fetchWithProxy('allOrders', { symbol: 'BTCUSDT', limit: '1' });
          tradingPermission = Array.isArray(orderResult);
          console.log("Trading permission test via proxy:", tradingPermission);
        } else {
          const timestamp = Date.now();
          const response = await fetch(`https://api.binance.com/api/v3/myTrades?symbol=BTCUSDT&limit=1&timestamp=${timestamp}`, {
            headers: {
              'X-MBX-APIKEY': this.credentials?.apiKey || ''
            }
          });
          tradingPermission = response.ok;
          console.log("Trading permission test via direct API:", tradingPermission);
        }
      } catch (error) {
        console.warn("Trading permission test failed:", error);
        tradingPermission = false;
      }

      this.setApiPermissions(readPermission, tradingPermission);
      
      this.addTradingLog(`API permissions detected - Read: ${readPermission ? 'Yes' : 'No'}, Trading: ${tradingPermission ? 'Yes' : 'No'}`, 'info');
      
      return { read: readPermission, trading: tradingPermission };
    } catch (error) {
      console.error("Error detecting API permissions:", error);
      return { read: false, trading: false };
    }
  }

  public async getAccountInfo(): Promise<{ balances: BinanceBalance[] }> {
    if (!this.hasCredentials()) {
      console.error("Cannot get account info: No credentials found");
      throw new Error('API credentials not configured');
    }

    try {
      console.log("Attempting to fetch account info");
      await this.testConnection();
      
      if (this.connectionStatus !== 'connected') {
        throw new Error('Cannot fetch account info: Connection test failed. Please check your API credentials.');
      }

      const { read } = this.getApiPermissions();
      
      if (!read) {
        const permissions = await this.detectApiPermissions();
        if (!permissions.read) {
          console.warn("API key does not have Read permission. Using default trading pairs.");
          this.addTradingLog("Your API key doesn't have permission to read account data. Default trading pairs will be used.", 'error');
          
          return { 
            balances: this.defaultTradingPairs.map(pair => {
              const asset = pair.replace('USDT', '');
              return { asset, free: '0', locked: '0' };
            }).concat({ asset: 'USDT', free: '0', locked: '0' })
          };
        }
      }
      
      if (this.getProxyMode()) {
        try {
          const result = await this.fetchWithProxy('account');
          console.log("Account info via proxy:", result);
          
          if (result && Array.isArray(result.balances)) {
            this.connectionStatus = 'connected';
            this.addTradingLog("Successfully retrieved account balances", 'success');
            return { balances: result.balances };
          }
          
          console.warn('Proxy returned invalid response, trying direct API as fallback');
          console.log('Trying to fetch account info directly as fallback...');
          continue;
        } catch (error) {
          console.error('Error fetching account info via proxy:', error);
          this.addTradingLog("Failed to fetch account info via proxy: " + (error instanceof Error ? error.message : String(error)), 'error');
          
          if (!this.proxyConnectionSuccessful) {
            this.addTradingLog("Proxy connection is not working. Try disabling proxy mode if you don't need it.", 'info');
          }
          
          console.log('Trying to fetch account info directly as fallback...');
        }
      }
      
      try {
        const timestamp = Date.now();
        const publicEndpoint = 'https://api.binance.com/api/v3/ticker/price';
        
        console.log("Attempting to fetch public data directly to verify API access");
        const response = await fetch(publicEndpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const tickerData = await response.json();
        if (Array.isArray(tickerData) && tickerData.length > 0) {
          this.connectionStatus = 'connected';
          this.lastConnectionError = "API connection successful, but your browser cannot fetch account data directly due to security restrictions. Enable proxy mode in settings.";
          this.addTradingLog("Account data requires proxy mode - enable it in settings.", 'info');
          
          return { 
            balances: this.defaultTradingPairs.map(pair => {
              const asset = pair.replace('USDT', '');
              return { asset, free: '0', locked: '0' };
            }).concat({ asset: 'USDT', free: '0', locked: '0' })
          };
        }
        
        throw new Error('Invalid response from Binance API');
      } catch (directError) {
        console.error('Error fetching account info directly:', directError);
        this.connectionStatus = 'disconnected';
        
        if (!this.getProxyMode()) {
          throw new Error('Failed to retrieve account data. Enable proxy mode in settings to access your account data securely.');
        } else {
          throw new Error('Failed to retrieve account data from Binance. Verify your API key has "Enable Reading" permission in your Binance API settings.');
        }
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
      this.addTradingLog("Failed to fetch account info: " + (error instanceof Error ? error.message : String(error)), 'error');
      throw error;
    }
  }

  public async getSymbols(): Promise<BinanceSymbol[]> {
    try {
      console.log("Fetching 24hr ticker information");
      const response = await this.fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      return data.map((item: any) => ({
        symbol: item.symbol,
        priceChangePercent: item.priceChangePercent
      }));
    } catch (error) {
      console.error('Error fetching symbols:', error);
      throw new Error('Could not fetch market symbols. Please try again later.');
    }
  }

  public async getRecentTrades(symbol: string): Promise<any[]> {
    try {
      console.log(`Fetching recent trades for ${symbol}`);
      const response = await this.fetchWithRetry(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=10`);
      const trades = await response.json();
      
      return trades.map((trade: any) => ({
        ...trade,
        symbol: symbol
      }));
    } catch (error) {
      console.error(`Error fetching recent trades for ${symbol}:`, error);
      throw new Error(`Could not fetch recent trades for ${symbol}. Please try again later.`);
    }
  }

  public getTradingLogs() {
    return [...this.tradingLogs];
  }

  public clearTradingLogs() {
    this.tradingLogs = [];
  }

  private addTradingLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.tradingLogs.unshift({ timestamp: new Date(), message, type });
    if (this.tradingLogs.length > 100) {
      this.tradingLogs.pop();
    }
  }

  public async getAccountBalance(): Promise<Record<string, BalanceInfo>> {
    console.log("Getting account balance");
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const { read } = await this.detectApiPermissions();
      
      if (!read) {
        console.warn("API key doesn't have read permission or proxy isn't working. Returning placeholder balances.");
        this.addTradingLog("Your API key doesn't have permission to read account data or proxy mode is needed.", 'error');
        
        if (!this.getProxyMode()) {
          this.addTradingLog("Try enabling proxy mode in settings to access your account data securely.", 'info');
        }
        
        return {
          'BTC': { available: '0', total: '0' },
          'ETH': { available: '0', total: '0' },
          'USDT': { available: '100', total: '100' }
        };
      }
      
      const accountInfo = await this.getAccountInfo();
      console.log("Account info received:", accountInfo);
      
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
        
        if (Object.keys(balanceMap).length === 0 && this.connectionStatus === 'connected') {
          console.warn("Only zero balances received - likely limited API access");
          this.addTradingLog("Connection successful, but no non-zero balances found in your account.", 'info');
          
          balanceMap['BTC'] = { available: '0', total: '0' };
          balanceMap['ETH'] = { available: '0', total: '0' };
          balanceMap['USDT'] = { available: '100', total: '100' };
        } else if (Object.keys(balanceMap).length > 0) {
          this.addTradingLog(`Successfully retrieved ${Object.keys(balanceMap).length} assets with non-zero balances`, 'success');
        }
        
        console.log("Processed balance map:", balanceMap);
        this.connectionStatus = 'connected';
        return balanceMap;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching account balance:', error);
      this.addTradingLog("Failed to fetch account balance", 'error');
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }

  public async getPrices(): Promise<Record<string, string>> {
    try {
      console.log("Fetching current prices");
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');
      
      if (!response.ok) {
        throw new Error(`Error fetching prices: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const priceMap: Record<string, string> = {};
      for (const item of data) {
        priceMap[item.symbol] = item.price;
      }
      
      console.log("Fetched prices for", Object.keys(priceMap).length, "symbols");
      return priceMap;
    } catch (error) {
      console.error('Error fetching prices:', error);
      this.addTradingLog("Failed to fetch current prices", 'error');
      throw new Error('Could not fetch current market prices. Please try again later.');
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

    const { trading } = await this.detectApiPermissions();
    if (!trading) {
      throw new Error('Your API key does not have trading permissions. Please update your API key settings on Binance.');
    }

    try {
      if (this.getProxyMode()) {
        const params = {
          symbol,
          side,
          type: 'MARKET',
          quantity
        };
        
        console.log(`Placing ${side} market order for ${quantity} ${symbol} via proxy`);
        this.addTradingLog(`${side} ${quantity} ${symbol} at market price`, 'info');
        
        const result = await this.fetchWithProxy('order', params, 'POST');
        this.addTradingLog(`Order ${result.orderId || 'unknown'} ${result.status || 'PENDING'}`, 'success');
        return result;
      } else {
        throw new Error('Direct API access is blocked. Please enable proxy mode in settings to place real orders.');
      }
    } catch (error) {
      console.error('Error placing market order:', error);
      this.addTradingLog(`Failed to place ${side} order for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  public async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      console.log(`Fetching klines for ${symbol} (${interval})`);
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching klines:', error);
      this.addTradingLog(`Failed to fetch klines for ${symbol}`, 'error');
      throw new Error(`Could not fetch chart data for ${symbol}. Please try again later.`);
    }
  }
}

const binanceService = new BinanceService();
export default binanceService;
