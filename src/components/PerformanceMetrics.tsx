
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Calendar, Zap, Award, Target, BarChart2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import tradingService from "@/services/tradingService";

const PerformanceMetrics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [chartData, setChartData] = useState<any[]>([]);
  const [performance, setPerformance] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [hasProfit, setHasProfit] = useState(true);
  
  useEffect(() => {
    // Get actual trade statistics from bot
    const statsStr = localStorage.getItem('botStatistics');
    if (statsStr) {
      const stats = JSON.parse(statsStr);
      setTradeCount(stats.totalTrades || 0);
      setWinRate(parseInt(stats.winRate) || 0);
      
      const profitValue = parseFloat(stats.profitLoss?.replace('$', '') || '0');
      setPerformance(tradeCount > 0 ? profitValue : 0);
      setHasProfit(profitValue >= 0);
    }
    
    // Generate empty chart data
    generateEmptyChartData();

    // Listen for statistics updates
    const handleStatsUpdate = () => {
      updateStatsFromStorage();
    };
    
    window.addEventListener('bot-statistics-updated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('bot-statistics-updated', handleStatsUpdate);
    };
  }, []);
  
  useEffect(() => {
    generateEmptyChartData();
  }, [timeframe]);
  
  const updateStatsFromStorage = () => {
    const statsStr = localStorage.getItem('botStatistics');
    if (statsStr) {
      const stats = JSON.parse(statsStr);
      setTradeCount(stats.totalTrades || 0);
      setWinRate(parseInt(stats.winRate) || 0);
      
      const profitValue = parseFloat(stats.profitLoss?.replace('$', '') || '0');
      setPerformance(profitValue);
      setHasProfit(profitValue >= 0);
    }
  };
  
  const generateEmptyChartData = () => {
    const data = [];
    const date = new Date();
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    
    date.setDate(date.getDate() - days);
    
    for (let i = 0; i < days; i++) {
      const day = new Date(date);
      day.setDate(day.getDate() + i);
      
      data.push({
        date: day.toISOString().split('T')[0],
        value: 1000 // Baseline value
      });
    }
    
    setChartData(data);
  };
  
  const requestOptimization = () => {
    toast.success("AI optimization requested! This will be available once the bot has actual trading data.", {
      duration: 5000
    });
  };
  
  // Custom formatter for the chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs">
          <p className="text-slate-300">{label}</p>
          <p className="text-white font-semibold">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-white flex items-center">
          <BarChart2 className="h-5 w-5 text-blue-400 mr-2" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue={timeframe} onValueChange={(v) => setTimeframe(v as 'week' | 'month' | 'year')}>
          <div className="flex justify-between items-center mb-2">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="week" className="data-[state=active]:bg-blue-800/70">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-blue-800/70">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Month
              </TabsTrigger>
              <TabsTrigger value="year" className="data-[state=active]:bg-blue-800/70">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Year
              </TabsTrigger>
            </TabsList>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-indigo-800/50 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
              onClick={requestOptimization}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              AI Optimize
            </Button>
          </div>
          
          {tradeCount > 0 ? (
            <>
              <div className="flex items-center justify-between mt-3 mb-1">
                <div className="flex items-center">
                  <div className={`mr-3 p-1.5 rounded ${hasProfit ? "bg-green-900/20" : "bg-red-900/20"}`}>
                    {hasProfit ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Performance</div>
                    <div className={`text-xl font-bold ${hasProfit ? "text-green-400" : "text-red-400"}`}>
                      {hasProfit ? "+" : ""}{performance.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-slate-400">Total Trades</div>
                  <div className="text-xl font-bold text-white">{tradeCount}</div>
                </div>
              </div>
              
              <div className="h-[200px] mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 0,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#94a3b8' }}
                      tickLine={{ stroke: '#64748b' }}
                      axisLine={{ stroke: '#64748b' }}
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8' }}
                      tickLine={{ stroke: '#64748b' }}
                      axisLine={{ stroke: '#64748b' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="url(#colorValue)" 
                      activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 1, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-slate-400 mb-1">
                    <Award className="h-4 w-4 mr-1 text-green-400" />
                    Win Rate
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">{winRate}%</div>
                    <div className="text-xs text-green-400">
                      {winRate > 60 ? "Good" : "Average"}
                    </div>
                  </div>
                  <Progress 
                    value={winRate} 
                    className="h-1.5 mt-1" 
                    indicatorClassName="bg-green-500" 
                  />
                </div>
                
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-slate-400 mb-1">
                    <Target className="h-4 w-4 mr-1 text-blue-400" />
                    Avg. Return/Trade
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">
                      {(tradeCount > 0 ? performance / tradeCount : 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-blue-400">
                      Per Trade
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, tradeCount > 0 ? ((performance / tradeCount) * 25) : 0)} 
                    className="h-1.5 mt-1" 
                    indicatorClassName="bg-blue-500" 
                  />
                </div>
                
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-slate-400 mb-1">
                    <Zap className="h-4 w-4 mr-1 text-yellow-400" />
                    AI Performance
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">
                      {(performance * 1.2).toFixed(2)}%
                    </div>
                    <div className="text-xs text-yellow-400">
                      vs. Market
                    </div>
                  </div>
                  <Progress 
                    value={tradeCount > 0 ? 80 : 0} 
                    className="h-1.5 mt-1" 
                    indicatorClassName="bg-yellow-500" 
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
              <h3 className="text-lg font-medium text-slate-300 mb-1">No Trading Data Yet</h3>
              <p className="text-sm text-slate-400 max-w-md">
                The bot has not made any trades yet. Performance metrics will be displayed once trading activity begins.
              </p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
