
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowUpDown, Edit, Trash } from "lucide-react";

// Mocked strategy data (in a real app, this would come from an API)
const getStrategyById = (id: string) => {
  const strategies = [
    {
      id: "1",
      name: "RSI + MACD Crossover",
      description: "Uses RSI oversold/overbought levels combined with MACD crossover signals to identify entry and exit points.",
      active: true,
      performance: "+12.4%",
      trades: 24,
      winRate: "75%",
      timeframe: "4h",
      parameters: [
        { name: "RSI Period", value: 14 },
        { name: "RSI Oversold", value: 30 },
        { name: "RSI Overbought", value: 70 },
        { name: "MACD Fast", value: 12 },
        { name: "MACD Slow", value: 26 },
        { name: "MACD Signal", value: 9 }
      ]
    },
    {
      id: "2",
      name: "Bollinger Breakout",
      description: "Identifies breakouts from Bollinger Bands to catch trending momentum moves in volatile markets.",
      active: true,
      performance: "+8.7%",
      trades: 16,
      winRate: "68%",
      timeframe: "1h",
      parameters: [
        { name: "BB Period", value: 20 },
        { name: "BB Deviation", value: 2 },
        { name: "Entry Threshold", value: "2.5%" },
        { name: "Exit Threshold", value: "1.0%" },
        { name: "Stop Loss", value: "2.0%" },
        { name: "Take Profit", value: "4.0%" }
      ]
    }
  ];
  
  return strategies.find(s => s.id === id);
};

const StrategyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const strategy = getStrategyById(id || "");

  if (!strategy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Strategy Not Found</h1>
          <Button onClick={() => navigate("/strategies")}>Back to Strategies</Button>
        </div>
      </div>
    );
  }

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
            onClick={() => navigate("/strategies")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Strategies
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{strategy.name}</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700">
              <Edit className="mr-2 h-4 w-4" />
              Edit Strategy
            </Button>
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Strategy Info */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Strategy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm text-slate-400">Description</h3>
                <p className="mt-1">{strategy.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <h3 className="text-sm text-slate-400">Status</h3>
                  <p className="mt-1">{strategy.active ? "Active" : "Inactive"}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Timeframe</h3>
                  <p className="mt-1">{strategy.timeframe}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Total Trades</h3>
                  <p className="mt-1">{strategy.trades}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Win Rate</h3>
                  <p className="mt-1">{strategy.winRate}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Performance</h3>
                  <p className="mt-1 text-green-400">{strategy.performance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Parameters */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Strategy Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-800">
                {strategy.parameters.map((param, index) => (
                  <div key={index} className="flex justify-between py-3">
                    <span className="text-slate-400">{param.name}</span>
                    <span>{param.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StrategyDetail;
