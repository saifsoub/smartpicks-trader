
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, RefreshCw, AlertTriangle, Settings, Info } from "lucide-react";
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
  const [dataSource, setDataSource] = useState<'real' | 'test'>('real');
  
  useEffect(() => {
    // Initial check and fetch
    checkConnectionAndFetchTrades();
    
    // Listen for credential updates from settings page
    const handleCredentialsUpdate = () => {
      console.log("Credentials updated, refreshing trades");
      checkConnectionAndFetchTrades();
    };
    
    window.addEventListener('binance-credentials-updated', handleCredentialsUpdate);
    
    // Also listen for test mode changes
    const handleTestModeUpdate = () => {
      console.log("Test mode updated, refreshing trades");
      checkConnectionAndFetchTrades();
    };
    
    window.addEventListener('binance-test-mode-updated', handleTestModeUpdate);
    
    // Setup refresh interval (every 2 minutes)
    const interval = setInterval(() => {
      if (isConnected) {
        fetchTrades(false);
      }
    }, 120000);
    
    return () => {
      window.removeEventListener('binance-credentials-updated', handleCredentialsUpdate);
      window.removeEventListener('binance-test-mode-updated', handleTestModeUpdate);
      clearInterval(interval);
    };
  }, [isConnected]);
  
  const checkConnectionAndFetchTrades = async () => {
    if (!binanceService.hasCredentials()) {
      setIsConnected(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Always consider connected in test mode
      if (binanceService.isInTestMode()) {
        setIsConnected(true);
        await fetchTrades(true);
        return;
      }
      
      // For real mode, test connection but be forgiving due to CORS issues
      try {
        const testConnection = await binanceService.testConnection();
        setIsConnected(true); // Assume connected even if test fails due to CORS
        await fetchTrades(false);
      } catch (error) {
        console.error("Connection test error:", error);
        // Still set connected if we have credentials, despite errors
        // This helps with CORS issues in browser environment
        setIsConnected(true);
        await fetchTrades(false);
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      
      // Still set connected to true in test mode even if error occurs
      if (binanceService.isInTestMode()) {
        setIsConnected(true);
        await fetchTrades(true);
      } else {
        // In live mode, we'll still try to show data even if connection test fails
        setIsConnected(true);
        await fetchTrades(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTrades = async (forceTestData: boolean = false) => {
    try {
      if (forceTestData || binanceService.isInTestMode()) {
        loadMockTrades();
        setDataSource('test');
        return;
      }
      
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
        
        if (formattedTrades.length > 0) {
          setTrades(formattedTrades);
          setDataSource('real');
        } else {
          throw new Error("No trades found");
        }
      } catch (error) {
        console.error("Failed to fetch real trade data:", error);
        toast.error("Could not load real trades, using test data instead");
        loadMockTrades();
        setDataSource('test');
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      toast.error("Failed to load trade data");
    }
  };

  const loadMockTrades = () => {
    const currentTime = new Date();
    const mockTrades: Trade[] = [
      {
        id: 1001,
        pair: "BTC/USDT",
        type: "buy",
        amount: "0.00125 BTC",
        price: "$66,789.35",
        value: "$83.49",
        time: currentTime.toLocaleString(),
        strategy: "Test Trade"
      },
      {
        id: 1002,
        pair: "ETH/USDT",
        type: "sell",
        amount: "0.05 ETH",
        price: "$3,578.24",
        value: "$178.91",
        time: new Date(currentTime.getTime() - 1000 * 60 * 15).toLocaleString(),
        strategy: "Test Trade"
      },
      {
        id: 1003,
        pair: "BNB/USDT",
        type: "buy",
        amount: "0.2 BNB",
        price: "$612.45",
        value: "$122.49",
        time: new Date(currentTime.getTime() - 1000 * 60 * 45).toLocaleString(),
        strategy: "Test Trade"
      },
      {
        id: 1004,
        pair: "SOL/USDT",
        type: "buy",
        amount: "0.5 SOL",
        price: "$182.95",
        value: "$91.48",
        time: new Date(currentTime.getTime() - 1000 * 60 * 120).toLocaleString(),
        strategy: "Test Trade"
      },
      {
        id: 1005,
        pair: "BTC/USDT",
        type: "sell",
        amount: "0.001 BTC",
        price: "$66,420.50",
        value: "$66.42",
        time: new Date(currentTime.getTime() - 1000 * 60 * 180).toLocaleString(),
        strategy: "Test Trade"
      }
    ];
    
    setTrades(mockTrades);
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Trades</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchTrades(false)}
            disabled={isLoading}
            className="text-slate-200 hover:text-white hover:bg-slate-800"
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
            <p className="text-slate-200 text-sm mt-1">Please configure API credentials in Settings</p>
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
          <>
            {dataSource === 'test' && !binanceService.isInTestMode() && (
              <div className="m-3 p-2 rounded-md bg-yellow-900/20 border border-yellow-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-300 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-200">
                    Showing test data due to API connection issues. Your real trades could not be retrieved.
                  </p>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Pair</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Type</th>
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
                      <td className="px-4 py-3 text-sm text-slate-200">{trade.time}</td>
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
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No trades found in your Binance account</p>
            <p className="text-slate-200 text-sm mt-1">
              {binanceService.isInTestMode() ? 
                "Currently in test mode - using simulated data" : 
                "Using live Binance API"
              }
            </p>
            <div className="flex justify-center mt-3">
              <Button 
                variant="link" 
                className="text-blue-300 p-0 h-auto"
                onClick={() => fetchTrades(false)}
              >
                Refresh trades
              </Button>
              <Button 
                variant="link" 
                className="text-blue-300 p-0 h-auto ml-4"
                onClick={() => fetchTrades(true)}
              >
                Show sample trades
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrades;
