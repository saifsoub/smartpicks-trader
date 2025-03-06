
import React from "react";
import { Brain, Zap, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import notificationService from "@/services/notificationService";
import { Progress } from "@/components/ui/progress";

interface AIInsightsBannerProps {
  marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }>;
  mainInsight: string;
}

const AIInsightsBanner: React.FC<AIInsightsBannerProps> = ({ marketSentiment, mainInsight }) => {
  // Calculate average sentiment score for overall market mood
  const sentimentScores = Object.values(marketSentiment).map(item => item.score);
  const averageSentiment = sentimentScores.length > 0 
    ? sentimentScores.reduce((acc, score) => acc + score, 0) / sentimentScores.length 
    : 50;
  
  // Group sentiment by trend
  const bullish = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'bullish');
  const bearish = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'bearish');
  const neutral = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'neutral');
  
  const getMarketMood = (score: number) => {
    if (score >= 70) return "Strongly Bullish";
    if (score >= 60) return "Bullish";
    if (score >= 45) return "Slightly Bullish";
    if (score >= 40) return "Neutral";
    if (score >= 30) return "Slightly Bearish";
    if (score >= 20) return "Bearish";
    return "Strongly Bearish";
  };
  
  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-purple-900/40 border border-blue-800 flex items-start">
      <Brain className="h-6 w-6 text-blue-300 mr-3 mt-1 flex-shrink-0" />
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-medium text-blue-200">AI Trading Assistant</h2>
          <div className="text-sm text-blue-300 flex items-center">
            <span className="font-semibold mr-1">Market Mood:</span> 
            <span className={`
              ${averageSentiment >= 60 ? 'text-green-300' : 
                averageSentiment <= 40 ? 'text-red-300' : 'text-blue-200'}
            `}>
              {getMarketMood(averageSentiment)}
            </span>
          </div>
        </div>
        
        <p className="text-blue-100 mb-3">
          {mainInsight}
        </p>
        
        <div className="w-full bg-blue-950/50 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full ${
              averageSentiment >= 60 ? 'bg-gradient-to-r from-green-500 to-green-300' : 
              averageSentiment <= 40 ? 'bg-gradient-to-r from-red-500 to-red-300' : 
              'bg-gradient-to-r from-blue-500 to-blue-300'
            }`}
            style={{ width: `${averageSentiment}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="bg-green-900/20 border border-green-800/50 rounded p-2">
            <div className="text-xs text-green-300 mb-1 flex justify-between">
              <span>Bullish</span>
              <span>{bullish.length}/{Object.keys(marketSentiment).length}</span>
            </div>
            <div className="space-y-1">
              {bullish.map(([symbol, data]) => (
                <div key={symbol} className="flex justify-between text-xs">
                  <span className="text-green-200">{symbol}</span>
                  <span className="text-green-300">{data.score}%</span>
                </div>
              ))}
              {bullish.length === 0 && (
                <div className="text-xs text-green-200/50 italic">No bullish assets</div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-800/50 rounded p-2">
            <div className="text-xs text-blue-300 mb-1 flex justify-between">
              <span>Neutral</span>
              <span>{neutral.length}/{Object.keys(marketSentiment).length}</span>
            </div>
            <div className="space-y-1">
              {neutral.map(([symbol, data]) => (
                <div key={symbol} className="flex justify-between text-xs">
                  <span className="text-blue-200">{symbol}</span>
                  <span className="text-blue-300">{data.score}%</span>
                </div>
              ))}
              {neutral.length === 0 && (
                <div className="text-xs text-blue-200/50 italic">No neutral assets</div>
              )}
            </div>
          </div>
          
          <div className="bg-red-900/20 border border-red-800/50 rounded p-2">
            <div className="text-xs text-red-300 mb-1 flex justify-between">
              <span>Bearish</span>
              <span>{bearish.length}/{Object.keys(marketSentiment).length}</span>
            </div>
            <div className="space-y-1">
              {bearish.map(([symbol, data]) => (
                <div key={symbol} className="flex justify-between text-xs">
                  <span className="text-red-200">{symbol}</span>
                  <span className="text-red-300">{data.score}%</span>
                </div>
              ))}
              {bearish.length === 0 && (
                <div className="text-xs text-red-200/50 italic">No bearish assets</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-blue-800/50 text-blue-100 border-blue-700 hover:bg-blue-800"
                  onClick={() => {
                    toast.success("AI Assistant actively scanning for profitable opportunities");
                    notificationService.sendMarketAnalysisAlert("BTC", "Bullish divergence detected");
                  }}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Get AI Recommendations
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate high-profit trading recommendations based on current market conditions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-indigo-800/50 text-indigo-100 border-indigo-700 hover:bg-indigo-800"
            onClick={() => {
              toast.info("Advanced market analysis initialized");
            }}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Advanced Analysis
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
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
