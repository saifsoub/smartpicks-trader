
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface KlineData {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface PriceChartProps {
  chartData: KlineData[];
  loading: boolean;
  formatPrice: (price: number) => string;
}

const PriceChart: React.FC<PriceChartProps> = ({ chartData, loading, formatPrice }) => {
  return (
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
  );
};

export default PriceChart;
