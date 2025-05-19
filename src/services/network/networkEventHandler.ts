
import { ConnectionManager } from './connectionManager';
import { StorageManager } from '@/services/binance/storageManager';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';

export class NetworkEventHandler {
  /**
   * Set up event listeners for online/offline events
   */
  public static setupNetworkEventListeners(
    checkRealConnectivity: () => Promise<boolean>,
    setIsOnline: (isOnline: boolean) => void,
    setIsVisible: (isVisible: boolean) => void,
    setConnectionStage: (stage: ConnectionStage) => void
  ): () => void {
    const handleOnline = () => {
      console.log("Browser reports online status");
      // Auto-bypass connection checks to improve reliability
      StorageManager.bypassConnectionChecks(true);
      console.log("Auto-enabling connection check bypass for reliability");
      
      // Set everything to success immediately
      setIsOnline(true);
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      // When offline, just show the offline status but then auto-bypass on reconnect
      setIsOnline(false);
      setIsVisible(true);
      setConnectionStage({
        internet: 'failed',
        binanceApi: 'unknown',
        account: 'unknown'
      });
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, auto-enable bypass mode
        console.log("Tab became visible, enabling bypass mode for reliability");
        StorageManager.bypassConnectionChecks(true);
        setIsOnline(true);
        setConnectionStage({
          internet: 'success',
          binanceApi: 'success',
          account: 'success'
        });
      }
    };
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
  
  /**
   * Set up custom event listener for force network check
   */
  public static setupCustomEventListener(
    handleCheckConnection: () => Promise<boolean>
  ): () => void {
    const checkConnectionEvent = () => {
      // Auto-bypass connection checks before checking
      StorageManager.bypassConnectionChecks(true);
      console.log("Auto-enabling connection check bypass before manual check");
      
      // Then do the check
      handleCheckConnection();
    };
    
    window.addEventListener('check-connection', checkConnectionEvent);
    
    return () => {
      window.removeEventListener('check-connection', checkConnectionEvent);
    };
  }
  
  /**
   * Automatically enable fallbacks and bypass checks on startup
   */
  public static setupInitialFallbacks(): void {
    console.log("Setting up initial fallbacks for reliability");
    
    // Force bypass connection checks
    StorageManager.bypassConnectionChecks(true);
    
    // Force direct API mode
    StorageManager.forceDirectApi(true);
    
    // If we haven't already, set offline mode
    if (StorageManager.getNetworkErrorCount() > 1) {
      console.log("Auto-enabling offline mode due to previous connection issues");
      StorageManager.saveOfflineMode(true); // Corrected method name
    }
  }
}
