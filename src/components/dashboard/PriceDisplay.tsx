
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import TradingChart from "@/components/TradingChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceDisplayProps {
  btcPrice: string;
  btcChange: number;
  btcPriceHistory?: { time: string; price: number }[];
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  btcPrice, 
  btcChange,
  btcPriceHistory 
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-white">BTC/USDT</CardTitle>
            <Tabs defaultValue="4h" className="ml-6">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="1h">1H</TabsTrigger>
                <TabsTrigger value="4h">4H</TabsTrigger>
                <TabsTrigger value="1d">1D</TabsTrigger>
                <TabsTrigger value="1w">1W</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center">
            <span className="text-green-300 mr-2 text-lg font-medium">${btcPrice}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${btcChange >= 0 ? 'bg-green-400/10 text-green-300' : 'bg-red-400/10 text-red-300'}`}>
              {btcChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TradingChart />
      </CardContent>
    </Card>
  );
};

export default PriceDisplay;
