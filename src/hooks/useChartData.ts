
import { useState, useEffect, useCallback, useRef } from "react";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";

export interface KlineData {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export const useChartData = (initialSymbol: string, initialInterval: string) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState(initialInterval);
  const [chartData, setChartData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadChartData = useCallback(async (showToast = true) => {
    try {
      setLoading(true);
      if (showToast) {
        toast.info(`Loading chart data for ${symbol}...`);
      }
      
      const symbols = await binanceService.getSymbols();
      const symbolInfo = symbols.find((s) => s.symbol === symbol);
      
      if (symbolInfo) {
        setPriceChange(parseFloat(symbolInfo.priceChangePercent));
      }
      
      const prices = await binanceService.getPrices();
      if (prices && prices[symbol]) {
        setCurrentPrice(prices[symbol]);
      }
      
      const klines = await binanceService.getKlines(symbol, interval);
      
      const formattedData = klines.map((kline: any) => {
        const date = new Date(kline[0]);
        return {
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
          price: parseFloat(kline[4]),
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
  }, [symbol, interval]);

  useEffect(() => {
    loadChartData();
    
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Create a new interval and store it properly
    const intervalId = setInterval(() => {
      loadChartData(false);
    }, 60000);
    
    // Store the interval ID in the ref
    refreshIntervalRef.current = intervalId;
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadChartData, symbol, interval]);

  const formatPrice = (price: number) => {
    return price > 1 
      ? price.toFixed(2) 
      : price.toFixed(6);
  };

  return {
    symbol,
    setSymbol,
    interval,
    setInterval,
    chartData,
    loading,
    currentPrice,
    priceChange,
    loadChartData,
    formatPrice
  };
};
