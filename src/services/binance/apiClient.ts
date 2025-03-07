
import { BinanceCredentials } from './types';

export class BinanceApiClient {
  private proxyUrl: string = 'https://binance-proxy.vercel.app/api';
  private credentials: BinanceCredentials | null = null;
  private useLocalProxy: boolean = true;
  private proxyConnectionSuccessful: boolean = false;
  private lastProxyConnectionAttempt: number = 0;
  private proxyRetries: number = 3;
  private directApiAvailable: boolean = false;
  
  constructor(credentials: BinanceCredentials | null, useLocalProxy: boolean) {
    this.credentials = credentials;
    this.useLocalProxy = useLocalProxy;
    // Check if direct API is available on initialization
    this.checkDirectApiAvailability();
  }
  
  public setCredentials(credentials: BinanceCredentials | null): void {
    this.credentials = credentials;
  }
  
  public setProxyMode(useLocalProxy: boolean): void {
    this.useLocalProxy = useLocalProxy;
    this.proxyConnectionSuccessful = false;
  }
  
  public getProxyMode(): boolean {
    return this.useLocalProxy;
  }
  
  public isProxyWorking(): boolean {
    return this.proxyConnectionSuccessful;
  }
  
  public isDirectApiAvailable(): boolean {
    return this.directApiAvailable;
  }
  
  public hasCredentials(): boolean {
    return this.credentials !== null && !!this.credentials.apiKey && !!this.credentials.secretKey;
  }
  
  public getApiKey(): string {
    return this.credentials?.apiKey || '';
  }

  // Add the generateSignature method
  public async generateSignature(queryString: string): Promise<string> {
    if (!this.credentials || !this.credentials.secretKey) {
      throw new Error('API secret key not configured');
    }
    
    try {
      // In a browser environment, we need to use the subtle crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(queryString);
      const key = encoder.encode(this.credentials.secretKey);
      
      // Create the HMAC signature using crypto.subtle
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
      
      // Convert the signature to hex
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Error generating signature:', error);
      throw new Error('Failed to generate API signature');
    }
  }

  private async checkDirectApiAvailability(): Promise<void> {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      this.directApiAvailable = response.ok;
      console.log(`Direct Binance API availability: ${this.directApiAvailable}`);
    } catch (error) {
      console.warn('Direct Binance API check failed:', error);
      this.directApiAvailable = false;
    }
  }

  public async fetchWithProxy(endpoint: string, params: Record<string, string> = {}, method: string = 'GET'): Promise<any> {
    if (!this.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    let lastError;
    for (let attempt = 0; attempt < this.proxyRetries; attempt++) {
      try {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');

        const url = `${this.proxyUrl}/${endpoint}?${queryString}`;
        
        const headers = {
          'X-API-KEY': this.credentials?.apiKey || '',
          'X-API-SECRET-HASH': btoa(this.credentials?.secretKey?.slice(-8) || ''),
        };

        console.log(`Fetching via proxy (attempt ${attempt + 1}/${this.proxyRetries}): ${url}`);
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
        console.log(`Proxy request to ${endpoint} successful`);
        return data;
      } catch (error) {
        console.error(`Error in fetchWithProxy (attempt ${attempt + 1}/${this.proxyRetries}):`, error);
        lastError = error;
        
        // Wait a bit before retrying (increasing delay for each retry)
        if (attempt < this.proxyRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          console.log(`Retrying proxy request to ${endpoint}...`);
        }
      }
    }
    
    this.proxyConnectionSuccessful = false;
    console.error(`All ${this.proxyRetries} proxy attempts failed for ${endpoint}`);
    
    // If we're using proxy mode but it fails, try direct API if possible
    if (this.directApiAvailable && endpoint.match(/^(ping|ticker|klines)/)) {
      console.log(`Falling back to direct API for ${endpoint}...`);
      try {
        return await this.attemptDirectApiCall(endpoint, params);
      } catch (directError) {
        console.error('Direct API fallback failed:', directError);
      }
    }
    
    throw lastError;
  }
  
  private async attemptDirectApiCall(endpoint: string, params: Record<string, string>): Promise<any> {
    const apiBase = 'https://api.binance.com/api/v3';
    let url: string;
    
    // Convert proxy endpoints to direct API endpoints
    switch (endpoint) {
      case 'ping':
        url = `${apiBase}/ping`;
        break;
      case 'ticker/price':
        if (params.symbol) {
          url = `${apiBase}/ticker/price?symbol=${params.symbol}`;
        } else {
          url = `${apiBase}/ticker/price`;
        }
        break;
      case 'klines':
        url = `${apiBase}/klines?symbol=${params.symbol}&interval=${params.interval}&limit=${params.limit || 100}`;
        break;
      default:
        throw new Error(`Endpoint ${endpoint} not supported for direct API fallback`);
    }
    
    const response = await this.fetchWithRetry(url);
    return await response.json();
  }

  public async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
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
}
