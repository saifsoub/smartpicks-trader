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
      
      // Test actual connectivity with multiple endpoints
      const connectivityTests = [
        fetch('https://www.google.com/generate_204', { 
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        }),
        fetch('https://api.binance.com/api/v3/ping', {
          signal: AbortSignal.timeout(5000)
        }),
        fetch('https://httpbin.org/get', {
          signal: AbortSignal.timeout(5000)
        })
      ];
      
      // Use Promise.allSettled instead of Promise.any for better compatibility
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
   * Enhanced check for Binance API accessibility
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
      
      // Test both direct API and proxy access
      const directApiTest = fetch('https://api.binance.com/api/v3/ping', {
        signal: AbortSignal.timeout(8000)
      });
      
      const proxyTest = fetch('https://binance-proxy.vercel.app/api/ping', {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      // Try both methods, succeed if either works
      const results = await Promise.allSettled([directApiTest, proxyTest]);
      
      const directSuccess = results[0].status === 'fulfilled' && results[0].value.ok;
      const proxySuccess = results[1].status === 'fulfilled' && results[1].value.ok;
      
      if (directSuccess || proxySuccess) {
        console.log(`Binance API accessible - Direct: ${directSuccess}, Proxy: ${proxySuccess}`);
        setConnectionStage({
          ...connectionStage,
          binanceApi: 'success'
        });
        return true;
      } else {
        console.error('Both direct and proxy Binance API tests failed');
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
   * Check account access (authentication)
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
      
      if (!binanceService.hasCredentials()) {
        console.log("No API credentials configured");
        setConnectionStage({
          ...connectionStage,
          account: 'unknown'
        });
        return false;
      }
      
      // Test actual account access
      const testResult = await binanceService.testConnection();
      
      if (testResult) {
        console.log("Account access verified");
        setConnectionStage({
          ...connectionStage,
          account: 'success'
        });
        return true;
      } else {
        console.error("Account access test failed");
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
}
