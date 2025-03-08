
import { useState, useEffect, useCallback } from 'react';
import binanceService from '@/services/binanceService';
import { toast } from 'sonner';

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
      
      // First check if Binance is reachable through direct API
      try {
        const binanceResponse = await fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: AbortSignal.timeout(3000) // Shorter timeout for faster checks
        });
        
        if (binanceResponse.ok) {
          console.log("Binance API is directly reachable");
          setIsCheckingConnection(false);
          return true;
        }
      } catch (binanceError) {
        console.log("Direct Binance API check failed:", binanceError);
      }
      
      // Try direct Binance check with a simple endpoint
      try {
        const pingResponse = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: AbortSignal.timeout(3000)
        });
        
        if (pingResponse.ok) {
          console.log("Binance API ping successful");
          setIsCheckingConnection(false);
          return true;
        }
      } catch (pingError) {
        console.log("Binance API ping failed:", pingError);
      }
      
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
          const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout
          
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`General internet connectivity confirmed via ${endpoint}, but Binance may be unreachable`);
            setIsCheckingConnection(false);
            
            // We have internet but Binance might be blocked - suggest API settings
            toast.warning("Internet works but Binance API is unreachable. Check your API settings or enable offline mode.");
            return false; // Return false because Binance is not reachable
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} check failed:`, error);
          // Try next endpoint
          continue;
        }
      }
      
      // All endpoints failed
      setIsCheckingConnection(false);
      console.log("All connectivity checks failed - device appears to be offline");
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
    
    console.log("Manual connection check initiated");
    
    // Test internet connection
    const hasConnectivity = await checkRealConnectivity();
    
    if (hasConnectivity) {
      setIsOnline(true);
      
      // If we confirmed basic connectivity, let's try to test Binance connection
      const binanceConnected = await binanceService.testConnection().catch(() => false);
      
      if (binanceConnected) {
        setIsVisible(false);
        console.log("Manual Binance connectivity check passed");
        toast.success("Successfully connected to Binance API");
      } else {
        setIsVisible(true);
        console.log("Manual connectivity check: Internet works but Binance is unreachable");
        toast.error("Internet is working but Binance API is unreachable. Please check your API credentials.");
      }
      
      return binanceConnected;
    } else {
      setIsOnline(false);
      setIsVisible(true);
      console.log("Manual connectivity check failed");
      
      // If multiple connection attempts have failed, suggest offline mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode()) {
        // Automatically enable offline mode after multiple failed attempts
        binanceService.setOfflineMode(true);
        toast.info("Enabled offline mode after multiple failed connection attempts");
      }
      
      return false;
    }
  };
  
  // Enable offline mode
  const handleEnableOfflineMode = () => {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
    toast.success("Offline mode enabled. The application will use simulated trading.");
  };
  
  // Create a custom event to force network check
  useEffect(() => {
    const checkConnectionEvent = (event: CustomEvent) => {
      handleCheckConnection();
    };
    
    window.addEventListener('check-connection' as any, checkConnectionEvent);
    
    return () => {
      window.removeEventListener('check-connection' as any, checkConnectionEvent);
    };
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
            setConnectionAttempts(0);
            console.log("Connectivity confirmed after online event");
            
            // Try a Binance connection test
            binanceService.testConnection().catch(() => {
              console.log("Binance connection test failed after device came online");
              setIsVisible(true);
            });
          } else {
            console.log("Browser reports online but connectivity check failed");
            setIsVisible(true);
          }
        });
      }, 1000);
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setIsOnline(false);
      setIsVisible(true);
      toast.error("Your device is offline. Some features will be limited until connection is restored.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check on page load
    const initialCheckTimer = setTimeout(async () => {
      const hasConnectivity = await checkRealConnectivity();
      
      if (!hasConnectivity) {
        setIsOnline(false);
        setIsVisible(true);
        console.log("Initial connectivity check failed");
        toast.error("Unable to connect to Binance API. Check your network connection and API settings.");
      } else {
        setIsOnline(true);
        
        // Even if general connectivity is ok, specifically check Binance
        const binanceConnected = await binanceService.testConnection().catch(() => false);
        if (!binanceConnected) {
          setIsVisible(true);
          console.log("Initial Binance connection test failed");
          toast.warning("Connected to internet but not to Binance API. Please check your API settings.");
        } else {
          setIsVisible(false);
          console.log("Initial Binance connection test succeeded");
        }
      }
      
      setInitialCheckDone(true);
    }, 1500); // Shorter initial delay
    
    // Set up a periodic check for connection status
    const periodicCheckTimer = setInterval(() => {
      if (initialCheckDone && !isCheckingConnection) {
        checkRealConnectivity().then(connected => {
          // Only update if there's a change to avoid unnecessary re-renders
          if (connected !== isOnline) {
            setIsOnline(connected);
            if (!connected && !isVisible) {
              setIsVisible(true);
            }
          }
        });
      }
    }, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheckTimer);
      clearInterval(periodicCheckTimer);
    };
  }, [checkRealConnectivity, initialCheckDone, isCheckingConnection, isOnline, isVisible]);

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
