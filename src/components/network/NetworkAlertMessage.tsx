
import React from 'react';
import { AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { NetworkAlertActions } from './NetworkAlertActions';

interface NetworkAlertMessageProps {
  isOnline: boolean;
  isCheckingConnection: boolean;
  onCheckConnection: () => Promise<boolean>;
  onEnableOfflineMode: () => void;
  onDismiss: () => void;
}

export const NetworkAlertMessage: React.FC<NetworkAlertMessageProps> = ({
  isOnline,
  isCheckingConnection,
  onCheckConnection,
  onEnableOfflineMode,
  onDismiss
}) => {
  return (
    <div className="flex items-start">
      {isOnline ? (
        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
      ) : (
        <WifiOff className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
      )}
      <AlertDescription className="flex-1">
        <div className="text-sm flex flex-col space-y-2">
          <span className={isOnline ? "text-yellow-200" : "text-red-200"}>
            {isOnline 
              ? "Can't connect to Binance. Please check your API settings and ensure your API keys are valid and active." 
              : "Network connectivity issue detected. Please check your internet connection and Binance API settings."}
          </span>
          
          <NetworkAlertActions
            isOnline={isOnline}
            isCheckingConnection={isCheckingConnection}
            onCheckConnection={onCheckConnection}
            onEnableOfflineMode={onEnableOfflineMode}
            onDismiss={onDismiss}
          />
        </div>
      </AlertDescription>
    </div>
  );
};
