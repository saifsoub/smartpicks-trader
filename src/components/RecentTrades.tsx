
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
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

// Sample trades for when real data isn't available
const sampleTrades: Trade[] = [
  {
    id: 1,
    pair: "BTC/USDT",
    type: "buy",
    amount: "0.024 BTC",
    price: "$66,120.35",
    value: "$1,586.89",
    time: "10 minutes ago",
    strategy: "RSI + MACD Crossover"
  },
  {
    id: 2,
    pair: "ETH/USDT",
    type: "sell",
    amount: "0.92 ETH",
    price: "$3,221.48",
    value: "$2,963.76",
    time: "32 minutes ago",
    strategy: "Bollinger Breakout"
  },
  {
    id: 3,
    pair: "BTC/USDT",
    type: "buy",
    amount: "0.018 BTC",
    price: "$65,984.12",
    value: "$1,187.71",
    time: "54 minutes ago",
    strategy: "RSI + MACD Crossover"
  },
  {
    id: 4,
    pair: "SOL/USDT",
    type: "sell",
    amount: "8.4 SOL",
    price: "$172.62",
    value: "$1,450.01",
    time: "1 hour ago",
    strategy: "Bollinger Breakout"
  }
];

const RecentTrades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Try to fetch real trades on component mount
  useEffect(() => {
    if (binanceService.hasCredentials()) {
      fetchTrades();
    } else {
      // Use sample data if no credentials are available
      setTrades(sampleTrades);
    }
  }, []);
  
  const fetchTrades = async () => {
    setIsLoading(true);
    
    try {
      if (!binanceService.hasCredentials()) {
        toast.error("Binance API credentials not configured");
        setTrades(sampleTrades);
        return;
      }
      
      // Attempt to get real trades from Binance
      // For now, we'll use the sample trades since we don't have real API integration
      
      // const btcTrades = await binanceService.getRecentTrades("BTCUSDT");
      // const ethTrades = await binanceService.getRecentTrades("ETHUSDT");
      // 
      // // Transform to our trade format
      // const formattedTrades = [...btcTrades, ...ethTrades]
      //   .sort((a, b) => b.time - a.time)
      //   .slice(0, 10)
      //   .map(trade => ({
      //     id: trade.id,
      //     pair: trade.symbol.replace("USDT", "/USDT"),
      //     type: trade.isBuyer ? "buy" : "sell",
      //     amount: `${parseFloat(trade.qty).toFixed(6)} ${trade.symbol.replace("USDT", "")}`,
      //     price: `$${parseFloat(trade.price).toFixed(2)}`,
      //     value: `$${(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2)}`,
      //     time: new Date(trade.time).toLocaleString(),
      //     strategy: "Manual Trade" // Real trades wouldn't have a strategy attached
      //   }));
      
      // For now, use sample trades
      setTrades(sampleTrades);
      
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      toast.error("Failed to load recent trades");
      setTrades(sampleTrades);
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
            onClick={fetchTrades}
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-slate-800">
                  <td className="px-4 py-3 text-sm font-medium">{trade.pair}</td>
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
                  <td className="px-4 py-3 text-sm">{trade.amount}</td>
                  <td className="px-4 py-3 text-sm">{trade.price}</td>
                  <td className="px-4 py-3 text-sm">{trade.value}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{trade.time}</td>
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
      </CardContent>
    </Card>
  );
};

export default RecentTrades;
