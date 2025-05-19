
import React from "react";
import ActionCard from "@/components/easyPeasy/ActionCard";
import { TradeAdvice } from "@/hooks/useTradeAdvice";

interface ActionCardGridProps {
  actionableAdvice: TradeAdvice[];
  onAction: (symbol: string, action: string) => void;
}

const ActionCardGrid: React.FC<ActionCardGridProps> = ({ actionableAdvice, onAction }) => {
  // Make sure we have a valid array
  const safeAdvice = Array.isArray(actionableAdvice) ? actionableAdvice : [];
  
  if (safeAdvice.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8 text-center">
        <p className="text-slate-400">No trading advice available yet. Select cryptocurrencies and wait for analysis.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {safeAdvice.map((item) => {
        if (!item || typeof item.symbol !== 'string' || !item.action) {
          return null; // Skip invalid items
        }
        
        return (
          <ActionCard 
            key={item.symbol} 
            symbol={item.symbol} 
            advice={item.action} 
            currentPrice={item.currentPrice} 
            onAction={onAction}
          />
        );
      })}
    </div>
  );
};

export default ActionCardGrid;
