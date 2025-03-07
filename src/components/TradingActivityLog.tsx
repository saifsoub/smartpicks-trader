import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Clock, Check, AlertTriangle, Info, Trash2, ArrowDownUp } from "lucide-react";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { LogType, TradingLog } from "@/services/binance/types";

const TradingActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<TradingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState("BTCUSDT");
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [tradeAmount, setTradeAmount] = useState("");
  const [popularSymbols, setPopularSymbols] = useState<string[]>(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"]);
  const [symbolPrice, setSymbolPrice] = useState<string | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  
  useEffect(() => {
    // Load logs on mount
    loadLogs();
    
    // Set up an interval to refresh logs periodically
    const interval = setInterval(() => {
      loadLogs();
    }, 30000); // Refresh every 30 seconds
    
    // Listen for credential updates
    const handleCredentialsUpdate = () => {
      console.log("Credentials updated, refreshing logs");
      loadLogs();
    };
    
    window.addEventListener('binance-credentials-updated', handleCredentialsUpdate);
    
    // Also listen for test mode changes
    const handleTestModeUpdate = () => {
      console.log("Test mode updated, refreshing logs");
      loadLogs();
    };
    
    window.addEventListener('binance-test-mode-updated', handleTestModeUpdate);
    
    // Fetch available symbols from binance
    fetchPopularSymbols();
    
    // Fetch current price for the selected symbol
    fetchSymbolPrice();
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('binance-credentials-updated', handleCredentialsUpdate);
      window.removeEventListener('binance-test-mode-updated', handleTestModeUpdate);
    };
  }, []);
  
  useEffect(() => {
    fetchSymbolPrice();
  }, [tradeSymbol]);
  
  const fetchPopularSymbols = async () => {
    try {
      const symbols = await binanceService.getSymbols();
      if (symbols && symbols.length > 0) {
        // Get top 10 symbols by positive price change
        const topSymbols = symbols
          .filter(s => s.symbol.endsWith('USDT'))
          .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
          .slice(0, 10)
          .map(s => s.symbol);
          
        if (topSymbols.length > 0) {
          setPopularSymbols(topSymbols);
        }
      }
    } catch (error) {
      console.error("Error fetching symbols:", error);
    }
  };

  const fetchSymbolPrice = async () => {
    try {
      const prices = await binanceService.getPrices();
      if (prices[tradeSymbol]) {
        setSymbolPrice(parseFloat(prices[tradeSymbol]).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }));
      }
    } catch (error) {
      console.error("Error fetching price for symbol:", error);
      setSymbolPrice(null);
    }
  };
  
  const loadLogs = () => {
    setIsLoading(true);
    try {
      const tradingLogs = binanceService.getTradingLogs();
      setLogs(tradingLogs);
    } catch (error) {
      console.error("Failed to load trading logs:", error);
      toast.error("Failed to load trading logs");
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearLogs = () => {
    if (confirm("Are you sure you want to clear all trading logs? This cannot be undone.")) {
      binanceService.clearTradingLogs();
      setLogs([]);
      toast.success("All trading activity logs have been cleared");
    }
  };
  
  const executeManualTrade = async () => {
    if (!binanceService.hasCredentials()) {
      toast.error("API credentials not configured. Please set them in Settings.");
      return;
    }
    
    if (!tradeSymbol || !tradeAction || !tradeAmount) {
      toast.error("Please fill in all trade details");
      return;
    }
    
    // Validate amount is a positive number
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Trade amount must be a positive number");
      return;
    }
    
    setExecutingTrade(true);
    try {
      // Execute the trade
      const result = await binanceService.placeMarketOrder(
        tradeSymbol,
        tradeAction,
        tradeAmount
      );
      
      toast.success(`${tradeAction} order for ${tradeAmount} ${tradeSymbol} executed successfully`);
      
      // Refresh logs to show the new trade
      loadLogs();
      
      // Reset form
      setTradeAmount("");
    } catch (error) {
      console.error("Trade execution failed:", error);
      toast.error(`Trade execution failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExecutingTrade(false);
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffMins / 1440);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };
  
  const getIconForLogType = (type: LogType) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Trading Activity</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearLogs}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadLogs}
              disabled={isLoading}
              className="text-slate-400 hover:text-white"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Manual Trade Execution Form */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center mb-2">
            <ArrowDownUp className="h-4 w-4 text-blue-400 mr-2" />
            <h3 className="text-sm font-medium text-white">Execute Manual Trade</h3>
          </div>
          <div className="grid grid-cols-12 gap-2 mt-3">
            <div className="col-span-4">
              <Select 
                value={tradeSymbol}
                onValueChange={setTradeSymbol}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {popularSymbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol} className="text-white hover:bg-slate-800">{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Select 
                value={tradeAction}
                onValueChange={(value) => setTradeAction(value as "BUY" | "SELL")}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="BUY" className="text-green-400 hover:bg-slate-800">BUY</SelectItem>
                  <SelectItem value="SELL" className="text-red-400 hover:bg-slate-800">SELL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Input 
                type="text" 
                placeholder="Amount" 
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="col-span-2">
              <Button 
                className={`w-full ${tradeAction === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                disabled={executingTrade}
                onClick={executeManualTrade}
              >
                {executingTrade ? <RefreshCw className="h-4 w-4 animate-spin" /> : tradeAction}
              </Button>
            </div>
          </div>
          {symbolPrice && (
            <div className="mt-2 text-xs text-slate-400 flex justify-between">
              <span>Current price: <span className="text-white">${symbolPrice}</span></span>
              <span>Estimated value: <span className="text-white">
                ${tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                  ? (parseFloat(tradeAmount) * parseFloat(symbolPrice.replace(/,/g, ''))).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) 
                  : "0.00"}
              </span></span>
            </div>
          )}
        </div>
        
        <Separator className="my-4 bg-slate-800" />
        
        {/* Activity Log */}
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
          {logs.length > 0 ? (
            <ul className="divide-y divide-slate-800">
              {logs.map((log, index) => (
                <li key={index} className="flex items-start gap-3 p-3 hover:bg-slate-800/50">
                  <div className="mt-1">
                    {getIconForLogType(log.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{log.message}</p>
                    <div className="flex items-center mt-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <Info className="h-8 w-8 mx-auto mb-3 text-slate-500 opacity-50" />
              <p className="text-white">No trading activity logs yet</p>
              <p className="text-slate-400 text-xs mt-1">
                {binanceService.isInTestMode() 
                  ? "Logs will appear as you interact with the test mode" 
                  : "Logs will appear as the bot operates or you execute trades"
                }
              </p>
              <Button 
                variant="link" 
                className="text-blue-300 p-0 h-auto mt-3"
                onClick={loadLogs}
              >
                Refresh logs
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingActivityLog;
