
import React from 'react';
import { AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";
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
