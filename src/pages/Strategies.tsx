
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowUpDown, Plus } from "lucide-react";

const strategies = [
  {
    id: 1,
    name: "RSI + MACD Crossover",
    description: "Uses RSI oversold/overbought levels combined with MACD crossover signals to identify entry and exit points.",
    active: true,
    performance: "+12.4%",
    trades: 24,
    winRate: "75%",
    timeframe: "4h"
  },
  {
    id: 2,
    name: "Bollinger Breakout",
    description: "Identifies breakouts from Bollinger Bands to catch trending momentum moves in volatile markets.",
    active: true,
    performance: "+8.7%",
    trades: 16,
    winRate: "68%",
    timeframe: "1h"
  },
  {
    id: 3,
    name: "Moving Average Ribbon",
    description: "Uses multiple moving averages to identify trend direction and potential reversal points.",
    active: false,
    performance: "+6.2%",
    trades: 12,
    winRate: "66%",
    timeframe: "1d"
  },
  {
    id: 4,
    name: "Volume Profile Strategy",
    description: "Uses volume profile analysis to identify key support/resistance levels for trading decisions.",
    active: false,
    performance: "+4.8%",
    trades: 8,
    winRate: "62%",
    timeframe: "15m"
  }
];

const Strategies = () => {
  const navigate = useNavigate();

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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Trading Strategies</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Strategy
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="bg-slate-900 border-slate-800 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch checked={strategy.active} />
                  </div>
                </div>
                <Badge
                  className={`mt-2 ${
                    strategy.active
                      ? "bg-green-500/10 text-green-500"
                      : "bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {strategy.active ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">{strategy.description}</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-400">Performance</div>
                  <div className="text-right text-green-400">{strategy.performance}</div>
                  
                  <div className="text-slate-400">Total Trades</div>
                  <div className="text-right">{strategy.trades}</div>
                  
                  <div className="text-slate-400">Win Rate</div>
                  <div className="text-right">{strategy.winRate}</div>
                  
                  <div className="text-slate-400">Timeframe</div>
                  <div className="text-right">{strategy.timeframe}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full border-slate-700 hover:bg-slate-800"
                  onClick={() => navigate(`/strategies/${strategy.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Strategies;
