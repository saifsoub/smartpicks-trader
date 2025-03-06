
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowUpDown, Save, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import binanceService from "@/services/binanceService";
import notificationService from "@/services/notificationService";

const Settings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [connectedMessage, setConnectedMessage] = useState("");
  
  // Binance API settings
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  
  // Notification settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [tradeNotifications, setTradeNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  
  // Load saved values on component mount and check connection
  useEffect(() => {
    loadSavedSettings();
    checkConnection();
  }, []);
  
  const loadSavedSettings = () => {
    // Load Binance credentials if available
    const savedCredentials = localStorage.getItem('binanceCredentials');
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      setApiKey(credentials.apiKey || "");
      // Don't show the actual secret key for security
      if (credentials.secretKey) {
        setSecretKey("••••••••••••••••••••••••••••••••");
      }
    }
    
    // Load notification settings
    const settings = notificationService.getSettings();
    setTelegramEnabled(settings.telegramEnabled);
    setTelegramChatId(settings.telegramChatId);
    setTradeNotifications(settings.tradeNotificationsEnabled);
    setDailySummary(settings.dailySummaryEnabled);
  };
  
  // Check connection status immediately on page load
  const checkConnection = async () => {
    if (!binanceService.hasCredentials()) {
      setConnectionStatus('untested');
      setConnectedMessage("No API credentials configured");
      return;
    }
    
    try {
      setIsLoading(true);
      const connectionTest = await binanceService.testConnection();
      if (connectionTest) {
        setConnectionStatus('success');
        setConnectedMessage(binanceService.isInTestMode() 
          ? "Connected to Binance API (Test Mode)" 
          : "Connected to Binance API (Live Mode)");
      } else {
        setConnectionStatus('error');
        setConnectedMessage("Connection failed. Please check your API keys.");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionStatus('error');
      setConnectedMessage("Connection error. Please check your API keys.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save Binance API credentials
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
    
    try {
      // Save credentials
      const success = binanceService.saveCredentials({
        apiKey,
        secretKey: secretKey === "••••••••••••••••••••••••••••••••" 
          ? JSON.parse(localStorage.getItem('binanceCredentials') || '{}').secretKey
          : secretKey
      });
      
      if (success) {
        toast.success("API keys saved successfully");
        
        // Test connection
        const connectionTest = await binanceService.testConnection();
        if (connectionTest) {
          toast.success("Connection to Binance API successful");
          setConnectionStatus('success');
          setConnectedMessage(binanceService.isInTestMode() 
            ? "Connected to Binance API (Test Mode)" 
            : "Connected to Binance API (Live Mode)");
          
          // Force refresh binance service state by dispatching a global event
          window.dispatchEvent(new CustomEvent('binance-credentials-updated'));
        } else {
          toast.error("Connection test failed. Please check your API keys.");
          setConnectionStatus('error');
          setConnectedMessage("Connection failed. Please check your API keys.");
        }
      } else {
        toast.error("Failed to save API keys");
        setConnectionStatus('error');
        setConnectedMessage("Failed to save API keys");
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error("An error occurred while saving API keys");
      setConnectionStatus('error');
      setConnectedMessage("Connection error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save notification settings
  const handleSaveNotificationSettings = () => {
    const settings = {
      telegramEnabled,
      telegramChatId,
      tradeNotificationsEnabled: tradeNotifications,
      dailySummaryEnabled: dailySummary
    };
    
    const success = notificationService.saveSettings(settings);
    if (success) {
      toast.success("Notification settings saved successfully");
    } else {
      toast.error("Failed to save notification settings");
    }
  };
  
  // Test Telegram connection
  const handleTestTelegramConnection = async () => {
    if (!telegramEnabled || !telegramChatId) {
      toast.error("Please enable Telegram notifications and enter a chat ID");
      return;
    }
    
    setIsTesting(true);
    
    // First save the current settings
    const success = notificationService.saveSettings({
      telegramEnabled,
      telegramChatId,
      tradeNotificationsEnabled: tradeNotifications,
      dailySummaryEnabled: dailySummary
    });
    
    if (success) {
      // Then test the connection
      await notificationService.testTelegramConnection();
    } else {
      toast.error("Failed to save notification settings");
    }
    
    setIsTesting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">TradingBot</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        {/* Connection Status Banner */}
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
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : connectionStatus === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
              )}
              <span className={`font-medium ${
                connectionStatus === 'success' 
                  ? 'text-green-500' 
                  : connectionStatus === 'error'
                    ? 'text-red-500'
                    : 'text-blue-500'
              }`}>
                {connectionStatus === 'success' 
                  ? "Connected"
                  : connectionStatus === 'error'
                    ? "Connection Failed"
                    : "Checking Connection..."}
              </span>
            </div>
            <div className="text-slate-300">
              {connectedMessage}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* API Configuration */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Binance API Configuration</CardTitle>
              <CardDescription>Connect your Binance account to enable trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input 
                  id="apiKey" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Binance API key" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400">
                  Create API keys in your Binance account with trading permissions
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input 
                  id="secretKey" 
                  type="password" 
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your Binance secret key" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400">
                  Never share your secret key with anyone
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSaveApiKeys}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Test Connection
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full mt-2 border-slate-700 text-slate-300"
                onClick={checkConnection}
                disabled={isLoading || !binanceService.hasCredentials()}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Test Connection Again
              </Button>
              
              <div className="mt-4 text-xs text-center text-slate-400">
                <p>
                  {binanceService.isInTestMode() 
                    ? "Currently in test mode - using simulated data" 
                    : "Using live Binance API - real trading enabled"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive trading alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telegram Notifications</Label>
                  <p className="text-xs text-slate-400">Receive alerts via Telegram</p>
                </div>
                <Switch 
                  checked={telegramEnabled}
                  onCheckedChange={setTelegramEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegramId">Telegram Chat ID</Label>
                <Input 
                  id="telegramId" 
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Enter your Telegram chat ID" 
                  className="bg-slate-800 border-slate-700"
                  disabled={!telegramEnabled}
                />
                <p className="text-xs text-slate-400">
                  Use @userinfobot to find your Telegram chat ID
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-slate-700 hover:bg-slate-800"
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
                  <Label>Trade Notifications</Label>
                  <p className="text-xs text-slate-400">Get notified for each trade</p>
                </div>
                <Switch 
                  checked={tradeNotifications}
                  onCheckedChange={setTradeNotifications}
                  disabled={!telegramEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-slate-400">Receive daily performance reports</p>
                </div>
                <Switch 
                  checked={dailySummary}
                  onCheckedChange={setDailySummary}
                  disabled={!telegramEnabled}
                />
              </div>
              
              <Button 
                className="w-full"
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
