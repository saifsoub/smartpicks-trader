
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { AccountService } from './accountService';
import { toast } from 'sonner';

export class ConnectionTester {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private accountService: AccountService;
  private lastConnectionAttempt: number = 0;
  private connectionCooldown: number = 1000; // 1 second cooldown to allow more frequent tests
  private connectionTimeout: number = 30000; // Increased to 30 seconds for slower networks
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 3;
  private hasReadPermission: boolean = false;
  
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
        signal: AbortSignal.timeout(this.connectionTimeout),
        cache: 'no-store' // Prevent caching
      });
      
      console.log("Basic ping test response:", pingResponse.status, pingResponse.statusText);
      if (!pingResponse.ok) {
        console.warn("Basic ping test failed with status:", pingResponse.status);
        this.consecutiveFailures++;
        return false;
      }
      
      // Test 2: Get ticker price data (public endpoint)
      const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(this.connectionTimeout),
        cache: 'no-store'
      });
      
      if (!tickerResponse.ok) {
        console.warn("Ticker test failed with status:", tickerResponse.status);
        this.consecutiveFailures++;
        return false;
      }
      
      const tickerData = await tickerResponse.json();
      if (!tickerData.price) {
        console.warn("Invalid ticker data:", tickerData);
        this.consecutiveFailures++;
        return false;
      }
      
      console.log("Direct API ticker test successful:", tickerData.price);
      this.consecutiveFailures = 0;
      
      // Test 3: Try a signed test if API key/secret are available
      if (this.apiClient.hasCredentials()) {
        try {
          // First get server time to sync timestamp
          const serverTimeResponse = await fetch('https://api.binance.com/api/v3/time', {
            cache: 'no-store',
            signal: AbortSignal.timeout(this.connectionTimeout)
          });
          const serverTimeData = await serverTimeResponse.json();
          
          if (!serverTimeData.serverTime) {
            console.warn("Failed to get server time:", serverTimeData);
            // Continue with local time as fallback
          }
          
          const timestamp = serverTimeData.serverTime || Date.now();
          const queryString = `timestamp=${timestamp}&recvWindow=10000`;
          const signature = await this.apiClient.generateSignature(queryString);
          
          // Try to check account endpoint directly - this will verify read access
          const accountTestUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;
          
          const accountTestResponse = await fetch(accountTestUrl, {
            method: 'GET',
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey()
            },
            signal: AbortSignal.timeout(this.connectionTimeout),
            cache: 'no-store'
          });
          
          if (accountTestResponse.ok) {
            console.log("Direct API account request test successful");
            const accountData = await accountTestResponse.json();
            
            if (accountData && Array.isArray(accountData.balances)) {
              this.hasReadPermission = true;
              console.log("Account data access confirmed:", accountData.balances.length, "assets found");
              // If we can access account data, we have read permissions
              return true;
            }
          } else {
            const errorText = await accountTestResponse.text();
            console.warn("Direct API account test failed:", errorText);
            
            // Check if error is permission related
            if (errorText.includes("API-key has no permission")) {
              console.log("API key permission issue detected:", errorText);
              // Mark that we have limited permissions, but basic connectivity works
              this.hasReadPermission = false;
            }
            
            // Even if account test fails, basic connectivity is working
            return true;
          }
        } catch (signedTestError) {
          console.warn("Direct API signed request test error:", signedTestError);
          // Don't fail the whole connection test for this optional test
        }
      }
      
      return true;
    } catch (directError) {
      console.warn("Direct connection failed:", directError);
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error(`Direct API connection failed ${this.consecutiveFailures} consecutive times`);
        this.logManager.addTradingLog("Multiple connection failures detected. Your network may be blocking Binance.", 'warning');
      }
      
      return false;
    }
  }
  
  public async testProxyConnection(): Promise<boolean> {
    try {
      console.log("Testing proxy connection...");
      
      // Try multiple proxy endpoints to better validate the connection
      // Start with a simple ping test
      const pingResult = await this.apiClient.fetchWithProxy('ping', {}, 'GET', false);
      if (!pingResult) {
        console.warn("Proxy ping test failed");
        return false;
      }
      
      // Try to get a public endpoint that doesn't require auth
      try {
        const tickerResult = await this.apiClient.fetchWithProxy('ticker/price', { symbol: 'BTCUSDT' }, 'GET', false);
        if (tickerResult && tickerResult.price) {
          console.log("Proxy ticker test successful:", tickerResult.price);
        } else {
          console.warn("Proxy ticker test returned invalid data:", tickerResult);
        }
      } catch (tickerError) {
        console.warn("Proxy ticker test failed:", tickerError);
        // Continue with other tests
      }
      
      // Try to access account data - this will verify API permissions
      if (this.apiClient.hasCredentials()) {
        try {
          // Use recvWindow parameter to allow for time differences
          const accountResult = await this.apiClient.fetchWithProxy('account', { recvWindow: '10000' }, 'GET', false);
          if (accountResult && Array.isArray(accountResult.balances)) {
            console.log("Proxy account data access successful");
            this.hasReadPermission = true;
          }
        } catch (accountError) {
          console.warn("Proxy account access failed:", accountError);
          this.hasReadPermission = false;
          // Continue with other tests - basic connection might still work
        }
        
        // Try an alternative endpoint for checking API permissions
        try {
          const userDataResult = await this.apiClient.fetchWithProxy('userDataStream', {}, 'POST', false);
          if (userDataResult && userDataResult.listenKey) {
            console.log("Proxy user data stream access successful");
            this.hasReadPermission = true;
          }
        } catch (userDataError) {
          console.warn("Proxy user data stream access failed:", userDataError);
          // Continue with other tests
        }
      }
      
      console.log("Proxy connection test completed with some success");
      this.apiClient.setProxyConnectionSuccessful(true);
      this.consecutiveFailures = 0;
      return true;
    } catch (proxyError) {
      console.warn("Proxy connection failed:", proxyError);
      this.apiClient.setProxyConnectionSuccessful(false);
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error(`Proxy connection failed ${this.consecutiveFailures} consecutive times`);
        this.logManager.addTradingLog("Persistent proxy connection failures detected. Try switching to direct mode or check network.", 'warning');
      }
      
      return false;
    }
  }
  
  public hasReadAccess(): boolean {
    return this.hasReadPermission;
  }
  
  public updateLastConnectionAttempt(): void {
    this.lastConnectionAttempt = Date.now();
  }
  
  public resetConsecutiveFailures(): void {
    this.consecutiveFailures = 0;
  }
}
