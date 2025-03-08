
import React from 'react';
import { AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle, Globe, Server, Database, ShieldAlert, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
        return <CheckCircle className="text-green-500 h-4 w-4" />;
      case 'failed':
        return <XCircle className="text-red-500 h-4 w-4" />;
      case 'checking':
        return <AlertCircle className="text-yellow-500 h-4 w-4 animate-pulse" />;
      default:
        return <AlertCircle className="text-gray-500 h-4 w-4" />;
    }
  };

  // Determine which failure stage to highlight in the message
  const getMainIssueMessage = () => {
    if (connectionStage.internet === 'failed') {
      return "Internet connectivity issue detected. Please check your network connection.";
    } else if (connectionStage.binanceApi === 'failed') {
      return "Can't reach Binance API servers. The service might be temporarily unavailable or blocked in your region.";
    } else if (connectionStage.account === 'failed') {
      return "Can't authenticate with your Binance account. Please verify your API keys and permissions.";
    } else if (isOnline) {
      return "Limited connection to Binance. Some features may not work correctly.";
    } else {
      return "Network connectivity issue detected. Please check your internet connection and Binance API settings.";
    }
  };

  // Get recommendations based on connection stage
  const getRecommendations = () => {
    if (connectionStage.internet === 'failed') {
      return (
        <>
          <li>Check your WiFi or ethernet connection</li>
          <li>Restart your router or modem</li>
          <li>Try using a different network if available</li>
        </>
      );
    } else if (connectionStage.binanceApi === 'failed') {
      return (
        <>
          <li>Try enabling proxy mode in settings</li>
          <li>Check if Binance is accessible in your region</li>
          <li>Consider using a VPN service if Binance is blocked</li>
        </>
      );
    } else if (connectionStage.account === 'failed') {
      return (
        <>
          <li>Verify your API keys are correct in settings</li>
          <li>Ensure your API keys have read permissions</li>
          <li>Check if your API keys are still active on Binance</li>
        </>
      );
    }
    return null;
  };

  const recommendations = getRecommendations();

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
              {getMainIssueMessage()}
            </span>
          </div>
        </AlertDescription>
      </div>

      <div className="bg-gray-800/50 rounded-md p-3 text-sm">
        <h4 className="font-semibold text-gray-300 mb-2">Connection Status:</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Globe className="h-4 w-4 mr-1 text-blue-400" />
            <span className="text-gray-300 w-28">Internet:</span> 
            <div className="flex items-center gap-2">
              {getStageIcon(connectionStage.internet)}
              <span className={
                connectionStage.internet === 'checking' ? 'text-yellow-300 animate-pulse' : 
                connectionStage.internet === 'success' ? 'text-green-300' : 
                connectionStage.internet === 'failed' ? 'text-red-300' : 'text-gray-300'
              }>
                {connectionStage.internet === 'checking' ? 'Checking...' : 
                 connectionStage.internet === 'success' ? 'Connected' : 
                 connectionStage.internet === 'failed' ? 'Disconnected' : 'Unknown'}
              </span>
            </div>
          </li>
          <li className="flex items-center gap-2">
            <Server className="h-4 w-4 mr-1 text-purple-400" />
            <span className="text-gray-300 w-28">Binance API:</span>
            <div className="flex items-center gap-2">
              {getStageIcon(connectionStage.binanceApi)}
              <span className={
                connectionStage.binanceApi === 'checking' ? 'text-yellow-300 animate-pulse' : 
                connectionStage.binanceApi === 'success' ? 'text-green-300' : 
                connectionStage.binanceApi === 'failed' ? 'text-red-300' : 'text-gray-300'
              }>
                {connectionStage.binanceApi === 'checking' ? 'Checking...' : 
                 connectionStage.binanceApi === 'success' ? 'Reachable' : 
                 connectionStage.binanceApi === 'failed' ? 'Unreachable' : 'Unknown'}
              </span>
            </div>
          </li>
          <li className="flex items-center gap-2">
            <Database className="h-4 w-4 mr-1 text-green-400" />
            <span className="text-gray-300 w-28">Account Access:</span>
            <div className="flex items-center gap-2">
              {getStageIcon(connectionStage.account)}
              <span className={
                connectionStage.account === 'checking' ? 'text-yellow-300 animate-pulse' : 
                connectionStage.account === 'success' ? 'text-green-300' : 
                connectionStage.account === 'failed' ? 'text-red-300' : 'text-gray-300'
              }>
                {connectionStage.account === 'checking' ? 'Authenticating...' : 
                 connectionStage.account === 'success' ? 'Authenticated' : 
                 connectionStage.account === 'failed' ? 'Failed' : 'Not Verified'}
              </span>
            </div>
          </li>
        </ul>
        
        {recommendations && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h5 className="font-medium text-gray-300 mb-1">Recommendations:</h5>
            <ul className="text-xs text-gray-300 space-y-1 list-disc pl-5">
              {recommendations}
            </ul>
          </div>
        )}
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
