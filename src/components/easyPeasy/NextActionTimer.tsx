
import React from "react";
import { Clock } from "lucide-react";
import { TradeAdvice } from "@/hooks/useTradeAdvice";

interface NextActionTimerProps {
  actionableAdvice: TradeAdvice[];
}

const NextActionTimer: React.FC<NextActionTimerProps> = ({ actionableAdvice }) => {
  // Make sure we have a valid array
  const safeAdvice = Array.isArray(actionableAdvice) ? actionableAdvice : [];
  
  // No advice or empty array
  if (safeAdvice.length === 0) {
    return (
      <div className="text-slate-400 text-sm flex items-center">
        <Clock className="h-4 w-4 mr-2 text-slate-500" />
        No upcoming actions scheduled. Please select symbols to get trade advice.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeAdvice.map((item) => {
        if (!item || typeof item.symbol !== 'string' || !item.action) {
          return null; // Skip invalid items
        }
        
        return (
          <div key={item.symbol} className="flex justify-between items-center p-3 rounded-md bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center">
              <span className="font-mono mr-2">{item.symbol.replace('USDT', '')}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                item.action.action === 'BUY' ? 'bg-green-900/40 text-green-300' : 
                item.action.action === 'SELL' ? 'bg-red-900/40 text-red-300' : 
                'bg-slate-700/40 text-slate-300'
              }`}>
                {item.action.action}
              </span>
            </div>
            <div className="flex items-center text-slate-300">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              <span>{item.action.actionTime || 'Pending'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NextActionTimer;
