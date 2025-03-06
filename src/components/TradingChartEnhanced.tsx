
import React, { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Sample data for the chart
const data = [
  { time: "00:00", price: 65400, volume: 120, rsi: 45 },
  { time: "04:00", price: 65200, volume: 85, rsi: 42 },
  { time: "08:00", price: 65800, volume: 150, rsi: 48 },
  { time: "12:00", price: 66100, volume: 180, rsi: 55 },
  { time: "16:00", price: 66500, volume: 210, rsi: 62 },
  { time: "20:00", price: 66700, volume: 190, rsi: 68 },
  { time: "24:00", price: 66789, volume: 220, rsi: 72 },
];

// Calculate Bollinger Bands
const calculateBollingerBands = (data: any[], period = 5, multiplier = 2) => {
  const prices = data.map(item => item.price);
  
  // Calculate SMA
  const sma = prices.map((_, index) => {
    if (index < period - 1) return null;
    const slice = prices.slice(index - period + 1, index + 1);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  });
  
  // Calculate Standard Deviation
  const stdDev = sma.map((mean, index) => {
    if (mean === null) return null;
    const slice = prices.slice(index - period + 1, index + 1);
    const squaredDiffs = slice.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    return Math.sqrt(variance);
  });
  
  // Calculate Upper and Lower Bands
  return data.map((item, index) => {
    const mean = sma[index];
    const deviation = stdDev[index];
    
    return {
      ...item,
      sma: mean,
      upperBand: mean !== null ? mean + (multiplier * deviation) : null,
      lowerBand: mean !== null ? mean - (multiplier * deviation) : null,
    };
  });
};

const dataWithBands = calculateBollingerBands(data);

type Indicator = "none" | "bollinger" | "rsi" | "volume";

const TradingChartEnhanced: React.FC = () => {
  const [indicators, setIndicators] = useState<Indicator[]>(["none"]);

  const handleIndicatorChange = (value: string[]) => {
    // Ensure at least one indicator is selected
    if (value.length === 0) return;
    setIndicators(value as Indicator[]);
  };
  
  return (
    <div className="h-[400px] w-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-300">Technical Indicators</div>
        <ToggleGroup type="multiple" value={indicators} onValueChange={handleIndicatorChange}>
          <ToggleGroupItem value="none" aria-label="Toggle none">None</ToggleGroupItem>
          <ToggleGroupItem value="bollinger" aria-label="Toggle Bollinger Bands">Bollinger</ToggleGroupItem>
          <ToggleGroupItem value="rsi" aria-label="Toggle RSI">RSI</ToggleGroupItem>
          <ToggleGroupItem value="volume" aria-label="Toggle Volume">Volume</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={indicators.includes("bollinger") ? dataWithBands : data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: "#a0aec0" }} 
            tickLine={{ stroke: "#4a5568" }}
            axisLine={{ stroke: "#4a5568" }}
          />
          <YAxis 
            domain={['dataMin - 500', 'dataMax + 500']}
            tick={{ fill: "#a0aec0" }} 
            tickLine={{ stroke: "#4a5568" }}
            axisLine={{ stroke: "#4a5568" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#1a202c", 
              border: "1px solid #2d3748",
              color: "#fff"
            }}
            labelStyle={{ color: "#a0aec0" }}
            formatter={(value) => [`$${value}`, "Price"]}
          />
          <Legend />
          
          {/* Support and resistance levels */}
          <ReferenceLine y={65500} stroke="#e53e3e" strokeDasharray="3 3" label={{ position: "right", value: "Support", fill: "#e53e3e" }} />
          <ReferenceLine y={67000} stroke="#38a169" strokeDasharray="3 3" label={{ position: "right", value: "Resistance", fill: "#38a169" }} />
          
          {/* Main price line */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3182ce" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#3182ce", stroke: "#fff" }}
          />
          
          {/* Bollinger Bands */}
          {indicators.includes("bollinger") && (
            <>
              <Line 
                type="monotone" 
                dataKey="sma" 
                stroke="#805ad5" 
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
              />
              <Line 
                type="monotone" 
                dataKey="upperBand" 
                stroke="#805ad5" 
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
              />
              <Line 
                type="monotone" 
                dataKey="lowerBand" 
                stroke="#805ad5" 
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChartEnhanced;
