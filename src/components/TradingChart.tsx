
import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Sample data for the chart
const data = [
  { time: "00:00", price: 65400 },
  { time: "04:00", price: 65200 },
  { time: "08:00", price: 65800 },
  { time: "12:00", price: 66100 },
  { time: "16:00", price: 66500 },
  { time: "20:00", price: 66700 },
  { time: "24:00", price: 66789 },
];

const TradingChart: React.FC = () => {
  return (
    <div className="h-[400px] w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3182ce" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#3182ce", stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
