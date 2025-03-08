
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff, Settings, Wifi } from "lucide-react";
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
      toast.success("Your internet connection is working");
    } else {
      toast.error("Internet connectivity issues detected");
    }
  };
  
  const goToSettings = () => {
    navigate('/settings');
    onDismiss();
    toast.info("Please verify your API settings in the configuration section");
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
            Check Connection
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
