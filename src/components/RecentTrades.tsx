
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";

const recentTrades = [
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
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-white">Recent Trades</CardTitle>
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
              {recentTrades.map((trade) => (
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
