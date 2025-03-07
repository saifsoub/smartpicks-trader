
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NetworkStatusAlert = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
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
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    // If we have connection issues but browser reports online, still show the alert
    // but set a timeout to auto-hide it after 10 seconds if user doesn't dismiss it
    if (isVisible && isOnline) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, isOnline]);
  
  const handleCheckConnection = () => {
    // Test internet connection
    setIsVisible(false);
    
    fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    .then(response => {
      if (response.ok) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
        setIsVisible(true);
      }
    })
    .catch(() => {
      setIsOnline(false);
      setIsVisible(true);
    });
  };
  
  if (!isVisible) return null;
  
  return (
    <Alert className={`${isOnline ? 'bg-yellow-900/30 border-yellow-700' : 'bg-red-900/30 border-red-700'} mb-4`}>
      <div className="flex items-start">
        {isOnline ? (
          <Wifi className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
        )}
        <AlertDescription>
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
