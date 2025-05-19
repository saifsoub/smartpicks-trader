
import React from "react";
import ActionCard from "@/components/easyPeasy/ActionCard";
import { TradeAdvice } from "@/hooks/useTradeAdvice";

interface ActionCardGridProps {
  actionableAdvice: TradeAdvice[];
  onAction: (symbol: string, action: string) => void;
}

const ActionCardGrid: React.FC<ActionCardGridProps> = ({ actionableAdvice, onAction }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {actionableAdvice.map((item) => (
        <ActionCard 
          key={item.symbol} 
          symbol={item.symbol} 
          advice={item.action} 
          currentPrice={item.currentPrice} 
          onAction={onAction}
        />
      ))}
    </div>
  );
};

export default ActionCardGrid;
