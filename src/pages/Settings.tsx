
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowUpDown, Save, RefreshCw, CheckCircle, AlertCircle, Loader2, Info, Globe, Server, Shield, Home } from "lucide-react";
import { toast } from "sonner";
import binanceService from "@/services/binanceService";
import notificationService from "@/services/notificationService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [connectedMessage, setConnectedMessage] = useState("");
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [useProxyMode, setUseProxyMode] = useState(binanceService.getProxyMode());
  
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [tradeNotifications, setTradeNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [priceAlertThreshold, setPriceAlertThreshold] = useState(5);
  const [portfolioVerified, setPortfolioVerified] = useState(false);
  const [portfolioData, setPortfolioData] = useState<{asset: string, value: number}[]>([]);
  
  useEffect(() => {
    loadSavedSettings();
    checkConnection();
  }, []);
  
  const addStatusMessage = (message: string) => {
    setStatusMessages(prev => [...prev, message]);
  };
  
  const loadSavedSettings = () => {
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      setApiKey(credentials.apiKey || "");
      if (credentials.secretKey) {
        setSecretKey("••••••••••••••••••••••••••••••••");
      }
    }
    
    setUseProxyMode(binanceService.getProxyMode());
    
    const settings = notificationService.getSettings();
    setTelegramEnabled(settings.telegramEnabled);
    setTelegramChatId(settings.telegramChatId);
    setTradeNotifications(settings.tradeNotificationsEnabled);
    setDailySummary(settings.dailySummaryEnabled);
    setMarketAlerts(settings.marketAlertEnabled);
    setPriceAlertThreshold(settings.priceAlertThreshold);
  };
  
  const checkConnection = async () => {
    if (!binanceService.hasCredentials()) {
      setConnectionStatus('untested');
      setConnectedMessage("No API credentials configured");
      setPortfolioVerified(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setVerificationInProgress(true);
      addStatusMessage("Testing connection to Binance...");
      
      const connectionTest = await binanceService.testConnection();
      if (connectionTest) {
        setConnectionStatus('success');
        setConnectedMessage(`Connected to Binance API (${useProxyMode ? 'Proxy Mode' : 'Direct API Mode'})`);
        addStatusMessage("✅ Successfully connected to Binance API");
        
        // Now verify we can access portfolio data
        try {
          addStatusMessage("Attempting to fetch account data...");
          const accountData = await binanceService.getAccountInfo();
          if (accountData && accountData.balances && accountData.balances.length > 0) {
            setPortfolioVerified(true);
            
            // Extract and display portfolio data
            const nonZeroBalances = accountData.balances.filter(
              balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
            );
            
            if (nonZeroBalances.length > 0) {
              addStatusMessage(`✅ Found ${nonZeroBalances.length} assets in your portfolio`);
              
              // Get current prices to calculate USD values
              const prices = await binanceService.getPrices();
              
              // Calculate USD values and store for display
              const portfolioWithValues = nonZeroBalances.map(balance => {
                const total = parseFloat(balance.free) + parseFloat(balance.locked);
                let usdValue = 0;
                
                if (balance.asset === 'USDT') {
                  usdValue = total;
                } else {
                  const price = prices[`${balance.asset}USDT`];
                  if (price) {
                    usdValue = total * parseFloat(price);
                  }
                }
                
                return {
                  asset: balance.asset,
                  value: usdValue
                };
              });
              
              setPortfolioData(portfolioWithValues);
            } else {
              addStatusMessage("⚠️ No assets with non-zero balances found");
            }
            
            toast.success("Successfully verified account data from Binance");
          } else {
            setPortfolioVerified(false);
            addStatusMessage("⚠️ Connected to Binance, but couldn't verify portfolio data");
            toast.warning("Connected to Binance, but couldn't verify portfolio data");
          }
        } catch (portfolioError) {
          console.error("Error verifying portfolio:", portfolioError);
          setPortfolioVerified(false);
          addStatusMessage("❌ Error fetching portfolio data");
          toast.error("Connected to Binance API, but couldn't fetch portfolio data");
        }
      } else {
        setConnectionStatus('error');
        setConnectedMessage("Connection failed. Please check your API keys.");
        addStatusMessage("❌ Connection to Binance API failed");
        setPortfolioVerified(false);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionStatus('error');
      if (error instanceof Error) {
        setConnectedMessage(`Connection error: ${error.message}`);
        addStatusMessage(`❌ Connection error: ${error.message}`);
      } else {
        setConnectedMessage("Connection error. Please check your API keys.");
        addStatusMessage("❌ Connection error. Please check your API keys.");
      }
      setPortfolioVerified(false);
    } finally {
      setIsLoading(false);
      setVerificationInProgress(false);
    }
  };
  
  const handleToggleProxyMode = (checked: boolean) => {
    setUseProxyMode(checked);
    const success = binanceService.setProxyMode(checked);
    if (success) {
      toast.success(`API connection mode set to: ${checked ? 'Proxy Mode' : 'Direct API Mode'}`);
      // Retest connection with new mode
      checkConnection();
    }
  };
  
  const handleSaveApiKeys = async () => {
    if (!apiKey) {
      toast.error("API Key is required");
      return;
    }
    if (!secretKey) {
      toast.error("Secret Key is required");
      return;
    }
    
    setIsLoading(true);
    setConnectionStatus('untested');
    setPortfolioVerified(false);
    setStatusMessages([]);
    addStatusMessage("Saving API keys...");
    
    try {
      if (apiKey.length < 20) {
        toast.error("API Key appears to be invalid (too short)");
        setConnectionStatus('error');
        setConnectedMessage("API Key format appears invalid");
        addStatusMessage("❌ API Key appears to be invalid (too short)");
        setIsLoading(false);
        return;
      }
      
      // First save the credentials
      const success = binanceService.saveCredentials({
        apiKey,
        secretKey: secretKey === "••••••••••••••••••••••••••••••••" 
          ? JSON.parse(localStorage.getItem('binanceCredentials') || '{}').secretKey
          : secretKey
      });
      
      if (success) {
        toast.success("API keys saved successfully");
        addStatusMessage("✅ API keys saved successfully");
        
        // Now test connection and verify portfolio access
        setVerificationInProgress(true);
        try {
          addStatusMessage("Testing connection to Binance...");
          const connectionTest = await binanceService.testConnection();
          if (connectionTest) {
            setConnectionStatus('success');
            setConnectedMessage(`Connected to Binance API (${useProxyMode ? 'Proxy Mode' : 'Direct API Mode'})`);
            addStatusMessage("✅ Successfully connected to Binance API");
            
            // Try to access actual account data for full verification
            try {
              addStatusMessage("Fetching account data...");
              const accountData = await binanceService.getAccountInfo();
              if (accountData && accountData.balances) {
                // Consider API connected even if balances are placeholders
                toast.success("Successfully connected to Binance API");
                setConnectionStatus('success');
                
                // Check if we got real portfolio data or just placeholder data
                const hasRealBalances = accountData.balances.some(
                  balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
                );
                
                if (hasRealBalances) {
                  setPortfolioVerified(true);
                  toast.success("Full portfolio access verified");
                  addStatusMessage("✅ Full portfolio access verified");
                  
                  // Extract and display portfolio data
                  const nonZeroBalances = accountData.balances.filter(
                    balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
                  );
                  
                  if (nonZeroBalances.length > 0) {
                    addStatusMessage(`Found ${nonZeroBalances.length} assets in your portfolio`);
                    
                    // Get current prices to calculate USD values
                    const prices = await binanceService.getPrices();
                    
                    // Calculate USD values and store for display
                    const portfolioWithValues = nonZeroBalances.map(balance => {
                      const total = parseFloat(balance.free) + parseFloat(balance.locked);
                      let usdValue = 0;
                      
                      if (balance.asset === 'USDT') {
                        usdValue = total;
                      } else {
                        const price = prices[`${balance.asset}USDT`];
                        if (price) {
                          usdValue = total * parseFloat(price);
                        }
                      }
                      
                      return {
                        asset: balance.asset,
                        value: usdValue
                      };
                    });
                    
                    setPortfolioData(portfolioWithValues);
                  }
                  
                } else {
                  setPortfolioVerified(false);
                  addStatusMessage("⚠️ Connected to Binance API, but limited portfolio access. Try enabling proxy mode.");
                  toast.warning("Connected to Binance API, but limited portfolio access. Try enabling proxy mode.");
                }
                
                window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
              } else {
                addStatusMessage("⚠️ Connected to Binance API, but couldn't verify portfolio data");
                toast.warning("Connected to Binance API, but couldn't verify portfolio data");
                setPortfolioVerified(false);
                window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
              }
            } catch (portfolioError) {
              console.error("Portfolio verification error:", portfolioError);
              addStatusMessage("⚠️ Connected to Binance API, but couldn't verify portfolio access");
              toast.warning("Connected to Binance API, but couldn't verify portfolio access");
              setPortfolioVerified(false);
              window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
            }
          } else {
            addStatusMessage("❌ Connection to Binance API failed");
            toast.error("Connection to Binance API failed");
            setConnectionStatus('error');
            setConnectedMessage("Failed to connect to Binance API");
            setPortfolioVerified(false);
          }
        } catch (connectionError) {
          console.error("Connection test error:", connectionError);
          addStatusMessage("❌ Failed to verify Binance API connection");
          toast.error("Failed to verify Binance API connection");
          setConnectionStatus('error');
          setConnectedMessage("Connection verification failed");
          setPortfolioVerified(false);
        }
      } else {
        addStatusMessage("❌ Failed to save API keys");
        toast.error("Failed to save API keys");
        setConnectionStatus('error');
        setConnectedMessage("Failed to save API keys");
        setPortfolioVerified(false);
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      let errorMessage = "An error occurred while saving API keys";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      addStatusMessage(`❌ Error: ${errorMessage}`);
      toast.error(errorMessage);
      setConnectionStatus('error');
      setConnectedMessage(errorMessage);
      setPortfolioVerified(false);
    } finally {
      setIsLoading(false);
      setVerificationInProgress(false);
    }
  };
  
  const handleConnectAndGotoDashboard = async () => {
    if (!apiKey || !secretKey) {
      toast.error("API Key and Secret Key are required");
      return;
    }
    
    setIsLoading(true);
    setStatusMessages([]);
    addStatusMessage("Connecting to Binance...");
    
    try {
      // Save credentials first
      await handleSaveApiKeys();
      
      // Wait a moment for state to update
      setTimeout(() => {
        // If connection was successful, go to dashboard
        if (connectionStatus === 'success') {
          addStatusMessage("✅ Connection successful. Going to dashboard...");
          toast.success("Successfully connected to Binance. Redirecting to dashboard...");
          setTimeout(() => navigate('/'), 1500);
        } else {
          addStatusMessage("❌ Connection failed. Please check settings before continuing.");
          toast.error("Connection failed. Please check your API keys and settings.");
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error connecting:", error);
      addStatusMessage("❌ Connection error. Please try again.");
      toast.error("Connection error. Please try again.");
      setIsLoading(false);
    }
  };
  
  const handleSaveNotificationSettings = () => {
    const settings = {
      telegramEnabled,
      telegramChatId,
      tradeNotificationsEnabled: tradeNotifications,
      dailySummaryEnabled: dailySummary,
      marketAlertEnabled: marketAlerts,
      priceAlertThreshold: priceAlertThreshold
    };
    
    const success = notificationService.saveSettings(settings);
    if (success) {
      toast.success("Notification settings saved successfully");
    } else {
      toast.error("Failed to save notification settings");
    }
  };
  
  const handleTestTelegramConnection = async () => {
    if (!telegramEnabled || !telegramChatId) {
      toast.error("Please enable Telegram notifications and enter a username");
      return;
    }
    
    setIsTesting(true);
    
    const success = notificationService.saveSettings({
      telegramEnabled,
      telegramChatId,
      tradeNotificationsEnabled: tradeNotifications,
      dailySummaryEnabled: dailySummary,
      marketAlertEnabled: marketAlerts,
      priceAlertThreshold: priceAlertThreshold
    });
    
    if (success) {
      await notificationService.testTelegramConnection();
    } else {
      toast.error("Failed to save notification settings");
    }
    
    setIsTesting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">TradingBot</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="text-slate-200 border-slate-700 hover:bg-slate-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold text-white">Settings</h1>

        {(connectionStatus !== 'untested' || binanceService.hasCredentials()) && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            connectionStatus === 'success' 
              ? 'bg-green-900/20 border border-green-800' 
              : connectionStatus === 'error'
                ? 'bg-red-900/20 border border-red-800'
                : 'bg-blue-900/20 border border-blue-800'
          }`}>
            <div className="flex items-center">
              {connectionStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : connectionStatus === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-400 mr-2 animate-spin" />
              )}
              <span className={`font-medium ${
                connectionStatus === 'success' 
                  ? 'text-green-400' 
                  : connectionStatus === 'error'
                    ? 'text-red-400'
                    : 'text-blue-400'
              }`}>
                {connectionStatus === 'success' 
                  ? "Connected"
                  : connectionStatus === 'error'
                    ? "Connection Failed"
                    : "Checking Connection..."}
              </span>
              
              {connectionStatus === 'success' && portfolioVerified && (
                <span className="ml-2 bg-green-900/30 text-green-300 text-xs px-2 py-0.5 rounded-full flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Portfolio Verified
                </span>
              )}
            </div>
            <div className="text-slate-200">
              {connectedMessage}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {statusMessages.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-800 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Connection Status</h3>
            <div className="space-y-1 text-sm">
              {statusMessages.map((message, index) => (
                <div key={index} className="text-slate-200">{message}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Portfolio Summary if verified */}
        {portfolioVerified && portfolioData.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-medium text-green-400 mb-2">Verified Portfolio Data</h3>
            <div className="space-y-1 text-sm">
              {portfolioData.map((asset, index) => (
                <div key={index} className="flex justify-between text-slate-200">
                  <span>{asset.asset}</span>
                  <span>${asset.value.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between font-medium">
                <span>Total Portfolio Value</span>
                <span>${portfolioData.reduce((sum, asset) => sum + asset.value, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Binance API Configuration</CardTitle>
              <CardDescription className="text-slate-300">Connect your Binance account to enable trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm text-slate-400">API Key</Label>
                <Input 
                  id="apiKey" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Binance API key" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-300">
                  Create API keys in your Binance account with trading permissions
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-sm text-slate-400">Secret Key</Label>
                <Input 
                  id="secretKey" 
                  type="password" 
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your Binance secret key" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-300">
                  Never share your secret key with anyone
                </p>
              </div>
              
              <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md border border-slate-700">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300 flex items-center">
                    {useProxyMode ? 
                      <><Server className="h-4 w-4 mr-1.5 text-blue-400" /> Use API Proxy</> : 
                      <><Globe className="h-4 w-4 mr-1.5 text-green-400" /> Direct API Mode</>
                    }
                  </Label>
                  <p className="text-xs text-slate-400">
                    {useProxyMode ? 
                      "Proxy mode avoids CORS issues by using a secure server relay" : 
                      "Direct connection to Binance API (may have CORS issues)"
                    }
                  </p>
                </div>
                <Switch 
                  checked={useProxyMode}
                  onCheckedChange={handleToggleProxyMode}
                />
              </div>
              
              {!useProxyMode && (
                <div className="bg-yellow-900/20 p-3 rounded-md border border-yellow-800 my-2">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-300 mr-2 mt-0.5" />
                    <p className="text-sm text-yellow-200">
                      Due to browser security restrictions (CORS), direct API connection testing may not work. Use Proxy Mode for reliable connectivity.
                    </p>
                  </div>
                </div>
              )}
              
              {/* New Connect & Go to Dashboard button */}
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                onClick={handleConnectAndGotoDashboard}
                disabled={isLoading || verificationInProgress}
              >
                {isLoading || verificationInProgress ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {verificationInProgress ? "Verifying Connection..." : "Connecting..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Connect & Go to Dashboard
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={handleSaveApiKeys}
                  disabled={isLoading || verificationInProgress}
                >
                  {isLoading || verificationInProgress ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {verificationInProgress ? "Verifying..." : "Testing..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Verify
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-200"
                  onClick={checkConnection}
                  disabled={isLoading || verificationInProgress || !binanceService.hasCredentials()}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || verificationInProgress ? 'animate-spin' : ''}`} />
                  Test Connection
                </Button>
              </div>
              
              <div className="mt-4 pt-2 border-t border-slate-800 text-center">
                <p className="text-sm font-medium text-green-300">
                  🔴 LIVE TRADING MODE - Real orders will be executed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription className="text-slate-300">Configure how you receive trading alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Telegram Notifications</Label>
                  <p className="text-xs text-slate-300">Receive alerts via Telegram</p>
                </div>
                <Switch 
                  checked={telegramEnabled}
                  onCheckedChange={setTelegramEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegramId" className="text-slate-200">Telegram Username</Label>
                <Input 
                  id="telegramId" 
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Enter your Telegram username (e.g., johndoe)" 
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!telegramEnabled}
                />
                <p className="text-xs text-slate-300">
                  Simply enter your Telegram username without the @ symbol
                </p>
              </div>
              
              <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800 my-2">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-300 mr-2 mt-0.5" />
                  <p className="text-sm text-blue-200">
                    To receive notifications, you need to start a conversation with our Telegram bot: <a href="https://t.me/TradingBotAI_bot" target="_blank" rel="noopener noreferrer" className="underline">@TradingBotAI_bot</a>
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
                onClick={handleTestTelegramConnection}
                disabled={!telegramEnabled || !telegramChatId || isTesting}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Test Message...
                  </>
                ) : (
                  "Test Telegram Connection"
                )}
              </Button>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Trade Notifications</Label>
                  <p className="text-xs text-slate-300">Get notified for each trade</p>
                </div>
                <Switch 
                  checked={tradeNotifications}
                  onCheckedChange={setTradeNotifications}
                  disabled={!telegramEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Daily Summary</Label>
                  <p className="text-xs text-slate-300">Receive daily performance reports</p>
                </div>
                <Switch 
                  checked={dailySummary}
                  onCheckedChange={setDailySummary}
                  disabled={!telegramEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Market Alerts</Label>
                  <p className="text-xs text-slate-300">Receive market analysis and price alerts</p>
                </div>
                <Switch 
                  checked={marketAlerts}
                  onCheckedChange={setMarketAlerts}
                  disabled={!telegramEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceThreshold" className="text-slate-200">Price Alert Threshold (%)</Label>
                <Input 
                  id="priceThreshold" 
                  type="number" 
                  value={priceAlertThreshold}
                  onChange={(e) => setPriceAlertThreshold(Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!telegramEnabled || !marketAlerts}
                  min="1"
                  max="20"
                />
                <p className="text-xs text-slate-300">
                  Minimum price change (%) to trigger an alert
                </p>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSaveNotificationSettings}
              >
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
