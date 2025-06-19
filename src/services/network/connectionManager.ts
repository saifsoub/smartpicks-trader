
import { toast } from 'sonner';
import binanceService from '@/services/binanceService';
import { StorageManager } from '@/services/binance/storageManager';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';
import { ConnectivityChecker } from './connectivityChecker';

export class ConnectionManager {
  /**
   * Enhanced comprehensive connection check with better error handling
   */
  public static async checkRealConnectivity(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    setIsCheckingConnection: (isChecking: boolean) => void,
    setIsOnline: (isOnline: boolean) => void,
    connectionAttempts: number
  ): Promise<boolean> {
    const shouldBypass = StorageManager.shouldBypassConnectionChecks();
    
    if (shouldBypass) {
      console.log("Connection checks are bypassed");
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsCheckingConnection(false);
      setIsOnline(true);
      return true;
    }
    
    setIsCheckingConnection(true);
    let overallSuccess = true;
    
    try {
      console.log(`Starting connectivity check (attempt ${connectionAttempts + 1})...`);
      
      // Step 1: Check internet connectivity
      const internetOk = await ConnectivityChecker.checkInternetConnectivity(
        connectionStage,
        setConnectionStage,
        shouldBypass
      );
      
      if (!internetOk) {
        console.warn('Internet connectivity check failed');
        overallSuccess = false;
      }
      
      // Step 2: Check Binance API access if internet is working
      let binanceOk = false;
      if (internetOk) {
        binanceOk = await ConnectivityChecker.checkBinanceApiAccess(
          connectionStage,
          setConnectionStage,
          connectionAttempts,
          shouldBypass
        );
        
        if (!binanceOk) {
          console.warn('Binance API connectivity check failed');
          overallSuccess = false;
        }
      } else {
        console.log('Skipping Binance API check due to internet connectivity issues');
        setConnectionStage(prev => ({
          ...prev,
          binanceApi: 'failed'
        }));
      }
      
      // Step 3: Check account access if API is working
      if (binanceOk) {
        const accountOk = await ConnectivityChecker.checkAccountAccess(
          connectionStage,
          setConnectionStage,
          connectionAttempts,
          shouldBypass
        );
        
        if (!accountOk) {
          console.log('Account access issues detected, but API connection is working');
          // Don't fail overall check for account issues
        }
      } else {
        console.log('Skipping account check due to API connectivity issues');
        setConnectionStage(prev => ({
          ...prev,
          account: 'failed'
        }));
      }
      
      console.log(`Connectivity check completed. Overall success: ${overallSuccess}`);
      setIsOnline(overallSuccess);
      return overallSuccess;
    } catch (error) {
      console.error("Error in comprehensive connectivity check:", error);
      setIsOnline(false);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }

  /**
   * Enhanced manual connection check with better user feedback
   */
  public static async handleCheckConnection(
    setConnectionAttempts: (callback: (prev: number) => number) => void,
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    setIsCheckingConnection: (isChecking: boolean) => void,
    setIsOnline: (isOnline: boolean) => void,
    setIsVisible: (isVisible: boolean) => void,
    connectionAttempts: number
  ): Promise<boolean> {
    setConnectionAttempts(prev => prev + 1);
    console.log("Manual connection check initiated");
    
    // Show intermediate feedback
    toast.info("Testing connection to Binance API...");
    
    const result = await this.checkRealConnectivity(
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      connectionAttempts
    );
    
    if (result) {
      setIsVisible(false);
      toast.success("Successfully connected to Binance API");
    } else {
      // Provide more specific error guidance
      const { internet, binanceApi, account } = connectionStage;
      
      if (internet === 'failed') {
        toast.error("No internet connection detected. Please check your network.");
      } else if (binanceApi === 'failed') {
        toast.error("Cannot reach Binance API. Try enabling Direct API mode or check firewall settings.");
      } else if (account === 'failed') {
        toast.error("API credentials invalid. Please check your API keys in settings.");
      } else {
        toast.error("Connection issues detected. Please check your network and API settings.");
      }
    }
    
    return result;
  }
  
  /**
   * Enable offline mode with better user communication
   */
  public static handleEnableOfflineMode(setIsVisible: (isVisible: boolean) => void): void {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
    toast.success("Offline mode enabled. The application will use simulated trading data.");
    console.log("Offline mode enabled - switching to demo data");
  }
  
  /**
   * Toggle bypass connection checks with better state management
   */
  public static handleBypassConnectionChecks(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    setIsOnline: (isOnline: boolean) => void,
    setIsCheckingConnection: (isChecking: boolean) => void,
    connectionAttempts: number
  ): void {
    const currentValue = StorageManager.shouldBypassConnectionChecks();
    const newValue = !currentValue;
    
    StorageManager.bypassConnectionChecks(newValue);
    console.log(`Connection checks bypass ${newValue ? 'enabled' : 'disabled'}`);
    
    if (newValue) {
      // Enabling bypass
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsOnline(true);
      toast.success("Connection checks bypassed - assuming all connections are working");
    } else {
      // Disabling bypass - trigger real check
      toast.info("Connection checks re-enabled. Running connectivity test...");
      this.checkRealConnectivity(
        connectionStage,
        setConnectionStage,
        setIsCheckingConnection,
        setIsOnline,
        connectionAttempts
      );
    }
  }
  
  /**
   * Enhanced force direct API with better error handling
   */
  public static handleForceDirectApi(
    connectionStage: ConnectionStage,
    setConnectionStage: (stage: ConnectionStage) => void,
    setIsCheckingConnection: (isChecking: boolean) => void,
    setIsOnline: (isOnline: boolean) => void,
    connectionAttempts: number
  ): void {
    const currentValue = StorageManager.shouldForceDirectApi();
    const newValue = !currentValue;
    
    StorageManager.forceDirectApi(newValue);
    binanceService.forceDirectApi(newValue);
    
    console.log(`Direct API mode ${newValue ? 'enabled' : 'disabled'}`);
    
    if (newValue) {
      toast.success("Direct API mode enabled - bypassing proxy servers");
    } else {
      toast.info("Direct API mode disabled - will try proxy servers if needed");
    }
    
    // Re-run connectivity check to reflect the change
    setTimeout(() => {
      this.checkRealConnectivity(
        connectionStage,
        setConnectionStage,
        setIsCheckingConnection,
        setIsOnline,
        connectionAttempts
      );
    }, 500);
  }
}
