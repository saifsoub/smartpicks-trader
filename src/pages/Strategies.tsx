
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowUpDown, Plus } from "lucide-react";
import tradingService from "@/services/tradingService";
import { toast } from "sonner";
import { Strategy } from "@/services/tradingService";

const Strategies = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  // Load strategies on component mount
  useEffect(() => {
    const loadedStrategies = tradingService.getStrategies();
    setStrategies(loadedStrategies);
  }, []);

  // Toggle strategy active status
  const handleToggleStatus = (id: string) => {
    tradingService.toggleStrategyStatus(id);
    
    // Update local state
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === id) {
        return { ...strategy, isActive: !strategy.isActive };
      }
      return strategy;
    }));
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Trading Strategies</h1>
          <Button onClick={() => toast.info("New strategy creation coming soon")}>
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
                    <Switch 
                      checked={strategy.isActive} 
                      onCheckedChange={() => handleToggleStatus(strategy.id)}
                    />
                  </div>
                </div>
                <Badge
                  className={`mt-2 ${
                    strategy.isActive
                      ? "bg-green-500/10 text-green-500"
                      : "bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {strategy.isActive ? "Active" : "Inactive"}
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
                  
                  <div className="text-slate-400">Symbol</div>
                  <div className="text-right">{strategy.symbol}</div>
                  
                  <div className="text-slate-400">Timeframe</div>
                  <div className="text-right">{strategy.interval}</div>
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
