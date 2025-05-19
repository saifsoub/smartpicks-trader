
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, CircleCheck } from "lucide-react";

interface ActionCardProps {
  symbol: string;
  advice: any;
  currentPrice: number;
  onAction: (symbol: string, action: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ symbol, advice, currentPrice, onAction }) => {
  if (!advice) return null; // Don't render if no advice available
  
  const { action, strongSignal, entryPrice, targetPrice, stopPrice, reason } = advice;
  const displaySymbol = symbol.replace('USDT', '');
  
  // Determine card styling based on action
  const getActionColor = () => {
    switch(action) {
      case "BUY": return "bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50";
      case "SELL": return "bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/50";
      default: return "bg-gradient-to-br from-slate-900/30 to-slate-800/20 border-slate-700/50";
    }
  };
  
  const getActionButtonClass = () => {
    switch(action) {
      case "BUY": return "bg-green-700 hover:bg-green-800";
      case "SELL": return "bg-red-700 hover:bg-red-800";
      default: return "bg-blue-700 hover:bg-blue-800";
    }
  };
  
  const getActionIcon = () => {
    switch(action) {
      case "BUY": return <ArrowUp className="w-5 h-5" />;
      case "SELL": return <ArrowDown className="w-5 h-5" />;
      default: return <CircleCheck className="w-5 h-5" />;
    }
  };

  // Format price display
  const formatPrice = (price: string | number) => {
    return typeof price === 'string' 
      ? parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  return (
    <Card className={`${getActionColor()} border shadow-lg`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-white">
            {displaySymbol}
          </CardTitle>
          <div className={`px-3 py-1 rounded-full flex items-center gap-1 ${
            action === "BUY" ? "bg-green-800/50 text-green-300" : 
            action === "SELL" ? "bg-red-800/50 text-red-300" : 
            "bg-blue-800/50 text-blue-300"
          }`}>
            {getActionIcon()}
            <span className="font-bold">{action}</span>
            {strongSignal && <span className="text-xs ml-1">(Strong)</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        <div className="flex justify-between text-sm">
          <span className="text-white">Current price:</span>
          <span className="font-mono text-white">${formatPrice(currentPrice)}</span>
        </div>
        
        <div>
          <h4 className="text-sm uppercase text-white/70 mb-1">Advised Levels</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 rounded p-2 text-center">
              <div className="text-xs text-white/60">Entry</div>
              <div className="font-mono text-white">${formatPrice(entryPrice)}</div>
            </div>
            <div className="bg-slate-800/40 rounded p-2 text-center">
              <div className="text-xs text-white/60">Target</div>
              <div className="font-mono text-green-300">${formatPrice(targetPrice)}</div>
            </div>
            <div className="bg-slate-800/40 rounded p-2 text-center">
              <div className="text-xs text-white/60">Stop</div>
              <div className="font-mono text-red-300">${formatPrice(stopPrice)}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded p-3">
          <h4 className="text-sm uppercase text-white/70 mb-1">Reasoning</h4>
          <ul className="list-disc list-inside text-sm text-white/80">
            {reason.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className={`w-full ${getActionButtonClass()}`}
          onClick={() => onAction(symbol, action)}
        >
          {action === "BUY" 
            ? `Buy ${displaySymbol} at $${formatPrice(entryPrice)}` 
            : action === "SELL" 
              ? `Sell ${displaySymbol} at $${formatPrice(entryPrice)}`
              : `Hold ${displaySymbol}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ActionCard;
