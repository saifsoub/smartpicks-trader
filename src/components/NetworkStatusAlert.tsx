
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import binanceService from '@/services/binanceService';
import { toast } from "sonner";

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
      
      // Test connectivity to multiple reliable endpoints for better accuracy
      const endpoints = [
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://www.google.com/generate_204',
        'https://httpbin.org/status/200',
        'https://1.1.1.1/cdn-cgi/trace'
      ];
      
      // Try each endpoint with a proper timeout
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout
          
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`Connectivity confirmed via ${endpoint}`);
            setIsCheckingConnection(false);
            return true; // We have connectivity
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} check failed:`, error);
          // Try next endpoint
          continue;
        }
      }
      
      // As a last resort, check Binance specific connectivity
      // Only do this if we've already tried other endpoints and failed
      if (navigator.onLine) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://api.binance.com/api/v3/ping', {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log("Connectivity confirmed via Binance API");
            setIsCheckingConnection(false);
            return true;
          }
        } catch (error) {
          console.log("Binance API check failed:", error);
        }
      }
      
      // All endpoints failed
      setIsCheckingConnection(false);
      console.log("All connectivity checks failed");
      return false;
    } catch (error) {
      console.error("Error checking connectivity:", error);
      setIsCheckingConnection(false);
      return false;
    }
  }, []);
  
  // Make sure we react to browser online/offline events
  useEffect(() => {
    // Wait a moment before responding to online/offline events
    // to avoid false positives
    const handleOnline = () => {
      console.log("Browser reports online status");
      // Don't immediately update - verify first after a small delay
      setTimeout(() => {
        checkRealConnectivity().then(hasRealConnectivity => {
          if (hasRealConnectivity) {
            setIsOnline(true);
            setIsVisible(false);
            setConnectionAttempts(0);
            console.log("Connectivity confirmed after online event");
          } else {
            console.log("Browser reports online but connectivity check failed");
          }
        });
      }, 1000);
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      // Don't immediately update - verify first after a small delay
      setTimeout(() => {
        checkRealConnectivity().then(hasRealConnectivity => {
          if (!hasRealConnectivity) {
            setIsOnline(false);
            setIsVisible(true);
            console.log("Offline status confirmed");
          } else {
            console.log("Browser reports offline but connectivity check passed");
          }
        });
      }, 1000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check - with a longer delay to let the network stabilize
    // and avoid false negatives during page load
    const initialCheckTimer = setTimeout(async () => {
      const hasConnectivity = await checkRealConnectivity();
      
      if (!hasConnectivity) {
        setIsOnline(false);
        setIsVisible(true);
        console.log("Initial connectivity check failed");
      } else {
        setIsOnline(true);
        setIsVisible(false);
        console.log("Initial connectivity check passed");
      }
      
      setInitialCheckDone(true);
    }, 3000); // Increased to 3 seconds for better stability
    
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
    
    console.log("Manual connection check initiated");
    
    // Test internet connection
    const hasConnectivity = await checkRealConnectivity();
    
    if (hasConnectivity) {
      setIsOnline(true);
      setIsVisible(false);
      toast.success("Your internet connection is working");
      console.log("Manual connectivity check passed");
      
      // If we previously thought we were offline, test Binance connection
      if (!isOnline) {
        binanceService.testConnection().catch(() => {
          // Don't do anything special on error, just let the service handle it
        });
      }
    } else {
      setIsOnline(false);
      setIsVisible(true);
      toast.error("Internet connectivity issues detected");
      console.log("Manual connectivity check failed");
      
      // If multiple connection attempts have failed, suggest offline mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode()) {
        // Automatically enable offline mode after multiple failed attempts
        binanceService.setOfflineMode(true);
      }
    }
    
    setIsCheckingConnection(false);
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
