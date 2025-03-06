
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, RefreshCw, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";

interface Trade {
  id: number;
  pair: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  value: string;
  time: string;
  strategy: string;
}

const RecentTrades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initial check and fetch
    checkConnectionAndFetchTrades();
    
    // Listen for credential updates from settings page
    const handleCredentialsUpdate = () => {
      console.log("Credentials updated, refreshing trades");
      checkConnectionAndFetchTrades();
    };
    
    window.addEventListener('binance-credentials-updated', handleCredentialsUpdate);
    
    return () => {
      window.removeEventListener('binance-credentials-updated', handleCredentialsUpdate);
    };
  }, []);
  
  const checkConnectionAndFetchTrades = async () => {
    if (!binanceService.hasCredentials()) {
      setIsConnected(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const testConnection = await binanceService.testConnection();
      // In test mode or real mode, if connection is successful, we show the UI
      setIsConnected(testConnection);
      
      if (testConnection) {
        fetchTrades();
      } else {
        setTrades([]);
        toast.error("Failed to connect to Binance API");
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTrades = async () => {
    try {
      const btcTrades = await binanceService.getRecentTrades("BTCUSDT");
      const ethTrades = await binanceService.getRecentTrades("ETHUSDT");
      
      const formattedTrades = [...btcTrades, ...ethTrades]
        .sort((a, b) => b.time - a.time)
        .slice(0, 10)
        .map(trade => ({
          id: trade.id,
          pair: trade.symbol.replace("USDT", "/USDT"),
          type: trade.isBuyer ? "buy" as const : "sell" as const,
          amount: `${parseFloat(trade.qty).toFixed(6)} ${trade.symbol.replace("USDT", "")}`,
          price: `$${parseFloat(trade.price).toFixed(2)}`,
          value: `$${(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2)}`,
          time: new Date(trade.time).toLocaleString(),
          strategy: "API Trade"
        }));
      
      setTrades(formattedTrades as Trade[]);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      toast.error("Failed to load recent trades");
      setTrades([]);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Trades</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkConnectionAndFetchTrades}
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
      </CardHeader>
      <CardContent className="p-0">
        {!isConnected ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-white font-medium">Not connected to Binance API</p>
            <p className="text-slate-400 text-sm mt-1">Please configure API credentials in Settings</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure API
            </Button>
          </div>
        ) : trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Pair</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Type</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-slate-800">
                    <td className="px-4 py-3 text-sm font-medium text-white">{trade.pair}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge 
                        className={`flex items-center w-[70px] justify-center ${
                          trade.type === "buy" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {trade.type === "buy" 
                          ? <><ArrowDown className="mr-1 h-3 w-3" /> Buy</> 
                          : <><ArrowUp className="mr-1 h-3 w-3" /> Sell</>
                        }
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{trade.amount}</td>
                    <td className="px-4 py-3 text-sm text-white">{trade.price}</td>
                    <td className="px-4 py-3 text-sm text-white">{trade.value}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{trade.time}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                        {trade.strategy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No trades found in your Binance account</p>
            <p className="text-slate-400 text-sm mt-1">
              {binanceService.isInTestMode() ? 
                "Currently in test mode - using simulated data" : 
                "Using live Binance API"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrades;
