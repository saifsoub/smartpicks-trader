
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
  
  // Check if connection checks should be bypassed
  const shouldBypassChecks = StorageManager.shouldBypassConnectionChecks();
  
  // Comprehensive connection check that runs all stages
  const checkRealConnectivity = useCallback(async (): Promise<boolean> => {
    return ConnectionManager.checkRealConnectivity(
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      connectionAttempts
    );
  }, [connectionStage, connectionAttempts]);

  // Handle check connection button
  const handleCheckConnection = async () => {
    return ConnectionManager.handleCheckConnection(
      setConnectionAttempts,
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      setIsVisible,
      connectionAttempts
    );
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    ConnectionManager.handleEnableOfflineMode(setIsVisible);
  };
  
  // Toggle bypass connection checks
  const handleBypassConnectionChecks = () => {
    ConnectionManager.handleBypassConnectionChecks(
      connectionStage,
      setConnectionStage,
      setIsOnline,
      setIsCheckingConnection,
      connectionAttempts
    );
  };
  
  // Handle force direct API connections
  const handleForceDirectApi = () => {
    ConnectionManager.handleForceDirectApi(
      connectionStage,
      setConnectionStage,
      setIsCheckingConnection,
      setIsOnline,
      connectionAttempts
    );
  };
  
  // React to browser online/offline events
  useEffect(() => {
    // Initial check with short delay to avoid doing it during initial render
    setTimeout(() => {
      if (!shouldBypassChecks) {
        checkRealConnectivity();
      } else {
        // If bypass is enabled, just set everything to success
        setConnectionStage({
          internet: 'success',
          binanceApi: 'success',
          account: 'success'
        });
        setIsOnline(true);
      }
      setInitialCheckDone(true);
    }, 1000);
    
    // Setup network event listeners
    const cleanupNetworkEvents = NetworkEventHandler.setupNetworkEventListeners(
      checkRealConnectivity,
      setIsOnline,
      setIsVisible,
      setConnectionStage
    );
    
    return cleanupNetworkEvents;
  }, [checkRealConnectivity, shouldBypassChecks]);
  
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
