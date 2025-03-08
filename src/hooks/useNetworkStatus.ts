
import { useState, useEffect, useCallback } from 'react';
import binanceService from '@/services/binanceService';

export function useNetworkStatus() {
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
      console.log("Manual connectivity check passed");
      
      // If we previously thought we were offline, test Binance connection
      if (!isOnline) {
        binanceService.testConnection().catch(() => {
          // Don't do anything special on error, just let the service handle it
        });
      }
      
      return true;
    } else {
      setIsOnline(false);
      setIsVisible(true);
      console.log("Manual connectivity check failed");
      
      // If multiple connection attempts have failed, suggest offline mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode()) {
        // Automatically enable offline mode after multiple failed attempts
        binanceService.setOfflineMode(true);
      }
      
      return false;
    }
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
  };
  
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

  return {
    isOnline,
    isVisible,
    isCheckingConnection,
    initialCheckDone,
    handleCheckConnection,
    handleEnableOfflineMode,
    setIsVisible
  };
}
