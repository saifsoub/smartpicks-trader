
import React from 'react';
import { AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle, Globe, Server, Database } from "lucide-react";
import { NetworkAlertActions } from './NetworkAlertActions';

interface NetworkAlertMessageProps {
  isOnline: boolean;
  isCheckingConnection: boolean;
  connectionStage: ConnectionStage;
  onCheckConnection: () => Promise<boolean>;
  onEnableOfflineMode: () => void;
  onDismiss: () => void;
}

export type ConnectionStage = {
  internet: 'unknown' | 'checking' | 'success' | 'failed';
  binanceApi: 'unknown' | 'checking' | 'success' | 'failed';
  account: 'unknown' | 'checking' | 'success' | 'failed';
};

export const NetworkAlertMessage: React.FC<NetworkAlertMessageProps> = ({
  isOnline,
  isCheckingConnection,
  connectionStage,
  onCheckConnection,
  onEnableOfflineMode,
  onDismiss
}) => {
  const getStageIcon = (stage: 'unknown' | 'checking' | 'success' | 'failed') => {
    switch (stage) {
      case 'success':
        return <span className="text-green-500">✓</span>;
      case 'failed':
        return <span className="text-red-500">✗</span>;
      case 'checking':
        return <span className="text-yellow-500 animate-pulse">…</span>;
      default:
        return <span className="text-gray-500">-</span>;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-start">
        {isOnline ? (
          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
        )}
        <AlertDescription className="flex-1">
          <div className="text-sm">
            <span className={isOnline ? "text-yellow-200" : "text-red-200"}>
              {isOnline 
                ? "Can't connect to Binance. Please check your API settings and ensure your API keys are valid and active." 
                : "Network connectivity issue detected. Please check your internet connection and Binance API settings."}
            </span>
          </div>
        </AlertDescription>
      </div>

      <div className="bg-gray-800/50 rounded-md p-3 text-sm">
        <h4 className="font-semibold text-gray-300 mb-2">Connection Status:</h4>
        <ul className="space-y-2">
          <li className="flex items-center">
            <Globe className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-gray-300 w-28">Internet:</span> 
            <span className="flex items-center">
              {getStageIcon(connectionStage.internet)}
              <span className="ml-2">
                {connectionStage.internet === 'checking' ? 'Checking...' : 
                 connectionStage.internet === 'success' ? 'Connected' : 
                 connectionStage.internet === 'failed' ? 'Disconnected' : 'Unknown'}
              </span>
            </span>
          </li>
          <li className="flex items-center">
            <Server className="h-4 w-4 mr-2 text-purple-400" />
            <span className="text-gray-300 w-28">Binance API:</span>
            <span className="flex items-center">
              {getStageIcon(connectionStage.binanceApi)}
              <span className="ml-2">
                {connectionStage.binanceApi === 'checking' ? 'Checking...' : 
                 connectionStage.binanceApi === 'success' ? 'Reachable' : 
                 connectionStage.binanceApi === 'failed' ? 'Unreachable' : 'Unknown'}
              </span>
            </span>
          </li>
          <li className="flex items-center">
            <Database className="h-4 w-4 mr-2 text-green-400" />
            <span className="text-gray-300 w-28">Account Access:</span>
            <span className="flex items-center">
              {getStageIcon(connectionStage.account)}
              <span className="ml-2">
                {connectionStage.account === 'checking' ? 'Authenticating...' : 
                 connectionStage.account === 'success' ? 'Authenticated' : 
                 connectionStage.account === 'failed' ? 'Failed' : 'Not Verified'}
              </span>
            </span>
          </li>
        </ul>
      </div>
      
      <NetworkAlertActions
        isOnline={isOnline}
        isCheckingConnection={isCheckingConnection}
        onCheckConnection={onCheckConnection}
        onEnableOfflineMode={onEnableOfflineMode}
        onDismiss={onDismiss}
      />
    </div>
  );
};
