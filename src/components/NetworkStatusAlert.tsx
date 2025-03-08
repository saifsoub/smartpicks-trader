
import React, { useEffect, useState } from 'react';
import { Alert } from "@/components/ui/alert";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkAlertMessage } from './network/NetworkAlertMessage';
import { Wifi, WifiOff, X } from 'lucide-react';
import { Button } from './ui/button';

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
  
  // Auto-dismiss timer for non-critical alerts
  const [dismissCountdown, setDismissCountdown] = useState<number | null>(null);
  
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
  // But make notifications less intrusive - only show once per session
  useEffect(() => {
    if (isVisible && !isOnline) {
      // Use a session storage flag to avoid repeated notifications
      const hasNotified = sessionStorage.getItem('connection-issue-notified');
      if (!hasNotified) {
        // Only log error to console, don't show toast
        console.error("Connection issues detected");
        sessionStorage.setItem('connection-issue-notified', 'true');
      }
    }
    
    // Start auto-dismiss countdown for non-critical alerts
    if (isVisible && isOnline && connectionStage.internet !== 'failed') {
      // Don't auto-dismiss critical failures
      setDismissCountdown(8); // 8 second countdown (reduced from 15)
      
      const countdownInterval = setInterval(() => {
        setDismissCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            // Auto-dismiss after countdown
            setIsVisible(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [isVisible, isOnline, connectionStage.internet, setIsVisible]);
  
  // Determine if the alert should be positioned as a smaller notification
  const isMinorIssue = isOnline && connectionStage.internet === 'success' && 
                      (connectionStage.binanceApi === 'success' || connectionStage.binanceApi === 'unknown');
  
  // Always show as a smaller notification to be less intrusive
  const alertPosition = 'fixed bottom-4 right-4 max-w-md z-50 shadow-lg';
  
  return (
    <Alert 
      className={`${getAlertColor()} mb-0 ${alertPosition} transition-all duration-300`}
      aria-live="assertive"
    >
      <div className="absolute right-2 top-2 flex items-center space-x-2 text-xs">
        {dismissCountdown !== null && (
          <span className="text-gray-300 text-xs mr-1">{dismissCountdown}s</span>
        )}
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-400" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-400" />
        )}
        <span className={isOnline ? "text-green-400" : "text-red-400"}>
          {isOnline ? "Limited Connection" : "Disconnected"}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 text-gray-400 hover:text-white hover:bg-gray-700/50"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
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
