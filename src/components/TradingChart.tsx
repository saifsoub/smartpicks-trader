
import React from "react";

interface TradingChartProps {
  symbol?: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol = "BTCUSDT" }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-white h-[400px]">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="font-medium">{symbol} Chart</h3>
        <div className="text-slate-400 text-sm">
          Trading Chart Placeholder - Will be replaced with actual chart
        </div>
      </div>
      <div className="h-[90%] flex items-center justify-center text-slate-500">
        <p>Interactive trading chart will be displayed here</p>
      </div>
    </div>
  );
};

export default TradingChart;
