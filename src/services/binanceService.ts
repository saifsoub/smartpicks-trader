
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
  private getHeaders(isPrivate = false): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    if (isPrivate) {
      if (!this.apiKey) throw new Error('API key not set');
      headers.append('X-MBX-APIKEY', this.apiKey);
    }
    
    return headers;
  }

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.hasCredentials()) {
        throw new Error('API credentials not set');
      }
      
      const response = await fetch(`${this.baseUrl}/api/v3/ping`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
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
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server responded with error: ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get account info:', error);
      toast.error('Failed to retrieve account information');
      throw error;
    }
  }

  // Get current prices for all symbols
  public async getPrices(): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/ticker/price`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const prices = await response.json();
      const priceMap: Record<string, string> = {};
      
      prices.forEach((item: { symbol: string; price: string }) => {
        priceMap[item.symbol] = item.price;
      });
      
      return priceMap;
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
      
      const timestamp = Date.now();
      const queryParams = new URLSearchParams({
        symbol,
        side,
        type: 'MARKET',
        quantity,
        timestamp: timestamp.toString()
      });
      
      const signature = this.generateSignature(queryParams.toString());
      queryParams.append('signature', signature);
      
      const response = await fetch(`${this.baseUrl}/api/v3/order?${queryParams.toString()}`, {
        method: 'POST',
        headers: this.getHeaders(true)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Order failed: ${JSON.stringify(errorData)}`);
      }
      
      const orderResult = await response.json();
      toast.success(`${side} order placed successfully`);
      return orderResult;
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(`Failed to place ${side} order`);
      throw error;
    }
  }

  // Get recent trades for a symbol
  public async getRecentTrades(symbol: string): Promise<BinanceTrade[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/myTrades?symbol=${symbol}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      return await response.json();
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
