
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import binanceService from '@/services/binanceService';

export const NetworkStatusAlert = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  
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
    
    // Initial check
    if (!navigator.onLine) {
      setIsVisible(true);
    } else {
      // Verify real connectivity on mount
      checkRealConnectivity().then(hasRealConnectivity => {
        if (!hasRealConnectivity) {
          setIsVisible(true);
        }
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check real connectivity beyond just the browser's online status
  const checkRealConnectivity = async (): Promise<boolean> => {
    try {
      // Test connectivity to multiple endpoints for better accuracy
      const endpoints = [
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://api.binance.com/api/v3/time'
      ];
      
      // Try each endpoint with a short timeout
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: AbortSignal.timeout(3000) // Short timeout
          });
          
          if (response.ok) {
            return true; // We have connectivity
          }
        } catch {
          // Try next endpoint
          continue;
        }
      }
      
      // All endpoints failed
      return false;
    } catch {
      return false;
    }
  };
  
  // Handle check connection button
  const handleCheckConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    
    // Test internet connection
    const hasConnectivity = await checkRealConnectivity();
    
    if (hasConnectivity) {
      setIsOnline(true);
      setIsVisible(false);
      // If we previously thought we were offline, test Binance connection
      if (!isOnline) {
        binanceService.testConnection().catch(() => {
          // Don't do anything special on error, just let the service handle it
        });
      }
    } else {
      setIsOnline(false);
      setIsVisible(true);
      
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
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Connection
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
