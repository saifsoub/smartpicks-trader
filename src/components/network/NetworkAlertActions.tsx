
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff, Settings, Wifi, Wrench, Activity } from "lucide-react";
import binanceService from '@/services/binanceService';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface NetworkAlertActionsProps {
  isOnline: boolean;
  isCheckingConnection: boolean;
  onCheckConnection: () => Promise<boolean>;
  onEnableOfflineMode: () => void;
  onDismiss: () => void;
}

export const NetworkAlertActions: React.FC<NetworkAlertActionsProps> = ({
  isOnline,
  isCheckingConnection,
  onCheckConnection,
  onEnableOfflineMode,
  onDismiss
}) => {
  const navigate = useNavigate();

  const handleCheckConnection = async () => {
    toast.info("Running comprehensive connection test...");
    const success = await onCheckConnection();
    if (success) {
      toast.success("Connection successful! You are now connected to Binance.");
    } else {
      toast.error("Connection issues detected. See detailed status above.");
    }
  };
  
  const goToSettings = () => {
    navigate('/settings');
    toast.info("Please verify your API settings and configuration");
  };
  
  const runConnectionDiagnostics = async () => {
    toast.info("Running advanced connection diagnostics...");
    
    try {
      // Force a browser connectivity check
      const online = navigator.onLine;
      console.log("Browser reports online status:", online);
      
      // Try accessing a reliable third-party API
      try {
        const response = await fetch('https://httpbin.org/status/200', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        console.log("Internet connectivity test result:", response.ok);
      } catch (error) {
        console.error("Internet connectivity test failed:", error);
      }
      
      // Load credentials info
      const hasCredentials = binanceService.hasCredentials();
      const apiKey = binanceService.getApiKey();
      const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set';
      const proxyMode = binanceService.getProxyMode();
      const permissions = binanceService.getApiPermissions();
      
      console.log("API Configuration:", {
        hasCredentials,
        apiKeyMasked: maskedKey,
        proxyEnabled: proxyMode,
        permissions
      });
      
      // Try a direct ping to Binance using a different method
      try {
        const img = new Image();
        let pingSuccess = false;
        
        img.onload = () => {
          console.log("Binance favicon loaded successfully");
          pingSuccess = true;
          toast.info("Binance website is accessible. API connectivity issue may be due to CORS or regional restrictions.");
        };
        
        img.onerror = () => {
          console.log("Failed to load Binance favicon");
          toast.error("Cannot access Binance website. Your network may be blocking Binance services.");
        };
        
        // Add a random parameter to bypass cache
        img.src = `https://www.binance.com/favicon.ico?_=${Date.now()}`;
        
        // Try an alternative method with fetch and CORS mode 'no-cors'
        try {
          const corsResponse = await fetch('https://api.binance.com/api/v3/ping', {
            method: 'GET',
            mode: 'no-cors', // This allows the request without CORS headers
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            signal: AbortSignal.timeout(5000)
          });
          
          console.log("Binance API no-cors request completed:", corsResponse);
          if (!pingSuccess) {
            toast.info("Basic connectivity to Binance API detected, but full API access may be limited.");
          }
        } catch (corsError) {
          console.warn("Binance API no-cors request failed:", corsError);
        }
      } catch (pingError) {
        console.error("Error during Binance ping test:", pingError);
      }
      
      // Display diagnostic info
      toast.info("Check console for detailed connection diagnostics", {
        duration: 5000,
      });
      
      // Make recommendations based on diagnostics
      if (!hasCredentials) {
        toast.error("No API credentials configured. Please add your Binance API keys in settings.");
      } else if (!proxyMode) {
        toast.info("Consider enabling proxy mode in settings to bypass CORS restrictions.");
      }
      
      // Try to reset the connection state
      await binanceService.testConnection();
    } catch (error) {
      console.error("Diagnostics error:", error);
      toast.error("Error running diagnostics");
    }
  };
  
  const tryAlternativeConnection = async () => {
    toast.info("Trying alternative connection methods...");
    
    try {
      // Toggle proxy mode to see if the opposite setting works better
      const currentProxyMode = binanceService.getProxyMode();
      binanceService.setProxyMode(!currentProxyMode);
      
      toast.info(`Switched to ${!currentProxyMode ? 'proxy' : 'direct'} mode for testing`);
      
      // Test the connection with new settings
      const result = await binanceService.testConnection();
      
      if (result) {
        toast.success(`Connection successful using ${!currentProxyMode ? 'proxy' : 'direct'} mode!`);
        return;
      } else {
        // Switch back if it didn't help
        binanceService.setProxyMode(currentProxyMode);
        toast.error("Alternative connection method failed. Reverting to previous settings.");
      }
      
      // If switching proxy mode didn't work, try other approaches
      toast.info("Testing connection with reduced timeout...");
      
      // Try direct access to a different Binance endpoint
      try {
        const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(3000) // shorter timeout
        });
        
        if (exchangeInfoResponse.ok) {
          toast.success("Successfully connected to Binance exchange info!");
          console.log("Exchange info accessible, but account data might still be unavailable");
        }
      } catch (exchangeError) {
        console.warn("Exchange info request failed:", exchangeError);
      }
      
      toast.info("Connection troubleshooting completed. Check console for details.");
    } catch (error) {
      console.error("Alternative connection error:", error);
      toast.error("Error during alternative connection attempt");
    }
  };

  return (
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
            Test Connection
          </>
        )}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="bg-blue-800/30 border-blue-700 text-blue-200 hover:bg-blue-800"
        onClick={goToSettings}
      >
        <Settings className="mr-2 h-4 w-4" />
        API Settings
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="bg-blue-800/30 border-blue-700 text-blue-200 hover:bg-blue-800"
        onClick={runConnectionDiagnostics}
      >
        <Wrench className="mr-2 h-4 w-4" />
        Diagnostics
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="bg-green-800/30 border-green-700 text-green-200 hover:bg-green-800"
        onClick={tryAlternativeConnection}
      >
        <Activity className="mr-2 h-4 w-4" />
        Try Alternatives
      </Button>
      
      {!binanceService.isInOfflineMode() && (
        <Button 
          variant="outline" 
          size="sm"
          className="bg-blue-800/30 border-blue-700 text-blue-200 hover:bg-blue-800"
          onClick={onEnableOfflineMode}
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
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  );
};
