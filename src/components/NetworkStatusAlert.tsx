
import React from 'react';
import { Alert } from "@/components/ui/alert";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkAlertMessage } from './network/NetworkAlertMessage';

export const NetworkStatusAlert = () => {
  const { 
    isOnline, 
    isVisible, 
    isCheckingConnection, 
    initialCheckDone,
    connectionStage,
    handleCheckConnection,
    handleEnableOfflineMode,
    setIsVisible
  } = useNetworkStatus();
  
  // Skip initial render to prevent alert flickering during page load
  if (!initialCheckDone) return null;
  
  // Don't show alert if not visible
  if (!isVisible) return null;
  
  return (
    <Alert className={`${isOnline ? 'bg-yellow-900/30 border-yellow-700' : 'bg-red-900/30 border-red-700'} mb-4 sticky top-0 z-50`}>
      <NetworkAlertMessage
        isOnline={isOnline}
        isCheckingConnection={isCheckingConnection}
        connectionStage={connectionStage}
        onCheckConnection={handleCheckConnection}
        onEnableOfflineMode={handleEnableOfflineMode}
        onDismiss={() => setIsVisible(false)}
      />
    </Alert>
  );
};
