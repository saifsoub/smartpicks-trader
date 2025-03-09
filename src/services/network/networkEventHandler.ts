
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
      // Verify first after a small delay
      setTimeout(() => {
        if (!StorageManager.shouldBypassConnectionChecks()) {
          checkRealConnectivity();
        } else {
          setIsOnline(true);
          setConnectionStage({
            internet: 'success',
            binanceApi: 'success',
            account: 'success'
          });
        }
      }, 1000);
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      if (!StorageManager.shouldBypassConnectionChecks()) {
        setIsOnline(false);
        setIsVisible(true);
        setConnectionStage(prev => ({
          ...prev,
          internet: 'failed'
        }));
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !StorageManager.shouldBypassConnectionChecks()) {
        // When tab becomes visible again, check connection
        console.log("Tab became visible, checking connection...");
        checkRealConnectivity();
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
      handleCheckConnection();
    };
    
    window.addEventListener('check-connection', checkConnectionEvent);
    
    return () => {
      window.removeEventListener('check-connection', checkConnectionEvent);
    };
  }
}
