
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
  const [error, setError] = useState<string | null>(null);
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  
  useEffect(() => {
    // Initial check and fetch
    checkConnectionAndFetchTrades();
    
    // Listen for credential updates from settings page
    const handleCredentialsUpdate = () => {
      console.log("Credentials updated, refreshing trades");
      checkConnectionAndFetchTrades();
    };
    
    window.addEventListener('binance-credentials-updated', handleCredentialsUpdate);
    
    // Setup refresh interval (every 2 minutes)
    const interval = setInterval(() => {
      if (isConnected) {
        fetchTrades();
      }
    }, 120000);
    
    return () => {
      window.removeEventListener('binance-credentials-updated', handleCredentialsUpdate);
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
      const testConnection = await binanceService.testConnection();
      setIsConnected(true); // Assume connected even if test fails due to CORS
      
      // Load trading pairs from portfolio
      try {
        const account = await binanceService.getAccountInfo();
        if (account && account.balances) {
          // Filter balances to only include assets with non-zero balances
          const activeBalances = account.balances.filter(
            balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
          );
          
          // Convert each asset to a trading pair with USDT
          const portfolioPairs = activeBalances
            .map(balance => `${balance.asset}USDT`)
            .filter(pair => pair !== 'USDTUSDT'); // Exclude USDT itself
          
          setTradingPairs(portfolioPairs);
          console.log('Trading pairs from portfolio:', portfolioPairs);
        }
      } catch (error) {
        console.error('Error loading portfolio trading pairs:', error);
        // Default to BTC and ETH if portfolio loading fails
        setTradingPairs(['BTCUSDT', 'ETHUSDT']);
      }
      
      await fetchTrades();
    } catch (error) {
      console.error("Failed to test connection:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use trading pairs from user's portfolio, default to BTC/ETH if empty
      const pairs = tradingPairs.length > 0 ? tradingPairs : ['BTCUSDT', 'ETHUSDT'];
      const allTrades = [];
      
      // Fetch trades for each pair in the portfolio
      for (const pair of pairs) {
        try {
          const pairTrades = await binanceService.getRecentTrades(pair);
          allTrades.push(...pairTrades);
          console.log(`Fetched ${pairTrades.length} trades for ${pair}`);
        } catch (error) {
          console.error(`Failed to fetch trades for ${pair}:`, error);
          // Continue with other pairs even if one fails
        }
      }
      
      console.log(`Total trades fetched: ${allTrades.length}`);
      
      // Safety check to ensure trades have expected properties
      if (allTrades.length > 0) {
        const formattedTrades = allTrades
          .sort((a, b) => b.time - a.time)
          .slice(0, 10)
          .map(trade => {
            // Extract symbol from trade object
            const symbol = trade.symbol || 'UNKNOWN';
            const baseAsset = symbol.replace('USDT', '');
            
            return {
              id: trade.id,
              pair: `${baseAsset}/USDT`,
              type: trade.isBuyerMaker ? "sell" as const : "buy" as const,
              amount: `${parseFloat(trade.qty).toFixed(6)} ${baseAsset}`,
              price: `$${parseFloat(trade.price).toFixed(2)}`,
              value: `$${(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2)}`,
              time: new Date(trade.time).toLocaleString(),
              strategy: "API Trade"
            };
          });
        
        if (formattedTrades.length > 0) {
          setTrades(formattedTrades);
        } else {
          setError("No trades found in your Binance account");
        }
      } else {
        setError("No trades found in your Binance account");
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      setError("Failed to load trade data");
      toast.error("Failed to load trade data");
    } finally {
      setIsLoading(false);
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
            onClick={() => fetchTrades()}
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
        ) : (
          <div className="text-center py-12">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-300" />
                <p className="text-white">Loading trade data...</p>
              </div>
            ) : (
              <>
                {error ? (
                  <div className="mb-4 mx-auto max-w-md p-3 rounded-md bg-red-900/20 border border-red-800">
                    <p className="text-red-200">Error: {error}</p>
                  </div>
                ) : null}
                <p className="text-white">No trades found in your Binance account</p>
                <p className="text-slate-200 text-sm mt-1">
                  Using live Binance API
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-300 p-0 h-auto mt-3"
                  onClick={() => fetchTrades()}
                >
                  Refresh trades
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrades;
