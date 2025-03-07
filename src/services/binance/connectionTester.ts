
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
      
      // Start with simple ping
      const pingResponse = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!pingResponse.ok) {
        console.log('Direct API ping failed');
        return false;
      }
      
      // Try to get server time
      const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!timeResponse.ok) {
        console.log('Direct API time check failed');
        return false;
      }
      
      // If we have credentials, try to get account data
      if (this.apiClient.hasCredentials()) {
        try {
          // Get server time for accurate timestamp
          const timeData = await timeResponse.json();
          const timestamp = timeData.serverTime;
          
          // Add recvWindow param for better time handling
          const queryString = `timestamp=${timestamp}&recvWindow=5000`;
          const signature = await this.apiClient.generateSignature(queryString);
          
          const accountResponse = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
            method: 'GET',
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey()
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (accountResponse.ok) {
            console.log('Direct API account check successful');
            return true;
          }
          
          const errorText = await accountResponse.text();
          console.log('Direct API account check failed:', errorText);
          
          // If we get specific errors about API permissions, consider the connection working
          // but with limited permissions
          if (errorText.includes("API-key has no permission")) {
            console.log('Direct API connection works but has permission limitations');
            return true;
          }
        } catch (error) {
          console.warn('Direct API account check error:', error);
        }
      }
      
      // If we can ping and get time, consider basic API working
      console.log('Basic direct API connection successful');
      return true;
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
      
      // Test the proxy connection using our proxy endpoints
      console.log('Testing proxy connection to Binance...');
      
      // Start with a simple ping through the proxy
      try {
        const pingData = await this.apiClient.fetchWithProxy('ping', {}, 'GET', true);
        
        if (pingData) {
          console.log('Proxy ping successful');
          
          // Try to get more specific data if we have credentials
          try {
            // Try reading ticker data which doesn't require special permissions
            const tickerData = await this.apiClient.fetchWithProxy(
              'ticker/price',
              { symbol: 'BTCUSDT' },
              'GET',
              true
            );
            
            if (tickerData && tickerData.price) {
              console.log('Proxy ticker check successful');
              
              // Try to check account access only if we have credentials
              if (this.apiClient.hasCredentials()) {
                try {
                  // User data stream creation is a good test for basic API access
                  const userData = await this.apiClient.fetchWithProxy(
                    'userDataStream',
                    {},
                    'POST',
                    true
                  );
                  
                  if (userData && userData.listenKey) {
                    console.log('Proxy user data stream check successful');
                    return true;
                  }
                } catch (userDataError) {
                  console.warn('Proxy user data stream check failed:', userDataError);
                  // Still return true if ticker worked but user data failed
                  // This indicates the proxy works but possibly with limited permissions
                  return true;
                }
              }
              
              // If ticker worked, consider the proxy connection working
              return true;
            }
          } catch (tickerError) {
            console.warn('Proxy ticker check failed:', tickerError);
            // Still return true if ping worked
            return true;
          }
          
          // If ping worked, consider the proxy connection working
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
