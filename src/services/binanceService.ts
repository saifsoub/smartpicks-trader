
import { toast } from "sonner";

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

// This class handles all Binance API interactions
class BinanceService {
  private apiKey: string | null = null;
  private secretKey: string | null = null;
  private baseUrl = 'https://api.binance.com';
  // Use a CORS proxy for testing
  private proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  constructor() {
    // Try to load credentials from localStorage on initialization
    this.loadCredentials();
  }

  // Load credentials from localStorage
  private loadCredentials() {
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      const { apiKey, secretKey } = JSON.parse(savedCredentials);
      this.apiKey = apiKey;
      this.secretKey = secretKey;
    }
  }

  // Save credentials to localStorage
  public saveCredentials(credentials: BinanceCredentials): boolean {
    try {
      this.apiKey = credentials.apiKey;
      this.secretKey = credentials.secretKey;
      localStorage.setItem('binanceCredentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  // Check if credentials are set
  public hasCredentials(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  // Generate signature for private endpoints
  private generateSignature(queryString: string): string {
    if (!this.secretKey) throw new Error('Secret key not set');
    
    // In a real implementation, you would use a crypto library to create an HMAC SHA256 signature
    // Here's a placeholder that would need to be replaced with actual crypto implementation
    // For example using the crypto-js library:
    // return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
    
    // This is a placeholder and not a real implementation
    console.warn('Using placeholder signature generation - replace with real implementation');
    return 'signature-placeholder';
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

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      // For demonstration purposes, since Binance API has CORS restrictions,
      // we'll just simulate a successful connection
      console.log('Testing API connection with credentials:', this.apiKey);
      
      // In a real-world scenario, you'd either use a proxy server or a backend API
      // to make the actual request to Binance
      
      // Simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get account information including balances
  public async getAccountInfo(): Promise<any> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      // In a real implementation, this would make an actual API call
      // For now, simulate a response with mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock response
      return {
        balances: [
          { asset: 'BTC', free: '0.12345678', locked: '0.00000000' },
          { asset: 'ETH', free: '2.34567890', locked: '0.00000000' },
          { asset: 'USDT', free: '5000.00', locked: '0.00' },
          { asset: 'BNB', free: '10.5', locked: '0.00' }
        ]
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      toast.error('Failed to retrieve account information');
      throw error;
    }
  }

  // Get current prices for all symbols
  public async getPrices(): Promise<Record<string, string>> {
    try {
      // Simulate API response with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        'BTCUSDT': '66120.35',
        'ETHUSDT': '3221.48',
        'BNBUSDT': '567.89',
        'SOLUSDT': '172.62',
        'XRPUSDT': '0.5732',
        'ADAUSDT': '0.4523',
        'DOGEUSDT': '0.1324',
        'MATICUSDT': '0.7845'
      };
    } catch (error) {
      console.error('Failed to get prices:', error);
      toast.error('Failed to retrieve market prices');
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
      console.log(`Placing ${side} order for ${quantity} of ${symbol}`);
      
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
      
      toast.success(`${side} order placed successfully`);
      return mockResponse;
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(`Failed to place ${side} order`);
      throw error;
    }
  }

  // Get recent trades for a symbol
  public async getRecentTrades(symbol: string): Promise<BinanceTrade[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Generate mock trade data
      const mockTrades: BinanceTrade[] = [];
      const baseTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        mockTrades.push({
          symbol,
          id: 100000 + i,
          orderId: 200000 + i,
          price: symbol.includes('BTC') ? '66120.35' : '3221.48',
          qty: (Math.random() * 0.1).toFixed(6),
          commission: (Math.random() * 0.001).toFixed(8),
          commissionAsset: symbol.replace('USDT', ''),
          time: baseTime - i * 1000 * 60 * 5,
          isBuyer: i % 2 === 0,
          isMaker: i % 3 === 0,
          isBestMatch: true
        });
      }
      
      return mockTrades;
    } catch (error) {
      console.error('Failed to get recent trades:', error);
      toast.error('Failed to retrieve recent trades');
      throw error;
    }
  }
}

// Create a singleton instance
const binanceService = new BinanceService();
export default binanceService;
