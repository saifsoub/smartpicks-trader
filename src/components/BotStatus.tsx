import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, TrendingUp, Settings, AlertTriangle } from "lucide-react";
import tradingService from "@/services/tradingService";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BotStatus: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uptime, setUptime] = useState("0d 0h 0m");
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState("0%");
  const [profitLoss, setProfitLoss] = useState("$0.00");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activePairs, setActivePairs] = useState<string[]>([]);
  
  const [tradingPair, setTradingPair] = useState("BTCUSDT");
  const [riskLevel, setRiskLevel] = useState(50);
  const [trailingStopLoss, setTrailingStopLoss] = useState(false);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(true);
  const [dynamicPositionSizing, setDynamicPositionSizing] = useState(true);
  
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
  
  useEffect(() => {
    const loadActivePairs = async () => {
      try {
        const account = await binanceService.getAccountInfo();
        if (account && account.balances) {
          const pairs = account.balances
            .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
            .map(balance => `${balance.asset}USDT`)
            .filter(pair => pair !== 'USDTUSDT');
          setActivePairs(pairs);
        }
      } catch (error) {
        console.error('Error loading active pairs:', error);
      }
    };
    
    loadActivePairs();
  }, []);
  
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
        
        tradingService.updateBotSettings({
          tradingPairs: [tradingPair],
          riskLevel: riskLevel,
          useTrailingStopLoss: trailingStopLoss,
          useTakeProfit: takeProfitEnabled,
          useDynamicPositionSizing: dynamicPositionSizing
        });
        
        const success = await tradingService.startTrading();
        if (success) {
          setIsActive(true);
          const now = new Date();
          setStartTime(now);
          localStorage.setItem('botStartTime', now.toISOString());
          
          toast.success(`Bot started with ${riskLevel}% risk level and ${trailingStopLoss ? 'trailing stop loss' : 'fixed stop loss'}`);
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
  
  const saveSettings = () => {
    tradingService.updateBotSettings({
      tradingPairs: [tradingPair],
      riskLevel: riskLevel,
      useTrailingStopLoss: trailingStopLoss,
      useTakeProfit: takeProfitEnabled,
      useDynamicPositionSizing: dynamicPositionSizing
    });
    
    setShowSettings(false);
    toast.success("Trading bot settings saved");
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <span>Bot Status</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md hover:bg-slate-800"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 text-slate-400" />
            </Button>
            <Badge className={isActive ? "bg-green-500" : "bg-red-500"}>
              {isActive ? "Running" : "Stopped"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      {!showSettings ? (
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
            
            <div className="text-slate-400">Risk Level</div>
            <div className="text-right text-orange-400">{riskLevel}%</div>
            
            <div className="text-slate-400">Stop Loss</div>
            <div className="text-right text-blue-400">{trailingStopLoss ? 'Trailing' : 'Fixed'}</div>
            
            <div className="text-slate-400">Active Pairs</div>
            <div className="text-right text-blue-400">{activePairs.length}</div>
          </div>
          
          {activePairs.length > 0 && (
            <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs space-y-1">
              {activePairs.map(pair => (
                <div key={pair} className="flex justify-between text-slate-300">
                  <span>{pair}</span>
                </div>
              ))}
            </div>
          )}
          
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
      ) : (
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="trading-pair" className="text-sm text-slate-400">Trading Pair</Label>
              <Select value={tradingPair} onValueChange={setTradingPair}>
                <SelectTrigger id="trading-pair" className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                  <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="risk-level" className="text-sm text-slate-400">Risk Level: {riskLevel}%</Label>
                <span className="text-xs text-slate-500">Lower = Safer, Higher = Aggressive</span>
              </div>
              <Slider 
                id="risk-level"
                value={[riskLevel]} 
                min={10} 
                max={90} 
                step={5} 
                onValueChange={(values) => setRiskLevel(values[0])}
                className="my-2"
              />
              {riskLevel > 70 && (
                <div className="flex items-center text-xs text-amber-400 mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High risk may lead to larger potential losses
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="trailing-stop" className="text-sm text-slate-400">
                  Trailing Stop Loss
                </Label>
                <Switch 
                  id="trailing-stop" 
                  checked={trailingStopLoss}
                  onCheckedChange={setTrailingStopLoss}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="take-profit" className="text-sm text-slate-400">
                  Take Profit
                </Label>
                <Switch 
                  id="take-profit" 
                  checked={takeProfitEnabled}
                  onCheckedChange={setTakeProfitEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="dynamic-position" className="text-sm text-slate-400">
                  Dynamic Position Sizing
                </Label>
                <Switch 
                  id="dynamic-position" 
                  checked={dynamicPositionSizing}
                  onCheckedChange={setDynamicPositionSizing}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 border-slate-700 bg-slate-800 text-slate-200"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={saveSettings}
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default BotStatus;
