
import { useState, useEffect, useCallback } from 'react';
import binanceService from '@/services/binanceService';
import { StorageManager } from '@/services/binance/storageManager';
import { toast } from 'sonner';

export type ConnectionStage = {
  internet: 'unknown' | 'checking' | 'success' | 'failed';
  binanceApi: 'unknown' | 'checking' | 'success' | 'failed';
  account: 'unknown' | 'checking' | 'success' | 'failed';
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [connectionStage, setConnectionStage] = useState<ConnectionStage>({
    internet: 'unknown',
    binanceApi: 'unknown',
    account: 'unknown'
  });

  const updateOnlineStatus = useCallback(() => {
    const status = navigator.onLine;
    setIsOnline(status);
    
    if (!status) {
      setConnectionStage(prev => ({
        ...prev,
        internet: 'failed'
      }));
      setIsVisible(true);
    }
  }, []);

  const checkInternetConnectivity = async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({
        ...prev,
        internet: 'checking'
      }));
      
      // First try fetch to a reliable source
      const result = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      
      if (result.ok) {
        setConnectionStage(prev => ({
          ...prev,
          internet: 'success'
        }));
        return true;
      }
      
      setConnectionStage(prev => ({
        ...prev,
        internet: 'failed'
      }));
      return false;
    } catch (error) {
      console.error("Internet connectivity check failed:", error);
      setConnectionStage(prev => ({
        ...prev,
        internet: 'failed'
      }));
      return false;
    }
  };

  const checkBinanceApi = async (): Promise<boolean> => {
    try {
      setConnectionStage(prev => ({
        ...prev,
        binanceApi: 'checking'
      }));
      
      // Simple ping to Binance API
      const result = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (result.ok) {
        setConnectionStage(prev => ({
          ...prev,
          binanceApi: 'success'
        }));
        return true;
      }
      
      setConnectionStage(prev => ({
        ...prev,
        binanceApi: 'failed'
      }));
      return false;
    } catch (error) {
      console.error("Binance API check failed:", error);
      setConnectionStage(prev => ({
        ...prev,
        binanceApi: 'failed'
      }));
      return false;
    }
  };

  const checkAccountConnection = async (): Promise<boolean> => {
    if (!binanceService.hasCredentials()) {
      console.log("No credentials set, skipping account check");
      return false;
    }
    
    try {
      setConnectionStage(prev => ({
        ...prev,
        account: 'checking'
      }));
      
      const result = await binanceService.testConnection();
      
      if (result) {
        setConnectionStage(prev => ({
          ...prev,
          account: 'success'
        }));
        return true;
      }
      
      setConnectionStage(prev => ({
        ...prev,
        account: 'failed'
      }));
      return false;
    } catch (error) {
      console.error("Account connection test failed:", error);
      setConnectionStage(prev => ({
        ...prev,
        account: 'failed'
      }));
      return false;
    }
  };

  const handleCheckConnection = async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    
    try {
      // Run through each check in sequence
      const internetCheck = await checkInternetConnectivity();
      if (!internetCheck) {
        setIsCheckingConnection(false);
        return false;
      }
      
      const apiCheck = await checkBinanceApi();
      if (!apiCheck) {
        setIsCheckingConnection(false);
        return false;
      }
      
      // Only check account if we have credentials
      if (binanceService.hasCredentials()) {
        const accountCheck = await checkAccountConnection();
        setIsCheckingConnection(false);
        return accountCheck;
      }
      
      setIsCheckingConnection(false);
      return true;
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsCheckingConnection(false);
      return false;
    }
  };

  const handleBypassConnectionChecks = () => {
    const currentlyBypassed = StorageManager.shouldBypassConnectionChecks();
    StorageManager.bypassConnectionChecks(!currentlyBypassed);
    
    if (!currentlyBypassed) {
      toast.success("Connection checks bypassed. You can continue using the app regardless of connectivity.");
    } else {
      toast.info("Connection check bypass disabled. Normal connectivity checks restored.");
      // Run a quick connection check
      handleCheckConnection();
    }
  };

  const handleForceDirectApi = () => {
    const currentlyForced = StorageManager.shouldForceDirectApi();
    StorageManager.forceDirectApi(!currentlyForced);
    
    if (!currentlyForced) {
      toast.success("Direct API mode enabled. Bypassing all proxies and connecting directly to Binance API.");
      
      // When enabling direct API, also bypass connection checks
      if (!StorageManager.shouldBypassConnectionChecks()) {
        StorageManager.bypassConnectionChecks(true);
      }
      
      // Run a connection check to update status
      handleCheckConnection();
    } else {
      toast.info("Direct API mode disabled. Reverting to proxy mode.");
      // Run a quick connection check
      handleCheckConnection();
    }
  };

  const handleEnableOfflineMode = () => {
    binanceService.setOfflineMode(true);
    setIsVisible(false);
  };

  // Handle online/offline events
  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  // Do an initial connection check once
  useEffect(() => {
    const runInitialCheck = async () => {
      // Skip connection check if already initialized
      if (initialCheckDone) return;
      
      // Check if bypassed
      if (StorageManager.shouldBypassConnectionChecks()) {
        setInitialCheckDone(true);
        // Don't show alert if bypassed
        return;
      }
      
      // Only check connection if we have credentials
      if (binanceService.hasCredentials()) {
        const status = binanceService.getConnectionStatus();
        
        if (status === 'unknown') {
          const result = await handleCheckConnection();
          if (!result) {
            setIsVisible(true);
          }
        } else if (status === 'disconnected') {
          setIsVisible(true);
        }
      }
      
      setInitialCheckDone(true);
    };
    
    runInitialCheck();
  }, [initialCheckDone]);

  return {
    isOnline,
    isVisible,
    setIsVisible,
    isCheckingConnection,
    initialCheckDone,
    connectionStage,
    handleCheckConnection,
    handleEnableOfflineMode,
    handleBypassConnectionChecks,
    handleForceDirectApi
  };
};
