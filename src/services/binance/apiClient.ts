
import { BinanceCredentials } from './types';

export class BinanceApiClient {
  private proxyUrl: string = 'https://binance-proxy.vercel.app/api';
  private credentials: BinanceCredentials | null = null;
  private useLocalProxy: boolean = true;
  private proxyConnectionSuccessful: boolean = false;
  private lastProxyConnectionAttempt: number = 0;
  
  constructor(credentials: BinanceCredentials | null, useLocalProxy: boolean) {
    this.credentials = credentials;
    this.useLocalProxy = useLocalProxy;
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
  
  public hasCredentials(): boolean {
    return this.credentials !== null && !!this.credentials.apiKey && !!this.credentials.secretKey;
  }
  
  public getApiKey(): string {
    return this.credentials?.apiKey || '';
  }

  public async fetchWithProxy(endpoint: string, params: Record<string, string> = {}, method: string = 'GET'): Promise<any> {
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
