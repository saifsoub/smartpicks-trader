
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, BarChart4, MessageSquare, 
  AreaChart, Bot, TrendingUp, 
  HelpCircle, ArrowUpRight, ArrowUp, ArrowDownRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface MarketInsightsPanelProps {
  aiInsights: {
    mainInsight: string;
    technicalAnalysis: string;
    newsSentiment: string;
    prediction: string;
  };
  marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }>;
}

const MarketInsightsPanel: React.FC<MarketInsightsPanelProps> = ({ 
  aiInsights, 
  marketSentiment 
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-300" />
          AI Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center mb-2">
              <BarChart4 className="h-5 w-5 text-blue-300 mr-2" />
              <h3 className="text-lg font-medium text-blue-100">Technical Analysis</h3>
            </div>
            <p className="text-slate-200 text-sm">{aiInsights.technicalAnalysis}</p>
            <div className="mt-3 p-2 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-300">BTC Signal</span>
                <span className="text-sm text-green-300 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Buy
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center mb-2">
              <MessageSquare className="h-5 w-5 text-green-300 mr-2" />
              <h3 className="text-lg font-medium text-green-100">Sentiment</h3>
            </div>
            <p className="text-slate-200 text-sm">{aiInsights.newsSentiment}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-green-900/30 p-2 rounded text-center">
                <div className="text-xs text-green-400">Positive</div>
                <div className="text-sm font-bold text-green-300">68%</div>
              </div>
              <div className="bg-yellow-900/30 p-2 rounded text-center">
                <div className="text-xs text-yellow-400">Neutral</div>
                <div className="text-sm font-bold text-yellow-300">22%</div>
              </div>
              <div className="bg-red-900/30 p-2 rounded text-center">
                <div className="text-xs text-red-400">Negative</div>
                <div className="text-sm font-bold text-red-300">10%</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center mb-2">
              <AreaChart className="h-5 w-5 text-yellow-300 mr-2" />
              <h3 className="text-lg font-medium text-yellow-100">AI Predictions</h3>
            </div>
            <p className="text-slate-200 text-sm">{aiInsights.prediction}</p>
            <div className="mt-3 p-2 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-300">Price Target</span>
                <span className="text-sm text-green-300 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  $69,000
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Strategy Recommendations */}
        <div className="mt-4 p-4 rounded-lg bg-indigo-900/20 border border-indigo-800">
          <div className="flex items-center mb-3">
            <Bot className="h-5 w-5 text-indigo-300 mr-2" />
            <h3 className="text-lg font-medium text-indigo-100">AI Trading Strategies</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>AI-recommended trading strategies based on current market conditions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-3">
            <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-green-200 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1.5" /> 
                  Long BTC
                </h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7 bg-slate-800"
                  onClick={() => toast.success("Strategy applied")}
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Bollinger Breakout with high volume suggests strong upward momentum.
              </p>
            </div>
            
            <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-red-200 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1.5" /> 
                  Reduce ETH
                </h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7 bg-slate-800"
                  onClick={() => toast.success("Position reviewed")}
                >
                  Review
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                RSI divergence with decreasing volume suggests potential trend reversal.
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <Button 
              className="w-full bg-indigo-700 hover:bg-indigo-800"
              onClick={() => toast.success("Generating custom strategy")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Custom Strategy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketInsightsPanel;
