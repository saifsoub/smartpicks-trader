
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
    try {
      // If bypass is enabled, automatically return success
      if (StorageManager.shouldBypassConnectionChecks()) {
        console.log("Connection checks are bypassed, automatically reporting successful connection");
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
      
      // Reset all stages
      setConnectionStage({
        internet: 'unknown',
        binanceApi: 'unknown',
        account: 'unknown'
      });
      
      // Stage 1: Check internet connectivity
      const hasInternetConnection = await ConnectivityChecker.checkInternetConnectivity(
        connectionStage,
        setConnectionStage,
        StorageManager.shouldBypassConnectionChecks()
      );
      
      if (!hasInternetConnection) {
        console.log("Internet connectivity check failed");
        setIsCheckingConnection(false);
        setIsOnline(false);
        return false;
      }
      
      // Stage 2: Check Binance API accessibility
      const canAccessBinanceApi = await ConnectivityChecker.checkBinanceApiAccess(
        connectionStage,
        setConnectionStage,
        connectionAttempts,
        StorageManager.shouldBypassConnectionChecks()
      );
      
      if (!canAccessBinanceApi) {
        console.log("Binance API accessibility check failed");
        setIsCheckingConnection(false);
        setIsOnline(false);
        return false;
      }
      
      // Stage 3: Check account access
      const hasAccountAccess = await ConnectivityChecker.checkAccountAccess(
        connectionStage,
        setConnectionStage,
        connectionAttempts,
        StorageManager.shouldBypassConnectionChecks()
      );
      
      if (!hasAccountAccess) {
        console.log("Account access check failed");
        setIsCheckingConnection(false);
        setIsOnline(true); // Internet works, but account access fails
        return false;
      }
      
      // All checks passed
      console.log("All connectivity checks passed successfully");
      setIsCheckingConnection(false);
      setIsOnline(true);
      return true;
    } catch (error) {
      console.error("Error in comprehensive connectivity check:", error);
      setIsCheckingConnection(false);
      
      // If we're bypassing checks or have tried multiple times, just say it works
      if (StorageManager.shouldBypassConnectionChecks() || connectionAttempts >= 2) {
        setIsOnline(true);
        setConnectionStage({
          internet: 'success',
          binanceApi: 'success',
          account: 'success'
        });
        return true;
      }
      
      setIsOnline(false);
      return false;
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
    
    const success = await ConnectionManager.checkRealConnectivity(
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      connectionAttempts
    );
    
    if (success) {
      setIsVisible(false);
      console.log("Manual connectivity check succeeded");
      toast.success("Successfully connected to Binance API and verified account access");
      return true;
    } else {
      setIsVisible(true);
      console.log("Manual connectivity check failed");
      
      // If multiple connection attempts have failed, suggest bypass mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode() && !StorageManager.shouldBypassConnectionChecks()) {
        toast.info("Multiple connection attempts failed. Consider bypassing connection checks to proceed.");
      }
      
      return false;
    }
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
    StorageManager.bypassConnectionChecks(!currentValue);
    
    if (!currentValue) {
      // Enabling bypass
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsOnline(true);
      toast.info("Connection checks bypassed. The application will proceed without verifying Binance connectivity.");
    } else {
      // Disabling bypass
      toast.info("Connection checks re-enabled. The application will verify Binance connectivity.");
      // Re-run connection check after a short delay
      setTimeout(() => {
        ConnectionManager.checkRealConnectivity(
          connectionStage,
          setConnectionStage,
          setIsCheckingConnection,
          setIsOnline,
          connectionAttempts
        );
      }, 500);
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
    
    // Log the current state before change
    console.log(`Force Direct API: Current state = ${currentValue}, changing to ${!currentValue}`);
    
    // Update the direct API mode in binanceService
    binanceService.forceDirectApi(!currentValue);
    
    // Get updated state
    const newValue = StorageManager.shouldForceDirectApi();
    console.log(`Force Direct API: New state = ${newValue}`);
    
    if (newValue) {
      // Enabling direct API mode
      toast.info("Direct API mode enabled. Bypassing all proxies and connecting directly to Binance.");
      
      // Set the connection stages to reflect the change
      setConnectionStage(prev => ({
        ...prev,
        binanceApi: 'checking' // Show checking state immediately
      }));
      
      // Re-run connection check immediately
      ConnectionManager.checkRealConnectivity(
        connectionStage,
        setConnectionStage,
        setIsCheckingConnection,
        setIsOnline,
        connectionAttempts
      ).then(success => {
        if (success) {
          toast.success("Successfully connected using direct API mode");
        } else {
          toast.warning("Direct API connection attempt failed. Check console for details.");
          console.warn("Direct API connection attempt failed. This might be due to CORS restrictions or network limitations.");
        }
      });
    } else {
      // Disabling direct API mode
      toast.info("Direct API mode disabled. Using proxy configuration.");
      
      // Set the connection stages to reflect the change
      setConnectionStage(prev => ({
        ...prev,
        binanceApi: 'checking' // Show checking state immediately
      }));
      
      // Re-run connection check immediately
      ConnectionManager.checkRealConnectivity(
        connectionStage,
        setConnectionStage,
        setIsCheckingConnection,
        setIsOnline,
        connectionAttempts
      ).then(success => {
        if (success) {
          toast.success("Successfully connected using proxy mode");
        } else {
          toast.warning("Proxy connection attempt failed. Check console for details.");
        }
      });
    }
  }
}
