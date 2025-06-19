
import binanceService from '@/services/binanceService';
import { StorageManager } from '@/services/binance/storageManager';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';

export class ConnectivityChecker {
  /**
   * Enhanced Internet connectivity check using multiple methods
   */
  public static async checkInternetConnectivity(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    shouldBypassChecks: boolean = false
  ): Promise<boolean> {
    if (shouldBypassChecks) {
      console.log('Bypassing internet connectivity check');
      setConnectionStage({
        ...connectionStage,
        internet: 'success'
      });
      return true;
    }
    
    try {
      setConnectionStage({
        ...connectionStage,
        internet: 'checking'
      });
      
      // First check navigator.onLine
      if (!navigator.onLine) {
        console.log("Browser reports device is offline");
        setConnectionStage({
          ...connectionStage,
          internet: 'failed'
        });
        return false;
      }
      
      // Test actual connectivity with reliable endpoints
      const connectivityTests = [
        // Use a more reliable connectivity test
        fetch('https://api.binance.com/api/v3/time', { 
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          cache: 'no-store'
        }),
        fetch('https://httpbin.org/get', {
          signal: AbortSignal.timeout(8000),
          cache: 'no-store'
        })
      ];
      
      // Use Promise.allSettled and check for at least one success
      const results = await Promise.allSettled(connectivityTests);
      
      // Check if any test succeeded
      const hasSuccessfulTest = results.some(result => 
        result.status === 'fulfilled' && result.value.ok
      );
      
      if (hasSuccessfulTest) {
        console.log("Internet connectivity confirmed");
        setConnectionStage({
          ...connectionStage,
          internet: 'success'
        });
        return true;
      } else {
        console.error("All connectivity tests failed:", results);
        setConnectionStage({
          ...connectionStage,
          internet: 'failed'
        });
        return false;
      }
    } catch (error) {
      console.error("Error checking internet connectivity:", error);
      setConnectionStage({
        ...connectionStage,
        internet: 'failed'
      });
      return false;
    }
  }

  /**
   * Enhanced check for Binance API accessibility with better fallback handling
   */
  public static async checkBinanceApiAccess(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    connectionAttempts: number,
    shouldBypassChecks: boolean = false
  ): Promise<boolean> {
    if (shouldBypassChecks) {
      console.log('Bypassing Binance API check');
      setConnectionStage({
        ...connectionStage,
        binanceApi: 'success'
      });
      return true;
    }
    
    try {
      setConnectionStage({
        ...connectionStage,
        binanceApi: 'checking'
      });
      
      // Test direct API first (most reliable)
      const directApiTest = fetch('https://api.binance.com/api/v3/ping', {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store'
      });
      
      // Test multiple proxy endpoints as fallbacks
      const proxyTests = [
        fetch('https://binance-proxy.vercel.app/api/ping', {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(10000),
          cache: 'no-store'
        }),
        // Add additional proxy fallbacks
        fetch('https://api.binance.com/api/v3/time', {
          signal: AbortSignal.timeout(8000),
          cache: 'no-store'
        })
      ];
      
      // Try direct API first
      const directResult = await Promise.allSettled([directApiTest]);
      const directSuccess = directResult[0].status === 'fulfilled' && directResult[0].value.ok;
      
      if (directSuccess) {
        console.log('Binance API accessible via direct connection');
        setConnectionStage({
          ...connectionStage,
          binanceApi: 'success'
        });
        return true;
      }
      
      // If direct fails, try proxy methods
      console.log('Direct API failed, trying proxy methods...');
      const proxyResults = await Promise.allSettled(proxyTests);
      
      const proxySuccess = proxyResults.some(result => 
        result.status === 'fulfilled' && result.value.ok
      );
      
      if (proxySuccess) {
        console.log('Binance API accessible via proxy connection');
        setConnectionStage({
          ...connectionStage,
          binanceApi: 'success'
        });
        return true;
      } else {
        console.error('All Binance API connection methods failed');
        setConnectionStage({
          ...connectionStage,
          binanceApi: 'failed'
        });
        return false;
      }
    } catch (error) {
      console.error("Error checking Binance API access:", error);
      setConnectionStage({
        ...connectionStage,
        binanceApi: 'failed'
      });
      return false;
    }
  }
  
  /**
   * Enhanced account access check with better credential validation
   */
  public static async checkAccountAccess(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    connectionAttempts: number,
    shouldBypassChecks: boolean = false
  ): Promise<boolean> {
    if (shouldBypassChecks) {
      console.log('Bypassing account access check');
      setConnectionStage({
        ...connectionStage,
        account: 'success'
      });
      return true;
    }
    
    try {
      setConnectionStage({
        ...connectionStage,
        account: 'checking'
      });
      
      // Check if credentials are properly configured
      if (!binanceService.hasCredentials()) {
        console.log("No API credentials configured");
        setConnectionStage({
          ...connectionStage,
          account: 'unknown'
        });
        return false;
      }
      
      // Validate API key format before testing
      const apiKey = binanceService.getApiKey();
      if (!this.validateApiKeyFormat(apiKey)) {
        console.error("Invalid API key format");
        setConnectionStage({
          ...connectionStage,
          account: 'failed'
        });
        return false;
      }
      
      // Test actual account access with retry logic
      let testResult = false;
      let lastError = null;
      
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`Testing account access (attempt ${attempt + 1}/2)...`);
          testResult = await binanceService.testConnection();
          if (testResult) break;
        } catch (error) {
          lastError = error;
          console.warn(`Account test attempt ${attempt + 1} failed:`, error);
          if (attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (testResult) {
        console.log("Account access verified");
        setConnectionStage({
          ...connectionStage,
          account: 'success'
        });
        return true;
      } else {
        console.error("Account access test failed:", lastError);
        setConnectionStage({
          ...connectionStage,
          account: 'failed'
        });
        return false;
      }
    } catch (error) {
      console.error("Error checking account access:", error);
      setConnectionStage({
        ...connectionStage,
        account: 'failed'
      });
      return false;
    }
  }
  
  /**
   * Validate API key format
   */
  private static validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Binance API keys are typically 64 characters long and alphanumeric
    const apiKeyPattern = /^[a-zA-Z0-9]{64}$/;
    return apiKeyPattern.test(apiKey);
  }
}
