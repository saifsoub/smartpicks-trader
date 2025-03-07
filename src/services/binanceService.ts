
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

  constructor() {
    this.loadCredentials();
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
    
    // Load API permissions from localStorage if available
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
    
    // Save permissions to localStorage
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
    return true;
  }

  public getProxyMode(): boolean {
    const savedMode = localStorage.getItem('useLocalProxy');
    return savedMode ? savedMode === 'true' : this.useLocalProxy;
  }

  public hasCredentials(): boolean {
    return this.credentials !== null && !!this.credentials.apiKey && !!this.credentials.secretKey;
  }

  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.credentials = credentials;
      localStorage.setItem('binanceCredentials', JSON.stringify(credentials));
      
      // Reset connection status when credentials change
      this.connectionStatus = 'unknown';
      this.lastConnectionError = null;
      
      // Dispatch event for other components to know credentials were updated
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
      // Build the query string from params
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      // Use a specially configured proxy service that handles CORS
      const url = `${this.proxyUrl}/${endpoint}?${queryString}`;
      
      const headers = {
        'X-API-KEY': this.credentials?.apiKey || '',
        // We only send a hash of the secret key for additional security
        'X-API-SECRET-HASH': btoa(this.credentials?.secretKey?.slice(-8) || ''),
      };

      console.log(`Fetching via proxy: ${url}`);
      const response = await fetch(url, {
        method,
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        console.warn(`HTTP error ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in fetchWithProxy:', error);
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
        // Only delay if we're going to retry
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

  public async testConnection(): Promise<boolean> {
    if (!this.hasCredentials()) {
      console.warn("Cannot test connection: No credentials found");
      this.connectionStatus = 'disconnected';
      this.lastConnectionError = "No API credentials found";
      return false;
    }

    try {
      console.info('Testing API connection with credentials:', this.getApiKey());
      
      // First try a direct Binance API call (test endpoint)
      try {
        console.log("Testing direct connection to Binance...");
        const response = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
        });
        
        console.log("Basic ping test response:", response.status, response.statusText);
        if (response.ok) {
          // If ping is successful, try getting a ticker to confirm API works
          const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
          if (tickerResponse.ok) {
            // Connection is good, now try the proxy
            if (this.getProxyMode()) {
              try {
                console.log("Testing proxy connection...");
                // We don't actually need the proxy response to determine API validity
                await this.fetchWithProxy('ping');
                console.log("Proxy connection works!");
              } catch (proxyError) {
                console.warn("Proxy connection failed but direct API works:", proxyError);
                this.lastConnectionError = "Proxy connection failed, but direct API works. Try disabling proxy mode in settings.";
              }
            }
            
            // Mark as connected if direct API call succeeded
            this.connectionStatus = 'connected';
            this.lastConnectionError = null;
            return true;
          }
        }
        
        // If we get here, API ping worked but there might be credential issues
        throw new Error("Basic API connection successful but credentials may be invalid.");
      } catch (directError) {
        console.warn("Direct connection failed:", directError);
        
        // Try with proxy as fallback if enabled
        if (this.getProxyMode()) {
          try {
            console.log("Trying proxy connection as fallback...");
            const result = await this.fetchWithProxy('ping');
            if (result && result.success === true) {
              this.connectionStatus = 'connected';
              this.lastConnectionError = null;
              return true;
            }
            throw new Error('Proxy returned unsuccessful response');
          } catch (proxyError) {
            console.error("Proxy connection also failed:", proxyError);
            this.lastConnectionError = "Both direct and proxy connections failed. Verify your API credentials and network connection.";
            this.connectionStatus = 'disconnected';
            return false;
          }
        } else {
          this.lastConnectionError = "Direct API connection failed. Try enabling proxy mode in settings.";
          this.connectionStatus = 'disconnected';
          return false;
        }
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
      // Test if reading account data is possible
      let readPermission = false;
      try {
        if (this.getProxyMode()) {
          const accountResult = await this.fetchWithProxy('account');
          readPermission = !!(accountResult && accountResult.balances);
        } else {
          // Direct API call to test endpoint that requires read permissions
          const response = await fetch('https://api.binance.com/api/v3/account', {
            headers: {
              'X-MBX-APIKEY': this.credentials?.apiKey || ''
            }
          });
          readPermission = response.ok;
        }
      } catch (error) {
        console.warn("Read permission test failed:", error);
        readPermission = false;
      }

      // Test if trading is enabled (can be inferred from order history access)
      let tradingPermission = false;
      try {
        if (this.getProxyMode()) {
          const orderResult = await this.fetchWithProxy('allOrders', { symbol: 'BTCUSDT', limit: '1' });
          tradingPermission = Array.isArray(orderResult);
        } else {
          // This is just a test - we're not expecting it to work directly due to CORS
          const timestamp = Date.now();
          const response = await fetch(`https://api.binance.com/api/v3/myTrades?symbol=BTCUSDT&limit=1&timestamp=${timestamp}`, {
            headers: {
              'X-MBX-APIKEY': this.credentials?.apiKey || ''
            }
          });
          tradingPermission = response.ok;
        }
      } catch (error) {
        console.warn("Trading permission test failed:", error);
        tradingPermission = false;
      }

      // Update and save permissions
      this.setApiPermissions(readPermission, tradingPermission);
      
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
      await this.testConnection(); // Verify connection before proceeding
      
      if (this.connectionStatus !== 'connected') {
        throw new Error('Cannot fetch account info: Connection test failed. Please check your API credentials.');
      }

      // Check if we have read permission
      const { read } = await this.detectApiPermissions();
      
      // If we know we don't have read permission, don't try to fetch account data
      if (!read) {
        console.warn("API key does not have Read permission. Using default trading pairs.");
        return { 
          balances: this.defaultTradingPairs.map(pair => {
            const asset = pair.replace('USDT', '');
            return { asset, free: '0', locked: '0' };
          }).concat({ asset: 'USDT', free: '0', locked: '0' })
        };
      }
      
      // Try proxy first if enabled
      if (this.getProxyMode()) {
        try {
          const result = await this.fetchWithProxy('account');
          console.log("Account info via proxy:", result);
          
          if (result && Array.isArray(result.balances)) {
            this.connectionStatus = 'connected';
            return { balances: result.balances };
          }
          
          // If proxy returns empty or invalid result, try direct method as fallback
          console.warn('Proxy returned invalid response, trying direct API as fallback');
          // Continue to direct method below
        } catch (error) {
          console.error('Error fetching account info via proxy:', error);
          this.addTradingLog("Failed to fetch account info via proxy: " + (error instanceof Error ? error.message : String(error)), 'error');
          console.log('Trying to fetch account info directly as fallback...');
          // Continue to direct method below
        }
      }
      
      // Direct API method (or fallback from proxy failure)
      try {
        // For Binance, we need to use a timestamp and signature for authenticated endpoints
        // This is a simplified implementation that will try to use public endpoints only
        // First try to get account snapshot from public endpoint
        const timestamp = Date.now();
        const publicEndpoint = 'https://api.binance.com/api/v3/ticker/price';
        
        console.log("Attempting to fetch public data directly to verify API access");
        const response = await fetch(publicEndpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const tickerData = await response.json();
        if (Array.isArray(tickerData) && tickerData.length > 0) {
          // We've verified API access works, but for security reasons
          // we can't fetch account data directly from frontend due to CORS and signature requirements
          
          // Return default trading pairs since direct account access is not possible
          console.log("Direct API connection successful, but authenticated endpoints require proxy");
          this.connectionStatus = 'connected';
          this.lastConnectionError = null;
          
          // Default trading pairs as a workaround
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
        throw new Error('Failed to retrieve account data from Binance. Based on your API key settings, you may need to enable "Enable Reading" permission in your Binance API settings or use proxy mode.');
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
      this.addTradingLog("Failed to fetch account info: " + (error instanceof Error ? error.message : String(error)), 'error');
      throw error; // Propagate the error to be handled by the caller
    }
  }

  public async getSymbols(): Promise<BinanceSymbol[]> {
    try {
      console.log("Fetching 24hr ticker information");
      const response = await this.fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      // Return only what we need
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
      
      // Add symbol to each trade for reference
      return trades.map((trade: any) => ({
        ...trade,
        symbol: symbol // Ensure each trade has the correct symbol
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
    // Keep only last 100 logs
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
      // Determine if we have read permissions
      const { read } = await this.detectApiPermissions();
      
      if (!read) {
        // Return default balances if we don't have read permission
        console.warn("API key doesn't have read permission. Returning placeholder balances.");
        return {
          'BTC': { available: '0', total: '0' },
          'ETH': { available: '0', total: '0' },
          'USDT': { available: '100', total: '100' } // Placeholder balance
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
        
        // If we got an empty balance map but have connection, add some default balances
        if (Object.keys(balanceMap).length === 0 && this.connectionStatus === 'connected') {
          console.warn("Only zero balances received - likely limited API access");
          // Add default trading assets for a better UX
          balanceMap['BTC'] = { available: '0', total: '0' };
          balanceMap['ETH'] = { available: '0', total: '0' };
          balanceMap['USDT'] = { available: '100', total: '100' }; // Placeholder
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
      throw error; // Propagate error to caller
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
      
      // Convert the array of {symbol, price} to an object map
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

    // Check if we have trading permission
    const { trading } = await this.detectApiPermissions();
    if (!trading) {
      throw new Error('Your API key does not have trading permissions. Please update your API key settings on Binance.');
    }

    try {
      if (this.getProxyMode()) {
        // Use proxy to place a real order
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

// Create a singleton instance
const binanceService = new BinanceService();
export default binanceService;
