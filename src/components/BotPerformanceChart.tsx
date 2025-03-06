import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, TrendingUp, BarChart2, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import tradingService from "@/services/tradingService";

interface PerformanceData {
  time: string;
  profit: number;
  cumulativeProfit: number;
  trades: number;
  winRate: number;
}

const BotPerformanceChart: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'profit' | 'trades' | 'combined'>('profit');
  const [isLoading, setIsLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [bestDay, setBestDay] = useState({ date: "", profit: 0 });
  const [totalTrades, setTotalTrades] = useState(0);
  const [averageWinRate, setAverageWinRate] = useState(0);

  useEffect(() => {
    loadPerformanceData();
    
    const handleStatsUpdate = () => {
      loadPerformanceData();
    };
    
    window.addEventListener('bot-statistics-updated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('bot-statistics-updated', handleStatsUpdate);
    };
  }, [timeframe]);

  const loadPerformanceData = () => {
    setIsLoading(true);
    
    const rawData = tradingService.getPerformanceHistory(timeframe);
    setPerformanceData(rawData);
    
    let total = 0;
    let bestProfit = 0;
    let bestDate = "";
    let trades = 0;
    let winRateSum = 0;
    
    rawData.forEach(day => {
      total += day.profit;
      trades += day.trades;
      winRateSum += day.winRate * day.trades;
      
      if (day.profit > bestProfit) {
        bestProfit = day.profit;
        bestDate = day.time;
      }
    });
    
    setTotalProfit(total);
    setBestDay({ date: bestDate, profit: bestProfit });
    setTotalTrades(trades);
    setAverageWinRate(trades > 0 ? Math.round(winRateSum / trades) : 0);
    
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-white">
            <BarChart2 className="h-5 w-5 mr-2 text-indigo-400" />
            Bot Performance Metrics
          </CardTitle>
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-[120px] h-8 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center text-slate-400 text-xs mb-1">
              <CircleDollarSign className="h-3 w-3 mr-1" />
              Total Profit/Loss
            </div>
            <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center text-slate-400 text-xs mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              Best Day
            </div>
            <div className="text-lg font-bold text-green-400">
              {bestDay.profit > 0 ? formatCurrency(bestDay.profit) : "-"}
            </div>
            {bestDay.date && <div className="text-xs text-slate-400">{bestDay.date}</div>}
          </div>
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center text-slate-400 text-xs mb-1">
              <BarChart2 className="h-3 w-3 mr-1" />
              Total Trades
            </div>
            <div className="text-lg font-bold text-blue-400">
              {totalTrades}
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center text-slate-400 text-xs mb-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Avg. Win Rate
            </div>
            <div className="text-lg font-bold text-indigo-400">
              {formatPercent(averageWinRate)}
            </div>
          </div>
        </div>
        
        <Tabs value={chartType} onValueChange={(v: any) => setChartType(v)} className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700 w-full grid grid-cols-3">
            <TabsTrigger value="profit" className="data-[state=active]:bg-indigo-800">
              Profit/Loss
            </TabsTrigger>
            <TabsTrigger value="trades" className="data-[state=active]:bg-indigo-800">
              Trades
            </TabsTrigger>
            <TabsTrigger value="combined" className="data-[state=active]:bg-indigo-800">
              Combined
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profit" className="mt-3">
            <div className="h-[250px] w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={performanceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#e5e7eb'
                      }}
                      formatter={(value: any, name: string) => {
                        return [`$${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value)).toFixed(2)}`, name];
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      name="Daily Profit" 
                      stroke="#10B981" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeProfit" 
                      name="Cumulative Profit" 
                      stroke="#6366F1" 
                      fillOpacity={1} 
                      fill="url(#colorCumulative)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  {isLoading ? "Loading performance data..." : "No performance data available yet"}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="trades" className="mt-3">
            <div className="h-[250px] w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#e5e7eb'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="trades" 
                      name="# of Trades" 
                      fill="#3B82F6" 
                    />
                    <Bar 
                      dataKey="winRate" 
                      name="Win Rate (%)" 
                      fill="#8B5CF6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  {isLoading ? "Loading trade data..." : "No trade data available yet"}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="combined" className="mt-3">
            <div className="h-[250px] w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#e5e7eb'
                      }}
                      formatter={(value, name) => {
                        if (name === 'Profit') return [`$${value.toFixed(2)}`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="profit" 
                      name="Profit" 
                      fill="#10B981" 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="trades" 
                      name="Trades" 
                      fill="#3B82F6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  {isLoading ? "Loading performance data..." : "No performance data available yet"}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {performanceData.length === 0 && !isLoading && (
          <div className="text-center mt-4 p-4 bg-slate-800/50 rounded-lg">
            <Badge variant="outline" className="mb-2 bg-indigo-900/30 text-indigo-300 border-indigo-500">
              No Data Yet
            </Badge>
            <p className="text-slate-300 text-sm">
              Start the trading bot to begin collecting performance metrics
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BotPerformanceChart;
