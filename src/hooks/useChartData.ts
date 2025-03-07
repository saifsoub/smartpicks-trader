
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Fix: Change the type from NodeJS.Timeout to number as window.setInterval returns a number
  const refreshIntervalRef = useRef<number | null>(null);

  // Define loadChartData with an optional parameter
  const loadChartData = useCallback(async (showToast = true) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      if (showToast) {
        toast.info(`Loading chart data for ${symbol}...`);
      }
      
      try {
        const symbols = await binanceService.getSymbols();
        const symbolInfo = symbols.find((s) => s.symbol === symbol);
        
        if (symbolInfo) {
          setPriceChange(parseFloat(symbolInfo.priceChangePercent));
        }
      } catch (error) {
        console.error("Failed to load symbol info:", error);
        // Continue with other data fetching
      }
      
      try {
        const prices = await binanceService.getPrices();
        if (prices && prices[symbol]) {
          setCurrentPrice(prices[symbol]);
        }
      } catch (error) {
        console.error("Failed to load prices:", error);
        // Continue with klines data fetching
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
      setErrorMessage(error instanceof Error ? error.message : "Failed to load chart data");
      toast.error(error instanceof Error ? error.message : "Failed to load chart data");
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
    
    // Define the refresh function that calls loadChartData without showing toast
    const refreshData = () => {
      loadChartData(false);
    };
    
    // Set up the interval - properly using global window.setInterval
    refreshIntervalRef.current = window.setInterval(refreshData, 60000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadChartData]);

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
    errorMessage,
    loadChartData,
    formatPrice
  };
};
