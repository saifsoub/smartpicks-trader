
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";

interface TradingChartProps {
  symbol?: string;
}

interface KlineData {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol: initialSymbol = "BTCUSDT" }) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState("1h");
  const [chartData, setChartData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const timeIntervals = [
    { value: "15m", label: "15 min" },
    { value: "1h", label: "1 hour" },
    { value: "4h", label: "4 hours" },
    { value: "1d", label: "1 day" },
  ];

  const popularSymbols = [
    { value: "BTCUSDT", label: "Bitcoin (BTC)" },
    { value: "ETHUSDT", label: "Ethereum (ETH)" },
    { value: "BNBUSDT", label: "Binance Coin (BNB)" },
    { value: "SOLUSDT", label: "Solana (SOL)" },
    { value: "ADAUSDT", label: "Cardano (ADA)" }
  ];

  useEffect(() => {
    // Load data when component mounts or when symbol/interval changes
    loadChartData();
    
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Refresh data every minute
    const newInterval = setInterval(() => {
      loadChartData(false);
    }, 60000);
    
    // Store the interval ID
    setRefreshInterval(newInterval);
    
    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      clearInterval(newInterval);
    };
  }, [symbol, interval]);

  const loadChartData = async (showToast = true) => {
    try {
      setLoading(true);
      if (showToast) {
        toast.info(`Loading chart data for ${symbol}...`);
      }
      
      // Get symbol price information
      const symbols = await binanceService.getSymbols();
      const symbolInfo = symbols.find((s) => s.symbol === symbol);
      
      if (symbolInfo) {
        setPriceChange(parseFloat(symbolInfo.priceChangePercent));
      }
      
      // Get current price
      const prices = await binanceService.getPrices();
      if (prices && prices[symbol]) {
        setCurrentPrice(prices[symbol]);
      }
      
      // Get kline data
      const klines = await binanceService.getKlines(symbol, interval);
      
      // Transform kline data for the chart
      const formattedData = klines.map((kline: any) => {
        const date = new Date(kline[0]);
        return {
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
          price: parseFloat(kline[4]), // close price
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          volume: parseFloat(kline[5])
        };
      });
      
      setChartData(formattedData);
    } catch (error) {
      console.error("Failed to load chart data:", error);
      toast.error("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChartData();
  };

  const formatPrice = (price: number) => {
    return price > 1 
      ? price.toFixed(2) 
      : price.toFixed(6);
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Market Chart</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[150px]">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {popularSymbols.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="hover:bg-slate-700">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {timeIntervals.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="hover:bg-slate-700">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex justify-end items-center">
            {currentPrice && (
              <div className="text-right">
                <div className="font-medium text-white">
                  {formatPrice(parseFloat(currentPrice))} USDT
                </div>
                {priceChange !== null && (
                  <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-end`}>
                    <Zap className="h-3 w-3 mr-1" />
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="h-[320px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  tickFormatter={(value) => formatPrice(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    borderColor: '#374151',
                    color: '#e5e7eb'
                  }}
                  formatter={(value: any) => [formatPrice(value), 'Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              {loading ? "Loading chart data..." : "No data available"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;
