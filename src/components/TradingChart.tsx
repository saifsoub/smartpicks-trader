
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import ChartHeader from "./trading-chart/ChartHeader";
import ChartControls from "./trading-chart/ChartControls";
import PriceChart from "./trading-chart/PriceChart";
import { useChartData } from "@/hooks/useChartData";
import { timeIntervals, popularSymbols } from "./trading-chart/tradingChartConstants";

interface TradingChartProps {
  symbol?: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol: initialSymbol = "BTCUSDT" }) => {
  const {
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
  } = useChartData(initialSymbol, "1h");

  const handleRefresh = () => {
    loadChartData();
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <ChartHeader loading={loading} onRefresh={handleRefresh} />
      <CardContent className="pt-4">
        <ChartControls
          symbol={symbol}
          onSymbolChange={setSymbol}
          interval={interval}
          onIntervalChange={setInterval}
          currentPrice={currentPrice}
          priceChange={priceChange}
          popularSymbols={popularSymbols}
          timeIntervals={timeIntervals}
          formatPrice={formatPrice}
        />
        <PriceChart
          chartData={chartData}
          loading={loading}
          formatPrice={formatPrice}
        />
      </CardContent>
    </Card>
  );
};

export default TradingChart;
