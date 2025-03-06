
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskManagementToolsProps {
  currentPrice?: number;
}

const RiskManagementTools: React.FC<RiskManagementToolsProps> = ({ 
  currentPrice = 66500 
}) => {
  const [stopLossPrice, setStopLossPrice] = useState<number | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | null>(null);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(1000);
  const [maxLoss, setMaxLoss] = useState<number>(0);
  const [potentialProfit, setPotentialProfit] = useState<number>(0);
  
  // Calculate risk-reward ratio when stop loss or take profit changes
  const calculateRiskReward = (stopLoss: number | null, takeProfit: number | null) => {
    if (!stopLoss || !takeProfit || !currentPrice) return 0;
    
    const risk = Math.abs(currentPrice - stopLoss);
    const reward = Math.abs(takeProfit - currentPrice);
    
    if (risk === 0) return 0;
    return parseFloat((reward / risk).toFixed(2));
  };
  
  // Calculate max loss and potential profit based on position size
  const calculateProfitLoss = (posSize: number, stopLoss: number | null, takeProfit: number | null) => {
    if (!currentPrice || !stopLoss || !takeProfit) {
      setMaxLoss(0);
      setPotentialProfit(0);
      return;
    }
    
    // Calculate how many units the position size can buy
    const units = posSize / currentPrice;
    
    // Calculate max loss and potential profit
    const loss = Math.abs(units * (currentPrice - stopLoss));
    const profit = Math.abs(units * (takeProfit - currentPrice));
    
    setMaxLoss(parseFloat(loss.toFixed(2)));
    setPotentialProfit(parseFloat(profit.toFixed(2)));
  };
  
  const handleStopLossChange = (value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setStopLossPrice(numValue);
    
    if (numValue && takeProfitPrice) {
      const ratio = calculateRiskReward(numValue, takeProfitPrice);
      setRiskRewardRatio(ratio);
      calculateProfitLoss(positionSize, numValue, takeProfitPrice);
    }
  };
  
  const handleTakeProfitChange = (value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setTakeProfitPrice(numValue);
    
    if (numValue && stopLossPrice) {
      const ratio = calculateRiskReward(stopLossPrice, numValue);
      setRiskRewardRatio(ratio);
      calculateProfitLoss(positionSize, stopLossPrice, numValue);
    }
  };
  
  const handlePositionSizeChange = (value: string) => {
    const numValue = parseFloat(value);
    setPositionSize(isNaN(numValue) ? 0 : numValue);
    calculateProfitLoss(isNaN(numValue) ? 0 : numValue, stopLossPrice, takeProfitPrice);
  };
  
  const applyRiskManagement = () => {
    if (!stopLossPrice || !takeProfitPrice) {
      toast.error("Please set both stop loss and take profit levels");
      return;
    }
    
    toast.success("Risk management parameters have been set");
    // In a real app, this would update the trading bot's parameters
  };
  
  const getRiskRatingColor = (ratio: number) => {
    if (ratio < 1) return "text-red-500";
    if (ratio < 2) return "text-yellow-500";
    return "text-green-500";
  };
  
  const getRiskRating = (ratio: number) => {
    if (ratio < 1) return "Poor";
    if (ratio < 2) return "Fair";
    if (ratio < 3) return "Good";
    return "Excellent";
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-400 mr-2" />
            <CardTitle className="text-white">Risk Management</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Set stop-loss and take-profit levels to manage risk. Aim for a risk-reward ratio of at least 1:2.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-md flex items-center text-sm">
          <TrendingUp className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
          <div className="text-blue-200">
            Current BTC Price: <span className="font-bold">${currentPrice.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stop-loss" className="text-slate-200 flex items-center">
              <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
              Stop Loss ($)
            </Label>
            <Input 
              id="stop-loss" 
              type="number" 
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="Set stop loss price"
              value={stopLossPrice || ""}
              onChange={(e) => handleStopLossChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="take-profit" className="text-slate-200 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              Take Profit ($)
            </Label>
            <Input 
              id="take-profit" 
              type="number" 
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="Set take profit price"
              value={takeProfitPrice || ""}
              onChange={(e) => handleTakeProfitChange(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="position-size" className="text-slate-200">
            Position Size (USDT)
          </Label>
          <Input 
            id="position-size" 
            type="number" 
            className="bg-slate-800 border-slate-700 text-white mt-1"
            placeholder="Enter position size"
            value={positionSize}
            onChange={(e) => handlePositionSizeChange(e.target.value)}
          />
        </div>
        
        <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Risk/Reward Ratio</span>
            <span className={`text-sm font-bold ${getRiskRatingColor(riskRewardRatio)}`}>
              1:{riskRewardRatio} ({getRiskRating(riskRewardRatio)})
            </span>
          </div>
          <Slider 
            value={[riskRewardRatio * 20]} 
            max={100} 
            step={1} 
            disabled 
            className="mt-2"
          />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-sm text-red-400">Max Loss</div>
              <div className="text-lg font-bold text-red-300">
                ${maxLoss.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-400">Potential Profit</div>
              <div className="text-lg font-bold text-green-300">
                ${potentialProfit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {riskRewardRatio < 1 && stopLossPrice && takeProfitPrice && (
          <div className="flex items-center p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
            Risk is higher than reward. Consider adjusting your levels.
          </div>
        )}
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={applyRiskManagement}
          disabled={!stopLossPrice || !takeProfitPrice}
        >
          <Shield className="mr-2 h-4 w-4" />
          Apply Risk Management
        </Button>
      </CardContent>
    </Card>
  );
};

export default RiskManagementTools;
