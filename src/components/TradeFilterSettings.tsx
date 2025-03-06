
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, Save, AlertTriangle, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TradeFilterSettings: React.FC = () => {
  const [minConfirmations, setMinConfirmations] = useState(2);
  const [minRiskRewardRatio, setMinRiskRewardRatio] = useState(1.5);
  const [marketConditionFilter, setMarketConditionFilter] = useState("all");
  const [useVolatilityFilter, setUseVolatilityFilter] = useState(true);
  const [filteredAssets, setFilteredAssets] = useState(true);
  const [minSuccessProbability, setMinSuccessProbability] = useState(60);
  const [useNewsFilter, setUseNewsFilter] = useState(true);
  
  const saveFilters = () => {
    // In a real implementation, this would update trading service with the new filters
    toast.success("Trade filters have been updated");
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-purple-400 mr-2" />
            <CardTitle className="text-white">Trade Filters</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Filter out low-quality trades to improve win rate. More filters mean fewer but higher quality trades.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-sm text-slate-400">
              Minimum Strategy Confirmations: {minConfirmations}
            </Label>
          </div>
          <Slider 
            value={[minConfirmations]} 
            min={1} 
            max={4} 
            step={1} 
            onValueChange={(values) => setMinConfirmations(values[0])}
          />
          <p className="text-xs text-slate-500 mt-1">
            Requires at least {minConfirmations} different strategies to confirm a trade signal
          </p>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-sm text-slate-400">
              Minimum Risk/Reward Ratio: {minRiskRewardRatio.toFixed(1)}
            </Label>
          </div>
          <Slider 
            value={[minRiskRewardRatio * 10]} 
            min={10} 
            max={40} 
            step={5} 
            onValueChange={(values) => setMinRiskRewardRatio(values[0] / 10)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Only take trades with potential reward at least {minRiskRewardRatio.toFixed(1)}x the risk
          </p>
        </div>
        
        <div>
          <Label htmlFor="market-condition" className="text-sm text-slate-400">
            Market Condition Filter
          </Label>
          <Select value={marketConditionFilter} onValueChange={setMarketConditionFilter}>
            <SelectTrigger id="market-condition" className="bg-slate-800 border-slate-700 text-white mt-1">
              <SelectValue placeholder="Select market condition" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">Trade in All Conditions</SelectItem>
              <SelectItem value="bullish">Only Bullish Markets</SelectItem>
              <SelectItem value="bearish">Only Bearish Markets</SelectItem>
              <SelectItem value="ranging">Only Ranging Markets</SelectItem>
              <SelectItem value="trending">Only Trending Markets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-sm text-slate-400">
              Minimum Success Probability: {minSuccessProbability}%
            </Label>
          </div>
          <Slider 
            value={[minSuccessProbability]} 
            min={40} 
            max={90} 
            step={5} 
            onValueChange={(values) => setMinSuccessProbability(values[0])}
          />
          {minSuccessProbability > 75 && (
            <div className="flex items-center text-xs text-amber-400 mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Very high threshold may result in missed opportunities
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="volatility-filter" className="text-sm text-slate-400">
              Volatility Filter
              <span className="block text-xs text-slate-500">Avoid trading during extreme volatility</span>
            </Label>
            <Switch 
              id="volatility-filter" 
              checked={useVolatilityFilter}
              onCheckedChange={setUseVolatilityFilter}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="asset-filter" className="text-sm text-slate-400">
              Filtered Asset List
              <span className="block text-xs text-slate-500">Only trade pre-selected high-quality assets</span>
            </Label>
            <Switch 
              id="asset-filter" 
              checked={filteredAssets}
              onCheckedChange={setFilteredAssets}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="news-filter" className="text-sm text-slate-400">
              News Filter
              <span className="block text-xs text-slate-500">Avoid trading during major news events</span>
            </Label>
            <Switch 
              id="news-filter" 
              checked={useNewsFilter}
              onCheckedChange={setUseNewsFilter}
            />
          </div>
        </div>
        
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={saveFilters}
        >
          <Save className="mr-2 h-4 w-4" />
          Update Trade Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradeFilterSettings;
