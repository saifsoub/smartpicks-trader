
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { toast } from 'sonner';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastConnectionAttempt: number = 0;
  private connectionCooldown: number = 2000; // Reduced from 3000ms to 2000ms
  private connectionTimeout: number = 15000; // 15 seconds timeout
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager, accountService: AccountService) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    this.accountService = accountService;
  }
  
  public canTest(): boolean {
    if (!this.apiClient.hasCredentials()) {
      console.warn("Cannot test connection: No credentials found");
      this.accountService.setConnectionStatus('disconnected');
      this.accountService.setLastConnectionError("No API credentials found");
      return false;
    }

    // Prevent multiple connection tests in quick succession
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionCooldown) {
      console.log(`Connection test throttled, try again in ${Math.ceil((this.connectionCooldown - (now - this.lastConnectionAttempt))/1000)} seconds`);
      return false;
    }
    
    this.lastConnectionAttempt = now;
    return true;
  }
  
  public async testDirectConnection(): Promise<boolean> {
    try {
      console.log("Testing direct connection to Binance...");
      
      // Test 1: Simple ping test
      const pingResponse = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(this.connectionTimeout)
      });
      
      console.log("Basic ping test response:", pingResponse.status, pingResponse.statusText);
      if (!pingResponse.ok) {
        console.warn("Basic ping test failed with status:", pingResponse.status);
        return false;
      }
      
      // Test 2: Get ticker price data (public endpoint)
      const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(this.connectionTimeout)
      });
      
      if (!tickerResponse.ok) {
        console.warn("Ticker test failed with status:", tickerResponse.status);
        return false;
      }
      
      const tickerData = await tickerResponse.json();
      if (!tickerData.price) {
        console.warn("Invalid ticker data:", tickerData);
        return false;
      }
      
      console.log("Direct API ticker test successful:", tickerData.price);
      
      // Test 3: Try a signed test if API key/secret are available
      if (this.apiClient.hasCredentials()) {
        try {
          const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time');
          const serverTimeData = await serverTimeResponse.json();
          
          const timestamp = serverTimeData.serverTime || Date.now();
          const queryString = `timestamp=${timestamp}`;
          const signature = await this.apiClient.generateSignature(queryString);
          
          // Test a simple signed endpoint that doesn't require special permissions
          const signedTestUrl = `https://api.binance.com/api/v3/userDataStream?${queryString}&signature=${signature}`;
          
          const signedTestResponse = await fetch(signedTestUrl, {
            method: 'POST',
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey()
            },
            signal: AbortSignal.timeout(this.connectionTimeout)
          });
          
          if (signedTestResponse.ok) {
            console.log("Direct API signed request test successful");
          } else {
            console.warn("Direct API signed request test failed:", await signedTestResponse.text());
          }
        } catch (signedTestError) {
          console.warn("Direct API signed request test error:", signedTestError);
          // Don't fail the whole connection test for this optional test
        }
      }
      
      return true;
    } catch (directError) {
      console.warn("Direct connection failed:", directError);
      return false;
    }
  }
  
  public async testProxyConnection(): Promise<boolean> {
    try {
      console.log("Testing proxy connection...");
      
      // Try multiple proxy endpoints to better validate the connection
      // Start with a simple ping test
      const pingResult = await this.apiClient.fetchWithProxy('ping', {}, 'GET', true);
      if (!pingResult) {
        console.warn("Proxy ping test failed");
        return false;
      }
      
      // Try to get a public endpoint that doesn't require auth
      try {
        const tickerResult = await this.apiClient.fetchWithProxy('ticker/price', { symbol: 'BTCUSDT' }, 'GET', true);
        if (tickerResult && tickerResult.price) {
          console.log("Proxy ticker test successful:", tickerResult.price);
        } else {
          console.warn("Proxy ticker test returned invalid data:", tickerResult);
        }
      } catch (tickerError) {
        console.warn("Proxy ticker test failed:", tickerError);
        // Continue with other tests
      }
      
      // Try to get server time - another simple test
      try {
        const timeResult = await this.apiClient.fetchWithProxy('time', {}, 'GET', true);
        if (timeResult && timeResult.serverTime) {
          console.log("Proxy server time test successful");
        }
      } catch (timeError) {
        console.warn("Proxy server time test failed:", timeError);
        // Continue with other tests
      }
      
      console.log("Proxy connection test completed with some success");
      this.apiClient.setProxyConnectionSuccessful(true);
      return true;
    } catch (proxyError) {
      console.warn("Proxy connection failed:", proxyError);
      this.apiClient.setProxyConnectionSuccessful(false);
      return false;
    }
  }
  
  public updateLastConnectionAttempt(): void {
    this.lastConnectionAttempt = Date.now();
  }
}
