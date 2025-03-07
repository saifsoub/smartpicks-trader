
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastTestTime: number = 0;
  private testingInProgress: boolean = false;
  private minTestInterval: number = 5000; // Minimum 5 seconds between tests
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
  }
  
  /**
   * Checks if we can perform a connection test based on time interval
   */
  public canTest(): boolean {
    const now = Date.now();
    return !this.testingInProgress && (now - this.lastTestTime >= this.minTestInterval);
  }
  
  /**
   * Tests the direct API connection to Binance
   */
  public async testDirectConnection(): Promise<boolean> {
    if (!this.apiClient.hasCredentials()) {
      return false;
    }
    
    try {
      this.testingInProgress = true;
      this.lastTestTime = Date.now();
      
      // Try to ping Binance API directly
      console.log('Testing direct API connection to Binance...');
      
      // Try to get public data first which doesn't require authentication
      try {
        const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // Increased timeout
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (timeResponse.ok) {
          console.log('Direct API basic connectivity confirmed');
          // At minimum, we have basic connectivity
          return true;
        }
      } catch (timeError) {
        console.warn('Direct API time check failed:', timeError);
        // Continue with other checks
      }
      
      // Try a different public endpoint
      try {
        const priceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (priceResponse.ok) {
          console.log('Direct API price check successful');
          return true;
        }
      } catch (priceError) {
        console.warn('Direct API price check failed:', priceError);
      }
      
      // If all checks fail
      console.log('Direct API connection tests failed');
      return false;
    } catch (error) {
      console.error('Direct API connection test failed:', error);
      return false;
    } finally {
      this.testingInProgress = false;
    }
  }
  
  /**
   * Tests the proxy connection to Binance
   */
  public async testProxyConnection(): Promise<boolean> {
    if (!this.apiClient.hasCredentials()) {
      return false;
    }
    
    try {
      this.testingInProgress = true;
      
      // Test using the simplest public endpoint
      console.log('Testing proxy connection to Binance...');
      
      try {
        // Try testing with a public endpoint that doesn't require auth
        const tickerData = await this.apiClient.fetchWithProxy(
          'ticker/price',
          { symbol: 'BTCUSDT' },
          'GET',
          true
        );
        
        if (tickerData && tickerData.price) {
          console.log('Proxy ticker check successful');
          return true;
        }
      } catch (tickerError) {
        console.warn('Proxy ticker check failed:', tickerError);
      }
      
      // If that fails, try another simple endpoint
      try {
        const pingData = await this.apiClient.fetchWithProxy('ping', {}, 'GET', true);
        if (pingData) {
          console.log('Proxy ping successful');
          return true;
        }
      } catch (pingError) {
        console.error('Proxy ping failed:', pingError);
      }
      
      return false;
    } catch (error) {
      console.error('Proxy connection test failed:', error);
      return false;
    } finally {
      this.testingInProgress = false;
    }
  }
}
