
import React from "react";
import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SymbolSelector from "@/components/easyPeasy/SymbolSelector";

interface SymbolSelectionCardProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
}

const SymbolSelectionCard: React.FC<SymbolSelectionCardProps> = ({ 
  selectedSymbols, 
  onSymbolsChange 
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-400" />
          Select Your Symbols
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SymbolSelector 
          selectedSymbols={selectedSymbols} 
          onChange={onSymbolsChange} 
        />
        <p className="text-slate-400 text-sm mt-2">
          Select up to 5 cryptocurrencies to get simple trading advice
        </p>
      </CardContent>
    </Card>
  );
};

export default SymbolSelectionCard;
