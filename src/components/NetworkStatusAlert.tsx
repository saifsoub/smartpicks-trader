
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import binanceService from '@/services/binanceService';

export const NetworkStatusAlert = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  
  // More reliable connectivity check that uses multiple endpoints
  const checkRealConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      setIsCheckingConnection(true);
      
      // Test connectivity to multiple endpoints for better accuracy
      const endpoints = [
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://httpbin.org/status/200'
      ];
      
      // Try each endpoint with a proper timeout
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
      
      // As a last resort, check Binance specific connectivity
      if (navigator.onLine) {
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
      }
      
      // All endpoints failed
      setIsCheckingConnection(false);
      return false;
    } catch {
      setIsCheckingConnection(false);
      return false;
    }
  }, []);
  
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
      // Don't immediately show alert - double check first
      checkRealConnectivity().then(hasRealConnectivity => {
        if (!hasRealConnectivity) {
          setIsVisible(true);
        }
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check - but with a longer delay to let the network stabilize
    const initialCheckTimer = setTimeout(async () => {
      // Only run the check if browser reports as offline or we need to verify
      if (!navigator.onLine) {
        // Double check with our more reliable method
        const hasConnectivity = await checkRealConnectivity();
        if (!hasConnectivity) {
          setIsVisible(true);
        }
      }
      setInitialCheckDone(true);
    }, 2000); // Increased to 2 seconds for better stability
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheckTimer);
    };
  }, [checkRealConnectivity]);
  
  // Handle check connection button
  const handleCheckConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    setIsCheckingConnection(true);
    
    // Clear any existing alerts temporarily during check
    setIsVisible(false);
    
    // Test internet connection with a slight delay to ensure UI updates
    setTimeout(async () => {
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
    }, 500);
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
  };
  
  // Skip initial render to prevent alert flickering during page load
  if (!initialCheckDone) return null;
  
  // Don't show alert if not visible
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
                : "Network connectivity issue detected. Please check your internet connection."}
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
