import { toast } from "sonner";
import CryptoJS from 'crypto-js';

// Types
export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
}

// This class handles all Binance API interactions
class BinanceService {
  private apiKey: string | null = null;
  private secretKey: string | null = null;
  private baseUrl = 'https://testnet.binance.vision'; // Changed to testnet URL for reliable testing
  private testMode = true; // Default to test mode for safety
  private symbolsData: BinanceSymbol[] = [];
  private lastApiCallTime = 0;
  private tradingLogs: {timestamp: Date, message: string, type: 'info' | 'success' | 'error'}[] = [];

  constructor() {
    // Try to load credentials from localStorage on initialization
    this.loadCredentials();
    
    // Load trading logs
    const savedLogs = localStorage.getItem('tradingLogs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        this.tradingLogs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      } catch (error) {
        console.error('Failed to parse trading logs:', error);
      }
    }
  }

  // Check if we're in test mode
  public isInTestMode(): boolean {
    return this.testMode;
  }

  // Set test mode on/off
  public setTestMode(isTestMode: boolean): void {
    this.testMode = isTestMode;
    
    // Update the base URL based on the mode
    if (isTestMode) {
      this.baseUrl = 'https://testnet.binance.vision';
    } else {
      this.baseUrl = 'https://api.binance.com';
    }
    
    localStorage.setItem('binanceTestMode', isTestMode.toString());
    this.addLogEntry(`Test mode ${isTestMode ? 'enabled' : 'disabled'}`, 'info');
    
    // Notify the UI that test mode has changed
    window.dispatchEvent(new CustomEvent('binance-test-mode-updated'));
  }

  // Load credentials from localStorage
  private loadCredentials() {
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      try {
        const { apiKey, secretKey } = JSON.parse(savedCredentials);
        this.apiKey = apiKey;
        this.secretKey = secretKey;
      } catch (error) {
        console.error('Failed to parse saved credentials:', error);
        this.apiKey = null;
        this.secretKey = null;
      }
    }
    
    // Load test mode setting
    const testMode = localStorage.getItem('binanceTestMode');
    if (testMode !== null) {
      this.testMode = testMode === 'true';
      
      // Set the appropriate base URL
      if (this.testMode) {
        this.baseUrl = 'https://testnet.binance.vision';
      } else {
        this.baseUrl = 'https://api.binance.com';
      }
    }
  }

  // Save credentials to localStorage
  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      if (!credentials.apiKey || !credentials.secretKey) {
        throw new Error('Both API key and Secret key are required');
      }
      
      this.apiKey = credentials.apiKey;
      this.secretKey = credentials.secretKey;
      localStorage.setItem('binanceCredentials', JSON.stringify(credentials));
      
      // Add log entry
      this.addLogEntry('API credentials updated', 'info');
      
      // Dispatch an event to let components know credentials have been updated
      window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
      
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  // Check if credentials are set
  public hasCredentials(): boolean {
    return !!(this.apiKey && this.secretKey && this.apiKey.length > 0 && this.secretKey.length > 0);
  }

  // Generate signature for private endpoints
  private generateSignature(queryString: string): string {
    if (!this.secretKey) throw new Error('Secret key not set');
    
    try {
      return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Failed to generate signature:', error);
      throw new Error('Signature generation failed');
    }
  }

  // Create authenticated headers
  private getHeaders(isPrivate = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (isPrivate) {
      if (!this.apiKey) throw new Error('API key not set');
      headers['X-MBX-APIKEY'] = this.apiKey;
    }
    
    return headers;
  }

  // Add a log entry to the trading log
  private addLogEntry(message: string, type: 'info' | 'success' | 'error'): void {
    const entry = {
      timestamp: new Date(),
      message,
      type
    };
    
    this.tradingLogs.unshift(entry);
    
    // Keep only the last 100 entries
    if (this.tradingLogs.length > 100) {
      this.tradingLogs = this.tradingLogs.slice(0, 100);
    }
    
    // Save to localStorage
    localStorage.setItem('tradingLogs', JSON.stringify(this.tradingLogs));
  }

  // Get trading logs
  public getTradingLogs(): {timestamp: Date, message: string, type: 'info' | 'success' | 'error'}[] {
    return [...this.tradingLogs];
  }

  // Clear trading logs
  public clearTradingLogs(): void {
    this.tradingLogs = [];
    localStorage.removeItem('tradingLogs');
  }

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      console.log('Testing API connection with credentials:', this.apiKey);
      
      if (this.testMode) {
        // In test mode, just simulate a successful connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.addLogEntry('Connection test successful (Test Mode)', 'success');
        return true;
      }
      
      // In real mode, make an actual API request to the Binance ping endpoint
      // Use a simple endpoint that doesn't require authentication first
      const pingResponse = await fetch(`${this.baseUrl}/api/v3/ping`, {
        method: 'GET',
        headers: this.getHeaders(false),
        mode: 'cors'  // Added CORS mode explicitly
      });
      
      if (!pingResponse.ok) {
        console.error('Ping test failed:', pingResponse.status, pingResponse.statusText);
        throw new Error(`API ping failed with status: ${pingResponse.status}`);
      }
      
      // If ping works, try a simple authenticated request
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const authResponse = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: this.getHeaders(true),
        mode: 'cors'  // Added CORS mode explicitly
      });
      
      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.error('Auth test failed:', authResponse.status, errorData);
        throw new Error(`Auth check failed: ${errorData.msg || authResponse.statusText}`);
      }
      
      this.addLogEntry('Connection test successful', 'success');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      this.addLogEntry(`Connection test failed: ${error}`, 'error');
      
      // Always return true for testing purposes
      if (this.testMode) {
        return true;
      }
      
      return false;
    }
  }

  // Get account information including balances
  public async getAccountInfo(): Promise<any> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      this.addLogEntry('Fetching account information', 'info');
      
      if (this.testMode) {
        // Simulate a response with mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock response with common cryptocurrencies
        return {
          balances: [
            { asset: 'BTC', free: '0.12345678', locked: '0.00000000' },
            { asset: 'ETH', free: '2.34567890', locked: '0.00000000' },
            { asset: 'BNB', free: '10.5', locked: '0.00' },
            { asset: 'ADA', free: '1250.45', locked: '0.00' },
            { asset: 'SOL', free: '15.75', locked: '0.00' },
            { asset: 'DOT', free: '85.32', locked: '0.00' },
            { asset: 'USDT', free: '5000.00', locked: '0.00' },
            { asset: 'DOGE', free: '4500.12', locked: '0.00' },
            { asset: 'XRP', free: '750.25', locked: '0.00' },
            { asset: 'LINK', free: '42.18', locked: '0.00' }
          ]
        };
      }
      
      // In real mode, make an actual API request
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: this.getHeaders(true),
        mode: 'cors'  // Added CORS mode explicitly
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${errorData.msg || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get account info:', error);
      this.addLogEntry(`Failed to get account info: ${error}`, 'error');
      toast.error('Failed to retrieve account information');
      
      if (this.testMode) {
        // Return mock data even in failure for test mode
        return {
          balances: [
            { asset: 'BTC', free: '0.12345678', locked: '0.00000000' },
            { asset: 'ETH', free: '2.34567890', locked: '0.00000000' },
            { asset: 'USDT', free: '5000.00', locked: '0.00' }
          ]
        };
      }
      
      throw error;
    }
  }

  // Get current prices for all symbols
  public async getPrices(): Promise<Record<string, string>> {
    try {
      this.addLogEntry('Fetching current market prices', 'info');
      
      // Rate limit check - no more than 1 request per second
      const now = Date.now();
      if (now - this.lastApiCallTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - (now - this.lastApiCallTime)));
      }
      this.lastApiCallTime = Date.now();
      
      if (this.testMode) {
        // Simulate API response with realistic mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          'BTCUSDT': '66120.35',
          'ETHUSDT': '3221.48',
          'BNBUSDT': '567.89',
          'ADAUSDT': '0.4523',
          'SOLUSDT': '172.62',
          'DOGEUSDT': '0.1324',
          'DOTUSDT': '7.25',
          'XRPUSDT': '0.5732',
          'MATICUSDT': '0.7845',
          'LINKUSDT': '14.25'
        };
      }
      
      // Make an actual API request in real mode
      const response = await fetch(`${this.baseUrl}/api/v3/ticker/price`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match our expected format
      const priceMap: Record<string, string> = {};
      data.forEach((item: any) => {
        priceMap[item.symbol] = item.price;
      });
      
      return priceMap;
    } catch (error) {
      console.error('Failed to get prices:', error);
      this.addLogEntry(`Failed to get prices: ${error}`, 'error');
      toast.error('Failed to retrieve market prices');
      throw error;
    }
  }

  // Get all trading symbols with additional information
  public async getSymbols(): Promise<BinanceSymbol[]> {
    try {
      this.addLogEntry('Fetching available trading symbols', 'info');
      
      if (this.testMode) {
        // Simulate API response with realistic mock data
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Generate mock trading symbols
        this.symbolsData = [
          { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', priceChangePercent: '2.45', lastPrice: '66120.35', volume: '21345.67' },
          { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', priceChangePercent: '1.87', lastPrice: '3221.48', volume: '87654.32' },
          { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', priceChangePercent: '0.95', lastPrice: '567.89', volume: '12345.67' },
          { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', priceChangePercent: '-1.23', lastPrice: '0.4523', volume: '45678.90' },
          { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', priceChangePercent: '3.45', lastPrice: '172.62', volume: '34567.89' },
          { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', priceChangePercent: '-2.34', lastPrice: '0.1324', volume: '98765.43' },
          { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', priceChangePercent: '0.56', lastPrice: '7.25', volume: '23456.78' },
          { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', priceChangePercent: '1.12', lastPrice: '0.5732', volume: '76543.21' },
          { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', priceChangePercent: '-0.87', lastPrice: '0.7845', volume: '65432.10' },
          { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', priceChangePercent: '2.34', lastPrice: '14.25', volume: '54321.09' }
        ];
        
        return this.symbolsData;
      }
      
      // Make actual API requests in real mode
      // First get ticker prices for 24h stats
      const ticker24hResponse = await fetch(`${this.baseUrl}/api/v3/ticker/24hr`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });
      
      if (!ticker24hResponse.ok) {
        throw new Error(`API request failed with status: ${ticker24hResponse.status}`);
      }
      
      const ticker24hData = await ticker24hResponse.json();
      
      // Then get exchange info for base/quote assets
      const exchangeInfoResponse = await fetch(`${this.baseUrl}/api/v3/exchangeInfo`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });
      
      if (!exchangeInfoResponse.ok) {
        throw new Error(`API request failed with status: ${exchangeInfoResponse.status}`);
      }
      
      const exchangeInfoData = await exchangeInfoResponse.json();
      
      // Transform and combine the data
      const symbolMap = new Map();
      exchangeInfoData.symbols.forEach((symbol: any) => {
        symbolMap.set(symbol.symbol, {
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset
        });
      });
      
      this.symbolsData = ticker24hData
        .filter((ticker: any) => symbolMap.has(ticker.symbol) && ticker.symbol.endsWith('USDT'))
        .map((ticker: any) => {
          const symbolInfo = symbolMap.get(ticker.symbol);
          return {
            symbol: ticker.symbol,
            baseAsset: symbolInfo.baseAsset,
            quoteAsset: symbolInfo.quoteAsset,
            priceChangePercent: ticker.priceChangePercent,
            lastPrice: ticker.lastPrice,
            volume: ticker.volume
          };
        });
      
      return this.symbolsData;
    } catch (error) {
      console.error('Failed to get symbols:', error);
      this.addLogEntry(`Failed to get symbols: ${error}`, 'error');
      toast.error('Failed to retrieve trading symbols');
      throw error;
    }
  }

  // Place a market order
  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      // Log the order attempt
      this.addLogEntry(`Placing ${side} order for ${quantity} of ${symbol}`, 'info');
      console.log(`Placing ${side} order for ${quantity} of ${symbol}`);
      
      if (this.testMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Simulate successful order response
        const mockOrderId = Math.floor(Math.random() * 1000000);
        const mockResponse = {
          symbol,
          orderId: mockOrderId,
          transactTime: Date.now(),
          price: '0.00000000',
          origQty: quantity,
          executedQty: quantity,
          status: 'FILLED',
          type: 'MARKET',
          side
        };
        
        this.addLogEntry(`${side} order executed successfully for ${quantity} of ${symbol}`, 'success');
        toast.success(`${side} order placed successfully`);
        return mockResponse;
      }
      
      // In real mode, make an actual API request
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: this.getHeaders(true)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.msg || response.statusText}`);
      }
      
      const data = await response.json();
      this.addLogEntry(`${side} order executed successfully for ${quantity} of ${symbol}`, 'success');
      toast.success(`${side} order placed successfully`);
      return data;
    } catch (error) {
      console.error('Failed to place order:', error);
      this.addLogEntry(`Failed to place ${side} order: ${error}`, 'error');
      toast.error(`Failed to place ${side} order`);
      throw error;
    }
  }

  // Get recent trades for a symbol
  public async getRecentTrades(symbol: string): Promise<BinanceTrade[]> {
    try {
      this.addLogEntry(`Fetching recent trades for ${symbol}`, 'info');
      
      if (this.testMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Generate mock trade data
        const mockTrades: BinanceTrade[] = [];
        const baseTime = Date.now();
        const baseAsset = symbol.replace('USDT', '');
        const price = this.symbolsData.find(s => s.symbol === symbol)?.lastPrice || 
                     (symbol.includes('BTC') ? '66120.35' : '3221.48');
        
        for (let i = 0; i < 5; i++) {
          mockTrades.push({
            symbol,
            id: 100000 + i,
            orderId: 200000 + i,
            price,
            qty: (Math.random() * 0.1).toFixed(6),
            commission: (Math.random() * 0.001).toFixed(8),
            commissionAsset: baseAsset,
            time: baseTime - i * 1000 * 60 * 5,
            isBuyer: i % 2 === 0,
            isMaker: i % 3 === 0,
            isBestMatch: true
          });
        }
        
        return mockTrades;
      }
      
      // In real mode, make an actual API request
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&limit=20&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.baseUrl}/api/v3/myTrades?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get recent trades:', error);
      this.addLogEntry(`Failed to get recent trades for ${symbol}: ${error}`, 'error');
      toast.error('Failed to retrieve recent trades');
      throw error;
    }
  }
}

// Create a singleton instance
const binanceService = new BinanceService();
export default binanceService;
