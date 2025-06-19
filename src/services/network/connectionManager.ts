
import { toast } from 'sonner';
import binanceService from '@/services/binanceService';
import { StorageManager } from '@/services/binance/storageManager';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';
import { ConnectivityChecker } from './connectivityChecker';

export class ConnectionManager {
  /**
   * Comprehensive connection check that runs all stages
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
      // Check internet connectivity
      const internetOk = await ConnectivityChecker.checkInternetConnectivity(
        connectionStage,
        setConnectionStage,
        shouldBypass
      );
      
      if (!internetOk) {
        overallSuccess = false;
      }
      
      // Check Binance API access if internet is working
      let binanceOk = false;
      if (internetOk) {
        binanceOk = await ConnectivityChecker.checkBinanceApiAccess(
          connectionStage,
          setConnectionStage,
          connectionAttempts,
          shouldBypass
        );
        
        if (!binanceOk) {
          overallSuccess = false;
        }
      }
      
      // Check account access if API is working
      if (binanceOk) {
        const accountOk = await ConnectivityChecker.checkAccountAccess(
          connectionStage,
          setConnectionStage,
          connectionAttempts,
          shouldBypass
        );
        
        // Account issues don't fail the overall check but are noted
        if (!accountOk) {
          console.log('Account access issues detected, but continuing...');
        }
      }
      
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
   * Handle manual connection check
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
      toast.error("Connection issues detected. Please check your network and API settings.");
    }
    
    return result;
  }
  
  /**
   * Enable offline mode
   */
  public static handleEnableOfflineMode(setIsVisible: (isVisible: boolean) => void): void {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
    toast.success("Offline mode enabled. The application will use simulated trading.");
  }
  
  /**
   * Toggle bypass connection checks
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
    
    if (newValue) {
      // Enabling bypass
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsOnline(true);
      toast.success("Connection checks bypassed");
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
   * Handle force direct API connections
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
    
    if (newValue) {
      toast.success("Direct API mode enabled");
    } else {
      toast.info("Direct API mode disabled");
    }
    
    // Re-run connectivity check to reflect the change
    this.checkRealConnectivity(
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      connectionAttempts
    );
  }
}
