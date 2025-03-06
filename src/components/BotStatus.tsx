import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, TrendingUp } from "lucide-react";
import tradingService from "@/services/tradingService";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";

const BotStatus: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uptime, setUptime] = useState("0d 0h 0m");
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState("0%");
  const [profitLoss, setProfitLoss] = useState("$0.00");
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const botRunning = tradingService.isBotRunning();
    setIsActive(botRunning);
    
    if (botRunning) {
      const savedStartTime = localStorage.getItem('botStartTime');
      if (savedStartTime) {
        setStartTime(new Date(savedStartTime));
      } else {
        const now = new Date();
        setStartTime(now);
        localStorage.setItem('botStartTime', now.toISOString());
      }
    }
    
    const handleStatsUpdate = () => {
      loadStatistics();
    };
    
    window.addEventListener('bot-statistics-updated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('bot-statistics-updated', handleStatsUpdate);
    };
  }, []);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setUptime(`${days}d ${hours}h ${minutes}m`);
      }, 60000);
      
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setUptime(`${days}d ${hours}h ${minutes}m`);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, startTime]);
  
  const loadStatistics = () => {
    const savedStats = localStorage.getItem('botStatistics');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setTotalTrades(stats.totalTrades || 0);
      setWinRate(stats.winRate || "0%");
      setProfitLoss(stats.profitLoss || "$0.00");
    }
  };
  
  const toggleBotStatus = async () => {
    setIsLoading(true);
    
    try {
      if (isActive) {
        tradingService.stopTrading();
        setIsActive(false);
        localStorage.removeItem('botStartTime');
        setStartTime(null);
      } else {
        if (!binanceService.hasCredentials()) {
          toast.error("Binance API credentials not configured. Please set them in Settings.");
          return;
        }
        
        const success = tradingService.startTrading();
        if (success) {
          setIsActive(true);
          const now = new Date();
          setStartTime(now);
          localStorage.setItem('botStartTime', now.toISOString());
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetStatistics = () => {
    const defaultStats = { totalTrades: 0, winRate: "0%", profitLoss: "$0.00" };
    localStorage.setItem('botStatistics', JSON.stringify(defaultStats));
    setTotalTrades(0);
    setWinRate("0%");
    setProfitLoss("$0.00");
    toast.success("Bot statistics have been reset");
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <span>Bot Status</span>
          <Badge className={isActive ? "bg-green-500" : "bg-red-500"}>
            {isActive ? "Running" : "Stopped"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-slate-400">Uptime</div>
          <div className="text-right">{isActive ? uptime : "-"}</div>
          
          <div className="text-slate-400">Total Trades</div>
          <div className="text-right">{totalTrades}</div>
          
          <div className="text-slate-400">Win Rate</div>
          <div className="text-right text-green-400">{winRate}</div>
          
          <div className="text-slate-400">Profit/Loss</div>
          <div className={`text-right ${profitLoss.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
            {profitLoss}
          </div>
        </div>
        
        <Button 
          className={isActive 
            ? "w-full bg-red-500 hover:bg-red-600" 
            : "w-full bg-green-500 hover:bg-green-600"
          }
          onClick={toggleBotStatus}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <><Pause className="mr-2 h-4 w-4" /> Stop Bot</> 
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Start Bot</>
          )}
        </Button>
        
        {isActive && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 mt-2"
              onClick={resetStatistics}
            >
              <TrendingUp className="h-3 w-3 mr-1" /> Reset Statistics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BotStatus;
