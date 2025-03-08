
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
  
  // Enhanced Internet connectivity check using multiple methods
  const checkInternetConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({ ...prev, internet: 'checking' }));
      
      // First try navigator.onLine as a quick check
      if (!navigator.onLine) {
        console.log("Browser reports device is offline");
        setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
        return false;
      }
      
      // Test multiple endpoints with different protocols and domains
      const endpoints = [
        { url: 'https://httpbin.org/status/200', timeout: 5000 },
        { url: 'https://www.cloudflare.com/cdn-cgi/trace', timeout: 5000 },
        { url: 'https://www.google.com/generate_204', timeout: 5000 },
        { url: 'https://1.1.1.1/cdn-cgi/trace', timeout: 5000 },
        // Try directly hitting the API to see if that specific connection works
        { url: 'https://api.binance.com/api/v3/ping', timeout: 5000 }
      ];
      
      // Try alternative sites if primary ones fail 
      const backupEndpoints = [
        { url: 'https://catfact.ninja/fact', timeout: 3000 },
        { url: 'https://www.apple.com/favicon.ico', timeout: 3000 },
        { url: 'https://www.microsoft.com/favicon.ico', timeout: 3000 }
      ];
      
      // Try each endpoint with proper timeout
      let successfulEndpoint = null;
      
      // First try the main endpoints
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
            successfulEndpoint = endpoint.url;
            setConnectionStage(prev => ({ ...prev, internet: 'success' }));
            return true;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint.url} check failed:`, error);
          // Continue to next endpoint
        }
      }
      
      // If all main endpoints fail, try the backup endpoints
      if (!successfulEndpoint) {
        for (const endpoint of backupEndpoints) {
          try {
            console.log(`Testing internet connection with backup endpoint ${endpoint.url}`);
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
              console.log(`Internet connectivity confirmed via backup endpoint ${endpoint.url}`);
              successfulEndpoint = endpoint.url;
              setConnectionStage(prev => ({ ...prev, internet: 'success' }));
              return true;
            }
          } catch (error) {
            console.log(`Backup endpoint ${endpoint.url} check failed:`, error);
            // Continue to next endpoint
          }
        }
      }
      
      // Try a different approach - check if XMLHttpRequest works when fetch fails
      if (!successfulEndpoint) {
        try {
          console.log("Trying XMLHttpRequest as fallback method");
          return await new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const timeout = setTimeout(() => {
              xhr.abort();
              console.log("XMLHttpRequest timeout");
              resolve(false);
            }, 5000);
            
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                clearTimeout(timeout);
                if (xhr.status >= 200 && xhr.status < 300) {
                  console.log("XMLHttpRequest succeeded");
                  setConnectionStage(prev => ({ ...prev, internet: 'success' }));
                  resolve(true);
                } else {
                  console.log("XMLHttpRequest failed with status:", xhr.status);
                  resolve(false);
                }
              }
            };
            
            xhr.onerror = function() {
              clearTimeout(timeout);
              console.log("XMLHttpRequest error");
              resolve(false);
            };
            
            xhr.open("HEAD", "https://httpbin.org/status/200", true);
            xhr.send();
          });
        } catch (xhrError) {
          console.log("XMLHttpRequest approach failed:", xhrError);
        }
      }
      
      // All internet connectivity checks failed
      console.log("All internet connectivity checks failed");
      setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
      return false;
    } catch (error) {
      console.error("Error checking internet connectivity:", error);
      setConnectionStage(prev => ({ ...prev, internet: 'failed' }));
      return false;
    }
  }, []);
  
  // Enhanced check for Binance API accessibility
  const checkBinanceApiAccess = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({ ...prev, binanceApi: 'checking' }));
      
      // First try using modern fetch API
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
      
      // Try XMLHttpRequest as another approach
      try {
        console.log("Trying XMLHttpRequest for Binance API");
        return await new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          const timeout = setTimeout(() => {
            xhr.abort();
            console.log("XMLHttpRequest timeout for Binance API");
            resolve(false);
          }, 10000);
          
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              clearTimeout(timeout);
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log("XMLHttpRequest succeeded for Binance API");
                setConnectionStage(prev => ({ ...prev, binanceApi: 'success' }));
                resolve(true);
              } else {
                console.log("XMLHttpRequest failed for Binance API with status:", xhr.status);
                resolve(false);
              }
            }
          };
          
          xhr.onerror = function() {
            clearTimeout(timeout);
            console.log("XMLHttpRequest error for Binance API");
            resolve(false);
          };
          
          xhr.open("GET", "https://api.binance.com/api/v3/ping", true);
          xhr.send();
        });
      } catch (xhrError) {
        console.log("XMLHttpRequest approach failed for Binance API:", xhrError);
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
      
      // As a last resort, try directly connecting to the Binance website
      try {
        console.log("Testing connection to Binance website directly...");
        const websiteResponse = await fetch('https://www.binance.com/robots.txt', {
          method: 'HEAD',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          signal: AbortSignal.timeout(10000)
        });
        
        if (websiteResponse.ok) {
          console.log("Binance website is accessible, but API connection failed");
          toast.info("Binance website is accessible, but API connection failed. This suggests a CORS or API restriction issue.");
          // We still consider this a partial success in terms of Binance accessibility
          setConnectionStage(prev => ({ ...prev, binanceApi: 'success' }));
          return true;
        }
      } catch (websiteError) {
        console.warn("Binance website access check failed:", websiteError);
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
      
      // If we're in proxy mode, try disabling it temporarily to see if direct connection works
      if (binanceService.getProxyMode()) {
        try {
          console.log("Testing direct connection by temporarily disabling proxy...");
          // Save current proxy setting
          const currentProxyMode = binanceService.getProxyMode();
          
          // Temporarily disable proxy
          binanceService.setProxyMode(false);
          
          // Try direct connection
          const directTestResult = await binanceService.testConnection();
          
          // Restore original proxy setting
          binanceService.setProxyMode(currentProxyMode);
          
          if (directTestResult) {
            console.log("Direct connection succeeded, consider disabling proxy mode");
            toast.info("Direct connection to Binance API works. Consider disabling proxy mode in settings.");
            setConnectionStage(prev => ({ ...prev, account: 'success' }));
            return true;
          }
        } catch (directTestError) {
          console.warn("Direct connection test failed:", directTestError);
        }
      } 
      // If we're not in proxy mode, try enabling it temporarily
      else {
        try {
          console.log("Testing connection with proxy temporarily enabled...");
          // Save current proxy setting
          const currentProxyMode = binanceService.getProxyMode();
          
          // Temporarily enable proxy
          binanceService.setProxyMode(true);
          
          // Try proxy connection
          const proxyTestResult = await binanceService.testConnection();
          
          // Restore original proxy setting
          binanceService.setProxyMode(currentProxyMode);
          
          if (proxyTestResult) {
            console.log("Proxy connection succeeded, consider enabling proxy mode");
            toast.info("Connection works when using proxy mode. Consider enabling proxy mode in settings.");
            setConnectionStage(prev => ({ ...prev, account: 'success' }));
            return true;
          }
        } catch (proxyTestError) {
          console.warn("Proxy connection test failed:", proxyTestError);
        }
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
