
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff, Settings, Wifi, Wrench, ActivityLog } from "lucide-react";
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
    const success = await onCheckConnection();
    if (success) {
      toast.success("Connection successful! You are now connected to Binance.");
    } else {
      toast.error("Connection issues detected. See detailed status above.");
    }
  };
  
  const goToSettings = () => {
    navigate('/settings');
    onDismiss();
    toast.info("Please verify your API settings");
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
    } catch (error) {
      console.error("Diagnostics error:", error);
      toast.error("Error running diagnostics");
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
