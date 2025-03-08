
import { useState, useEffect, useCallback } from 'react';
import binanceService from '@/services/binanceService';
import { toast } from 'sonner';
import { ConnectionStage } from '@/components/network/NetworkAlertMessage';

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
  
  // Check internet connectivity using multiple reliable methods
  const checkInternetConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({ ...prev, internet: 'checking' }));
      
      // First try navigator.onLine as a quick check
      if (!navigator.onLine) {
        console.log("Browser reports device is offline");
        setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
        return false;
      }
      
      // Test multiple endpoints for better accuracy
      const endpoints = [
        { url: 'https://www.cloudflare.com/cdn-cgi/trace', timeout: 5000 },
        { url: 'https://www.google.com/generate_204', timeout: 5000 },
        { url: 'https://httpbin.org/status/200', timeout: 5000 },
        { url: 'https://1.1.1.1/cdn-cgi/trace', timeout: 5000 }
      ];
      
      // Try each endpoint with a proper timeout
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing internet connection with ${endpoint.url}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
          
          const response = await fetch(endpoint.url, {
            method: 'HEAD',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`Internet connectivity confirmed via ${endpoint.url}`);
            setConnectionStage(prev => ({ ...prev, internet: 'success' }));
            return true;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint.url} check failed:`, error);
          // Try next endpoint
          continue;
        }
      }
      
      // All endpoints failed
      console.log("All internet connectivity checks failed");
      setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
      return false;
    } catch (error) {
      console.error("Error checking internet connectivity:", error);
      setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
      return false;
    }
  }, []);
  
  // Check if Binance API is accessible
  const checkBinanceApiAccess = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({ ...prev, binanceApi: 'checking' }));
      
      // First try Binance time endpoint which doesn't require authentication
      try {
        console.log("Testing Binance API connection...");
        const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (timeResponse.ok) {
          const data = await timeResponse.json();
          console.log("Binance API time endpoint responded:", data);
          setConnectionStage(prev => ({ ...prev, binanceApi: 'success' }));
          return true;
        }
      } catch (timeError) {
        console.warn("Binance time endpoint check failed:", timeError);
      }
      
      // Try ping endpoint as a fallback
      try {
        console.log("Testing Binance ping endpoint...");
        const pingResponse = await fetch('https://api.binance.com/api/v3/ping', {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (pingResponse.ok) {
          console.log("Binance API ping successful");
          setConnectionStage(prev => ({ ...prev, binanceApi: 'success' }));
          return true;
        }
      } catch (pingError) {
        console.warn("Binance ping endpoint check failed:", pingError);
      }
      
      // If both checks failed, check if it might be a CORS issue by using a proxy check
      if (binanceService.getProxyMode()) {
        try {
          console.log("Testing Binance connection via proxy...");
          const proxyResult = await binanceService.testConnection();
          if (proxyResult) {
            console.log("Binance API accessible via proxy");
            setConnectionStage(prev => ({ ...prev, binanceApi: 'success' }));
            return true;
          }
        } catch (proxyError) {
          console.warn("Proxy connection check failed:", proxyError);
        }
      }
      
      // All Binance API checks failed
      console.log("All Binance API connectivity checks failed");
      setConnectionStage(prev => ({ ...prev, binanceApi: 'failed' }));
      return false;
    } catch (error) {
      console.error("Error checking Binance API access:", error);
      setConnectionStage(prev => ({ ...prev, binanceApi: 'failed' }));
      return false;
    }
  }, []);
  
  // Check account access (authentication)
  const checkAccountAccess = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({ ...prev, account: 'checking' }));
      
      if (!binanceService.hasCredentials()) {
        console.log("No API credentials configured");
        setConnectionStage(prev => ({ ...prev, account: 'failed' }));
        return false;
      }
      
      console.log("Testing account access...");
      
      // Try to access account data
      try {
        const accountInfo = await binanceService.getAccountInfo();
        
        // Check if this is real account data or just demo/fallback data
        const isRealData = !accountInfo.isDefault && !accountInfo.isLimitedAccess;
        
        if (isRealData) {
          console.log("Successfully accessed account data:", accountInfo);
          setConnectionStage(prev => ({ ...prev, account: 'success' }));
          return true;
        } else {
          console.warn("Received fallback account data, not real API data");
        }
      } catch (accountError) {
        console.warn("Account access check failed:", accountError);
      }
      
      // Try detecting API permissions as a fallback
      try {
        const permissions = await binanceService.detectApiPermissions();
        if (permissions.read) {
          console.log("API key has read permission");
          setConnectionStage(prev => ({ ...prev, account: 'success' }));
          return true;
        } else {
          console.warn("API key doesn't have read permission");
        }
      } catch (permissionError) {
        console.warn("Permission detection failed:", permissionError);
      }
      
      console.log("All account access checks failed");
      setConnectionStage(prev => ({ ...prev, account: 'failed' }));
      return false;
    } catch (error) {
      console.error("Error checking account access:", error);
      setConnectionStage(prev => ({ ...prev, account: 'failed' }));
      return false;
    }
  }, []);
  
  // Comprehensive connection check that runs all stages
  const checkRealConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      setIsCheckingConnection(true);
      
      // Reset all stages
      setConnectionStage({
        internet: 'unknown',
        binanceApi: 'unknown',
        account: 'unknown'
      });
      
      // Stage 1: Check internet connectivity
      const hasInternetConnection = await checkInternetConnectivity();
      if (!hasInternetConnection) {
        console.log("Internet connectivity check failed");
        setIsCheckingConnection(false);
        setIsOnline(false);
        toast.error("No internet connection detected. Please check your network settings.");
        return false;
      }
      
      // Stage 2: Check Binance API accessibility
      const canAccessBinanceApi = await checkBinanceApiAccess();
      if (!canAccessBinanceApi) {
        console.log("Binance API accessibility check failed");
        setIsCheckingConnection(false);
        setIsOnline(false);
        toast.error("Cannot access Binance API. The service might be blocked in your region or there's a temporary outage.");
        return false;
      }
      
      // Stage 3: Check account access
      const hasAccountAccess = await checkAccountAccess();
      if (!hasAccountAccess) {
        console.log("Account access check failed");
        setIsCheckingConnection(false);
        setIsOnline(true); // Internet works, but account access fails
        toast.error("Could not access your Binance account. Please check your API keys and permissions.");
        return false;
      }
      
      // All checks passed
      console.log("All connectivity checks passed successfully");
      setIsCheckingConnection(false);
      setIsOnline(true);
      return true;
    } catch (error) {
      console.error("Error in comprehensive connectivity check:", error);
      setIsCheckingConnection(false);
      setIsOnline(false);
      return false;
    }
  }, [checkInternetConnectivity, checkBinanceApiAccess, checkAccountAccess]);

  // Handle check connection button
  const handleCheckConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    console.log("Manual connection check initiated");
    
    const success = await checkRealConnectivity();
    
    if (success) {
      setIsVisible(false);
      console.log("Manual connectivity check succeeded");
      toast.success("Successfully connected to Binance API and verified account access");
      return true;
    } else {
      setIsVisible(true);
      console.log("Manual connectivity check failed");
      
      // If multiple connection attempts have failed, suggest offline mode
      if (connectionAttempts >= 2 && !binanceService.isInOfflineMode()) {
        toast.info("Multiple connection attempts failed. Consider enabling offline mode for testing.");
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
  
  // React to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser reports online status");
      // Verify first after a small delay
      setTimeout(() => {
        checkRealConnectivity();
      }, 1000);
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setIsOnline(false);
      setIsVisible(true);
      setConnectionStage(prev => ({
        ...prev,
        internet: 'failed',
        binanceApi: 'failed',
        account: 'failed'
      }));
      toast.error("Your device is offline. Some features will be limited until connection is restored.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check on page load
    const initialCheckTimer = setTimeout(async () => {
      await checkRealConnectivity();
      setInitialCheckDone(true);
    }, 1000);
    
    // Set up a periodic check for connection status
    const periodicCheckTimer = setInterval(() => {
      if (initialCheckDone && !isCheckingConnection) {
        // Only do quick checks periodically, not full checks
        checkInternetConnectivity().then(internetConnected => {
          if (!internetConnected && isOnline) {
            setIsOnline(false);
            setIsVisible(true);
            setConnectionStage(prev => ({
              ...prev,
              internet: 'failed',
              binanceApi: 'unknown',
              account: 'unknown'
            }));
          }
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheckTimer);
      clearInterval(periodicCheckTimer);
    };
  }, [checkRealConnectivity, initialCheckDone, isCheckingConnection, isOnline, checkInternetConnectivity]);

  return {
    isOnline,
    isVisible,
    isCheckingConnection,
    initialCheckDone,
    connectionStage,
    handleCheckConnection,
    handleEnableOfflineMode,
    setIsVisible
  };
}
