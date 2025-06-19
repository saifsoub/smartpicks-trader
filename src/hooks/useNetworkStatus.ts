
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';
import { StorageManager } from '@/services/binance/storageManager';
import { ConnectivityChecker } from '@/services/network/connectivityChecker';
import { ConnectionManager } from '@/services/network/connectionManager';
import { NetworkEventHandler } from '@/services/network/networkEventHandler';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [connectionStage, setConnectionStage] = useState<ConnectionStage>({
    internet: 'unknown', 
    binanceApi: 'unknown',
    account: 'unknown'
  });
  
  // Comprehensive connection check that runs all stages
  const checkRealConnectivity = useCallback(async (): Promise<boolean> => {
    const shouldBypass = StorageManager.shouldBypassConnectionChecks();
    
    if (shouldBypass) {
      console.log('Connection checks are bypassed');
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsOnline(true);
      return true;
    }
    
    setIsCheckingConnection(true);
    let allGood = true;
    
    try {
      // Step 1: Check internet connectivity
      const internetOk = await ConnectivityChecker.checkInternetConnectivity(
        connectionStage,
        setConnectionStage,
        shouldBypass
      );
      
      if (!internetOk) {
        allGood = false;
        setIsOnline(false);
        setIsVisible(true);
      }
      
      // Step 2: Check Binance API access (if internet is working)
      if (internetOk) {
        const binanceOk = await ConnectivityChecker.checkBinanceApiAccess(
          connectionStage,
          setConnectionStage,
          connectionAttempts,
          shouldBypass
        );
        
        if (!binanceOk) {
          allGood = false;
          setIsVisible(true);
        }
        
        // Step 3: Check account access (if API is working)
        if (binanceOk) {
          const accountOk = await ConnectivityChecker.checkAccountAccess(
            connectionStage,
            setConnectionStage,
            connectionAttempts,
            shouldBypass
          );
          
          if (!accountOk) {
            // Account issues are less critical than connectivity issues
            console.log('Account access issues detected');
          }
        }
      }
      
      setIsOnline(allGood);
      return allGood;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      setIsOnline(false);
      setIsVisible(true);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, [connectionStage, connectionAttempts]);

  // Handle check connection button
  const handleCheckConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    console.log("Manual connection check initiated");
    
    const result = await checkRealConnectivity();
    
    if (result) {
      setIsVisible(false);
      toast.success("Successfully connected to Binance API");
    } else {
      toast.error("Connection issues detected. Check your network and API settings.");
    }
    
    return result;
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    ConnectionManager.handleEnableOfflineMode(setIsVisible);
  };
  
  // Toggle bypass connection checks
  const handleBypassConnectionChecks = () => {
    const currentValue = StorageManager.shouldBypassConnectionChecks();
    const newValue = !currentValue;
    
    StorageManager.bypassConnectionChecks(newValue);
    
    if (newValue) {
      setConnectionStage({
        internet: 'success',
        binanceApi: 'success',
        account: 'success'
      });
      setIsOnline(true);
      setIsCheckingConnection(false);
      toast.success("Connection checks bypassed");
    } else {
      // Re-run connectivity check
      checkRealConnectivity();
      toast.info("Connection checks re-enabled");
    }
  };
  
  // Handle force direct API connections
  const handleForceDirectApi = () => {
    const currentValue = StorageManager.shouldForceDirectApi();
    const newValue = !currentValue;
    
    StorageManager.forceDirectApi(newValue);
    
    if (newValue) {
      toast.success("Direct API mode enabled");
    } else {
      toast.info("Direct API mode disabled");
    }
    
    // Re-run connectivity check to reflect the change
    checkRealConnectivity();
  };
  
  // Initial connectivity check
  useEffect(() => {
    const performInitialCheck = async () => {
      console.log('Performing initial connectivity check...');
      await checkRealConnectivity();
      setInitialCheckDone(true);
    };
    
    // Delay initial check slightly to avoid doing it during render
    const timeoutId = setTimeout(performInitialCheck, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [checkRealConnectivity]);
  
  // Setup network event listeners
  useEffect(() => {
    const cleanupNetworkEvents = NetworkEventHandler.setupNetworkEventListeners(
      checkRealConnectivity,
      setIsOnline,
      setIsVisible,
      setConnectionStage
    );
    
    return cleanupNetworkEvents;
  }, [checkRealConnectivity]);
  
  // Create a custom event to force network check
  useEffect(() => {
    const cleanupCustomEvent = NetworkEventHandler.setupCustomEventListener(handleCheckConnection);
    return cleanupCustomEvent;
  }, []);
  
  return {
    isOnline,
    isVisible,
    setIsVisible,
    isCheckingConnection,
    initialCheckDone,
    connectionStage,
    connectionAttempts,
    handleCheckConnection,
    handleEnableOfflineMode,
    handleBypassConnectionChecks,
    handleForceDirectApi
  };
}
