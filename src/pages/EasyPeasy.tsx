
import React, { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { useTradeAdvice } from "@/hooks/useTradeAdvice";
import EasyPeasyHeader from "@/components/easyPeasy/EasyPeasyHeader";
import SymbolSelectionCard from "@/components/easyPeasy/SymbolSelectionCard";
import ActionCardGrid from "@/components/easyPeasy/ActionCardGrid";
import NextActionTimerCard from "@/components/easyPeasy/NextActionTimerCard";

const EasyPeasy: React.FC = () => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const { loading, actionableAdvice, handleRefresh } = useTradeAdvice(selectedSymbols);
  
  const handleSymbolsChange = (newSymbols: string[]) => {
    setSelectedSymbols(newSymbols);
  };
  
  const handleAction = (symbol: string, action: string) => {
    // In simulation mode, just show what would happen
    toast.success(`Simulated ${action} order for ${symbol}`);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <EasyPeasyHeader loading={loading} onRefresh={handleRefresh} />
        
        <div className="mb-6">
          <SymbolSelectionCard 
            selectedSymbols={selectedSymbols} 
            onSymbolsChange={handleSymbolsChange} 
          />
        </div>
        
        <ActionCardGrid 
          actionableAdvice={actionableAdvice}
          onAction={handleAction}
        />
        
        <div className="mb-6">
          <NextActionTimerCard actionableAdvice={actionableAdvice} />
        </div>
      </div>
    </div>
  );
};

export default EasyPeasy;
