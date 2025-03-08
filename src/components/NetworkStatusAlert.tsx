
import React from 'react';
import { Alert } from "@/components/ui/alert";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkAlertMessage } from './network/NetworkAlertMessage';
import { toast } from 'sonner';

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

  // Helper function to determine alert severity color
  const getAlertColor = () => {
    if (connectionStage.internet === 'failed') {
      return 'bg-red-900/30 border-red-700'; // Critical error - no internet
    } else if (connectionStage.binanceApi === 'failed') {
      return 'bg-orange-900/30 border-orange-700'; // Serious error - can't reach Binance
    } else if (connectionStage.account === 'failed') {
      return 'bg-yellow-900/30 border-yellow-700'; // Warning - account access issues
    }
    return isOnline ? 'bg-yellow-900/30 border-yellow-700' : 'bg-red-900/30 border-red-700';
  };
  
  // For accessibility, announce connection issues to screen readers
  React.useEffect(() => {
    if (isVisible && !isOnline) {
      toast.error("Connection issues detected", { id: "connection-issue" });
    }
  }, [isVisible, isOnline]);
  
  return (
    <Alert 
      className={`${getAlertColor()} mb-4 sticky top-0 z-50 transition-colors duration-300`}
      aria-live="assertive"
    >
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
