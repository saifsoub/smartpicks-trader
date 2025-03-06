
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, BarChart4, MessageSquare, 
  AreaChart, Gauge, Bot, TrendingUp, 
  AlertTriangle, HelpCircle 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Analysis of price action, volume, and technical indicators</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-slate-200">{aiInsights.technicalAnalysis}</p>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                <span>Buy Signal Strength</span>
                <span>{marketSentiment["BTC"]?.score || 50}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${marketSentiment["BTC"]?.score || 50}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center mb-2">
              <MessageSquare className="h-5 w-5 text-green-300 mr-2" />
              <h3 className="text-lg font-medium text-green-100">News Sentiment</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Analysis of news, social media, and market sentiment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-slate-200">{aiInsights.newsSentiment}</p>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Price predictions based on machine learning models</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-slate-200">{aiInsights.prediction}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="relative">
                <Gauge className="w-full h-12 text-blue-300" />
                <div className="absolute top-7 left-0 right-0 text-center text-xs font-medium text-blue-200">24h</div>
              </div>
              <div className="relative">
                <Gauge className="w-full h-12 text-purple-300" />
                <div className="absolute top-7 left-0 right-0 text-center text-xs font-medium text-purple-200">7d</div>
              </div>
              <div className="relative">
                <Gauge className="w-full h-12 text-green-300" />
                <div className="absolute top-7 left-0 right-0 text-center text-xs font-medium text-green-200">30d</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Strategy Recommendations */}
        <div className="mt-4 p-4 rounded-lg bg-indigo-900/20 border border-indigo-800">
          <div className="flex items-center mb-3">
            <Bot className="h-5 w-5 text-indigo-300 mr-2" />
            <h3 className="text-lg font-medium text-indigo-100">AI Strategy Recommendations</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex bg-slate-800/70 rounded-lg p-3 border border-slate-700">
              <div className="flex-shrink-0 mr-3">
                <div className="h-10 w-10 rounded-full bg-green-700/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-200">Long BTC with Bollinger Breakout</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Price breaking above upper Bollinger Band with increasing volume suggests strong momentum.
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-slate-800">
                    Apply Strategy
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-800/70 rounded-lg p-3 border border-slate-700">
              <div className="flex-shrink-0 mr-3">
                <div className="h-10 w-10 rounded-full bg-yellow-700/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-yellow-200">Reduce ETH exposure</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ETH showing bearish divergence on RSI with decreasing trading volume. Consider reducing position size.
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-slate-800">
                    Review Position
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketInsightsPanel;
