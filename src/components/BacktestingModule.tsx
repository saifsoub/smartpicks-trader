
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, SkipBack, Play, BarChart3, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sample backtesting results
const backtestResults = {
  performance: [
    { date: "Jan", portfolio: 10000, benchmark: 10000 },
    { date: "Feb", portfolio: 11200, benchmark: 10400 },
    { date: "Mar", portfolio: 10800, benchmark: 10600 },
    { date: "Apr", portfolio: 12000, benchmark: 10900 },
    { date: "May", portfolio: 13500, benchmark: 11200 },
    { date: "Jun", portfolio: 13200, benchmark: 11000 },
    { date: "Jul", portfolio: 14500, benchmark: 11500 },
  ],
  trades: [
    { month: "Jan", profits: 1200, losses: -0 },
    { month: "Feb", profits: 800, losses: -1200 },
    { month: "Mar", profits: 1500, losses: -300 },
    { month: "Apr", profits: 2000, losses: -500 },
    { month: "May", profits: 1000, losses: -1300 },
    { month: "Jun", profits: 2200, losses: -700 },
    { month: "Jul", profits: 1800, losses: -500 },
  ],
  metrics: {
    totalReturn: 45.0,
    benchmarkReturn: 15.0,
    sharpeRatio: 1.8,
    maxDrawdown: 12.5,
    winRate: 68.0,
    profitFactor: 2.4,
  }
};

const BacktestingModule: React.FC = () => {
  const [timeframe, setTimeframe] = useState("1d");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2023-07-31");
  const [strategy, setStrategy] = useState("bollinger_breakout");
  const [chartView, setChartView] = useState("performance");
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  const runBacktest = () => {
    setIsRunning(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsRunning(false);
      setHasResults(true);
      toast.success("Backtesting completed successfully");
    }, 2000);
  };
  
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SkipBack className="h-5 w-5 text-purple-400 mr-2" />
            <CardTitle className="text-white">Strategy Backtesting</CardTitle>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Test your trading strategies against historical data before putting real money at risk.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="strategy" className="text-slate-200">Strategy</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger id="strategy" className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="bollinger_breakout">Bollinger Breakout</SelectItem>
                <SelectItem value="macd_crossover">MACD Crossover</SelectItem>
                <SelectItem value="rsi_divergence">RSI Divergence</SelectItem>
                <SelectItem value="moving_avg_crossover">Moving Average Crossover</SelectItem>
                <SelectItem value="ichimoku">Ichimoku Cloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timeframe" className="text-slate-200">Timeframe</Label>
            <ToggleGroup 
              type="single" 
              value={timeframe} 
              onValueChange={(value) => value && setTimeframe(value)}
              className="justify-start bg-slate-800 border border-slate-700 rounded-md p-1 mt-1"
            >
              <ToggleGroupItem value="1h" aria-label="1 Hour">1H</ToggleGroupItem>
              <ToggleGroupItem value="4h" aria-label="4 Hours">4H</ToggleGroupItem>
              <ToggleGroupItem value="1d" aria-label="1 Day">1D</ToggleGroupItem>
              <ToggleGroupItem value="1w" aria-label="1 Week">1W</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date" className="text-slate-200">Start Date</Label>
            <Input 
              id="start-date" 
              type="date" 
              className="bg-slate-800 border-slate-700 text-white mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-slate-200">End Date</Label>
            <Input 
              id="end-date" 
              type="date" 
              className="bg-slate-800 border-slate-700 text-white mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={runBacktest}
          disabled={isRunning}
        >
          {isRunning ? (
            <>Running Backtest...</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Backtest
            </>
          )}
        </Button>
        
        {hasResults && (
          <>
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white">Results</h3>
                <ToggleGroup 
                  type="single" 
                  value={chartView} 
                  onValueChange={(value) => value && setChartView(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="performance" aria-label="Performance">
                    <LineChart className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="trades" aria-label="Trades">
                    <BarChart3 className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "performance" ? (
                    <RechartsLineChart
                      data={backtestResults.performance}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="date" stroke="#a0aec0" />
                      <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1a202c", border: "1px solid #2d3748", color: "#fff" }}
                        formatter={(value) => [`$${value}`, ""]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="portfolio" 
                        stroke="#8884d8" 
                        name="Strategy" 
                        strokeWidth={2}
                        dot={{ fill: "#8884d8", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benchmark" 
                        stroke="#82ca9d" 
                        name="Benchmark (BTC)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#82ca9d", r: 4 }}
                      />
                    </RechartsLineChart>
                  ) : (
                    <BarChart
                      data={backtestResults.trades}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="month" stroke="#a0aec0" />
                      <YAxis stroke="#a0aec0" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1a202c", border: "1px solid #2d3748", color: "#fff" }}
                        formatter={(value) => [`$${value}`, ""]}
                      />
                      <Legend />
                      <Bar dataKey="profits" fill="#4ade80" name="Profits" />
                      <Bar dataKey="losses" fill="#f87171" name="Losses" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-center">
                  <div className="text-xs text-slate-400">Total Return</div>
                  <div className="text-lg font-bold text-green-300">
                    {formatPercent(backtestResults.metrics.totalReturn)}
                  </div>
                  <div className="text-xs text-slate-400">vs Benchmark</div>
                  <div className="text-sm text-slate-300">
                    {formatPercent(backtestResults.metrics.benchmarkReturn)}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-center">
                  <div className="text-xs text-slate-400">Win Rate</div>
                  <div className="text-lg font-bold text-blue-300">
                    {formatPercent(backtestResults.metrics.winRate)}
                  </div>
                  <div className="text-xs text-slate-400">Profit Factor</div>
                  <div className="text-sm text-slate-300">
                    {backtestResults.metrics.profitFactor.toFixed(2)}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-center">
                  <div className="text-xs text-slate-400">Max Drawdown</div>
                  <div className="text-lg font-bold text-red-300">
                    {formatPercent(backtestResults.metrics.maxDrawdown)}
                  </div>
                  <div className="text-xs text-slate-400">Sharpe Ratio</div>
                  <div className="text-sm text-slate-300">
                    {backtestResults.metrics.sharpeRatio.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button className="w-full border border-green-600 text-green-500 hover:bg-green-800/20">
                  Deploy This Strategy
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BacktestingModule;
