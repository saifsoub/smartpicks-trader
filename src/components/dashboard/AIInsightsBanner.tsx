
import React from "react";
import { Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import notificationService from "@/services/notificationService";

interface AIInsightsBannerProps {
  marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }>;
  mainInsight: string;
}

const AIInsightsBanner: React.FC<AIInsightsBannerProps> = ({ marketSentiment, mainInsight }) => {
  return (
    <div className="mb-6 p-4 rounded-lg bg-blue-900/20 border border-blue-800 flex items-start">
      <Brain className="h-6 w-6 text-blue-300 mr-3 mt-1 flex-shrink-0" />
      <div>
        <h2 className="text-lg font-medium text-blue-200 mb-1">AI Trading Assistant</h2>
        <p className="text-blue-100">
          {mainInsight}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(marketSentiment).map(symbol => {
            const sentiment = marketSentiment[symbol];
            if (sentiment.score > 65) {
              return (
                <Badge key={symbol} className="bg-green-700 text-white">
                  {symbol} Bullish
                </Badge>
              );
            } else if (sentiment.score < 35) {
              return (
                <Badge key={symbol} className="bg-red-700 text-white">
                  {symbol} Bearish
                </Badge>
              );
            }
            return null;
          })}
          <Badge className="bg-yellow-700 text-white">Market Volatility: Medium</Badge>
        </div>
        <div className="mt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-blue-800/50 text-blue-100 border-blue-700 hover:bg-blue-800"
                  onClick={() => {
                    toast.success("AI Assistant actively monitoring market conditions");
                    notificationService.sendMarketAnalysisAlert("BTC", "Bullish divergence detected on 4h chart");
                  }}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Get AI Recommendations
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate personalized trading recommendations based on current market conditions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

// Badge component for the AI insights
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
};

export default AIInsightsBanner;
