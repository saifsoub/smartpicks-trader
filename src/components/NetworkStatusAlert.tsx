
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import binanceService from '@/services/binanceService';

export const NetworkStatusAlert = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Don't immediately hide when coming back online - verify first
      checkRealConnectivity().then(hasRealConnectivity => {
        if (hasRealConnectivity) {
          setIsVisible(false);
          setConnectionAttempts(0);
        }
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check - but with a short delay to let the network stabilize
    setTimeout(() => {
      if (!navigator.onLine) {
        setIsVisible(true);
      } else {
        // Verify real connectivity on mount, but don't show alert unless we're certain
        checkRealConnectivity().then(hasRealConnectivity => {
          // Only show the alert if we're definitely offline
          if (!hasRealConnectivity && !navigator.onLine) {
            setIsVisible(true);
          }
        });
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check real connectivity beyond just the browser's online status
  const checkRealConnectivity = async (): Promise<boolean> => {
    try {
      setIsCheckingConnection(true);
      
      // Test connectivity to multiple endpoints for better accuracy
      // More reliable endpoints that are less likely to be blocked
      const endpoints = [
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace'
      ];
      
      // Try each endpoint with a short timeout
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            setIsCheckingConnection(false);
            return true; // We have connectivity
          }
        } catch {
          // Try next endpoint
          continue;
        }
      }
      
      // Check Binance specific connectivity as a last resort
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://api.binance.com/api/v3/time', {
          method: 'HEAD',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setIsCheckingConnection(false);
          return true; // We have Binance connectivity
        }
      } catch {
        // Binance-specific check failed
      }
      
      // All endpoints failed
      setIsCheckingConnection(false);
      return false;
    } catch {
      setIsCheckingConnection(false);
      return false;
    }
  };
  
  // Handle check connection button
  const handleCheckConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    setIsCheckingConnection(true);
    
    // Test internet connection
    const hasConnectivity = await checkRealConnectivity();
    
    if (hasConnectivity) {
      setIsOnline(true);
      setIsVisible(false);
      setIsCheckingConnection(false);
      
      // If we previously thought we were offline, test Binance connection
      if (!isOnline) {
        binanceService.testConnection().catch(() => {
          // Don't do anything special on error, just let the service handle it
        });
      }
    } else {
      setIsOnline(false);
      setIsVisible(true);
      setIsCheckingConnection(false);
      
      // If multiple connection attempts have failed, suggest offline mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode()) {
        // Automatically enable offline mode after multiple failed attempts
        binanceService.setOfflineMode(true);
      }
    }
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <Alert className={`${isOnline ? 'bg-yellow-900/30 border-yellow-700' : 'bg-red-900/30 border-red-700'} mb-4 sticky top-0 z-50`}>
      <div className="flex items-start">
        {isOnline ? (
          <Wifi className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
        )}
        <AlertDescription className="flex-1">
          <div className="text-sm flex flex-col space-y-2">
            <span className={isOnline ? "text-yellow-200" : "text-red-200"}>
              {isOnline 
                ? "Network connectivity issues detected. Your connection appears unstable." 
                : "Your device appears to be offline. Please check your internet connection."}
            </span>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={isOnline 
                  ? "bg-yellow-800/30 border-yellow-700 text-yellow-200 hover:bg-yellow-800" 
                  : "bg-red-800/30 border-red-700 text-red-200 hover:bg-red-800"
                }
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Connection
                  </>
                )}
              </Button>
              
              {!binanceService.isInOfflineMode() && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-blue-800/30 border-blue-700 text-blue-200 hover:bg-blue-800"
                  onClick={handleEnableOfflineMode}
                >
                  <CloudOff className="mr-2 h-4 w-4" />
                  Enable Offline Mode
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className={isOnline 
                  ? "bg-yellow-800/30 border-yellow-700 text-yellow-200 hover:bg-yellow-800" 
                  : "bg-red-800/30 border-red-700 text-red-200 hover:bg-red-800"
                }
                onClick={() => setIsVisible(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
