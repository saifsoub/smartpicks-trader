
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCcw, WifiOff, X, Zap, ShieldAlert } from "lucide-react";

interface NetworkAlertActionsProps {
  isOnline: boolean;
  isCheckingConnection: boolean;
  onCheckConnection: () => Promise<boolean>;
  onEnableOfflineMode: () => void;
  onBypassConnectionChecks?: () => void;
  onDismiss: () => void;
  isConnectionCheckBypassed?: boolean;
}

export const NetworkAlertActions: React.FC<NetworkAlertActionsProps> = ({
  isOnline,
  isCheckingConnection,
  onCheckConnection,
  onEnableOfflineMode,
  onBypassConnectionChecks,
  onDismiss,
  isConnectionCheckBypassed
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {isConnectionCheckBypassed ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="flex-grow bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
          >
            <X className="h-4 w-4 mr-1.5" /> Dismiss
          </Button>
          {onBypassConnectionChecks && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBypassConnectionChecks}
              className="flex-grow bg-blue-900/50 hover:bg-blue-800 text-white border-blue-700"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" /> Disable Bypass
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onCheckConnection}
            disabled={isCheckingConnection}
            className="flex-grow bg-green-900/50 hover:bg-green-800 text-white border-green-700"
          >
            <RefreshCcw className={`h-4 w-4 mr-1.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
            {isCheckingConnection ? 'Checking...' : 'Verify Connection'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onEnableOfflineMode}
            className="flex-grow bg-purple-900/50 hover:bg-purple-800 text-white border-purple-700"
          >
            <WifiOff className="h-4 w-4 mr-1.5" /> Offline Mode
          </Button>
          
          {onBypassConnectionChecks && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBypassConnectionChecks}
              className="flex-grow bg-blue-900/50 hover:bg-blue-800 text-white border-blue-700"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" /> Bypass Checks
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="flex-grow bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
          >
            <X className="h-4 w-4 mr-1.5" /> Dismiss
          </Button>
        </>
      )}
    </div>
  );
};
