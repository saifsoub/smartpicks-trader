
import React, { useState } from "react";
import { Brain, Zap, TrendingUp, AlertTriangle, ChevronRight, ArrowUp, ArrowDown, BarChart2, Cpu, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import notificationService from "@/services/notificationService";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIInsightsBannerProps {
  marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }>;
  mainInsight: string;
}

const AIInsightsBanner: React.FC<AIInsightsBannerProps> = ({ marketSentiment, mainInsight }) => {
  const [insightView, setInsightView] = useState<"summary" | "detailed">("summary");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Calculate average sentiment score for overall market mood
  const sentimentScores = Object.values(marketSentiment).map(item => item.score);
  const averageSentiment = sentimentScores.length > 0 
    ? sentimentScores.reduce((acc, score) => acc + score, 0) / sentimentScores.length 
    : 50;
  
  // Group sentiment by trend
  const bullish = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'bullish');
  const bearish = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'bearish');
  const neutral = Object.entries(marketSentiment).filter(([_, data]) => data.trend === 'neutral');
  
  // Correlation data for market analysis (sample data)
  const correlationData = {
    'BTC-ETH': 0.92,
    'BTC-SOL': 0.78,
    'ETH-SOL': 0.85,
    'BTC-BNB': 0.76,
    'ETH-BNB': 0.68
  };
  
  // Market signals with confidence scores
  const marketSignals = [
    { name: 'RSI Divergence', signal: 'BUY', confidence: 87, timeframe: '4h' },
    { name: 'MACD Crossover', signal: 'HOLD', confidence: 65, timeframe: '1h' },
    { name: 'Volume Profile', signal: 'BUY', confidence: 82, timeframe: '1d' },
    { name: 'Support Level', signal: 'STRONG', confidence: 91, timeframe: '4h' }
  ];
  
  const getMarketMood = (score: number) => {
    if (score >= 70) return "Strongly Bullish";
    if (score >= 60) return "Bullish";
    if (score >= 45) return "Slightly Bullish";
    if (score >= 40) return "Neutral";
    if (score >= 30) return "Slightly Bearish";
    if (score >= 20) return "Bearish";
    return "Strongly Bearish";
  };
  
  const requestAIAnalysis = () => {
    setIsAnalyzing(true);
    toast.success("AI Assistant actively scanning for profitable opportunities");
    notificationService.sendMarketAnalysisAlert("BTC", "Bullish divergence detected");
    
    // Simulate AI analysis completion
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success("AI analysis complete - 3 new trading opportunities identified");
    }, 2500);
  };
  
  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-purple-900/40 border border-blue-800">
      <div className="flex items-start">
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
          
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-2 bg-blue-950/50">
              <TabsTrigger 
                value="summary" 
                className="data-[state=active]:bg-blue-800/50"
                onClick={() => setInsightView("summary")}
              >
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="sentiment" 
                className="data-[state=active]:bg-blue-800/50"
                onClick={() => setInsightView("detailed")}
              >
                Sentiment Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="signals" 
                className="data-[state=active]:bg-blue-800/50"
              >
                AI Signals
              </TabsTrigger>
              <TabsTrigger 
                value="correlations" 
                className="data-[state=active]:bg-blue-800/50"
              >
                Correlations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-0">
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
            </TabsContent>
            
            <TabsContent value="sentiment" className="mt-0">
              <div className="bg-blue-950/20 p-3 rounded mb-3">
                <h3 className="text-blue-200 font-medium mb-2 text-sm">Sentiment Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(marketSentiment).map(([symbol, data]) => (
                    <div key={symbol} className="flex items-center">
                      <span className="text-blue-100 w-12">{symbol}</span>
                      <div className="flex-1 mx-2">
                        <Progress 
                          value={data.score} 
                          className="h-2" 
                          indicatorClassName={
                            data.trend === 'bullish' ? 'bg-green-500' : 
                            data.trend === 'bearish' ? 'bg-red-500' : 'bg-blue-500'
                          }
                        />
                      </div>
                      <span className={`text-xs w-10 text-right ${
                        data.trend === 'bullish' ? 'text-green-300' : 
                        data.trend === 'bearish' ? 'text-red-300' : 'text-blue-300'
                      }`}>
                        {data.score}%
                      </span>
                      {data.trend === 'bullish' && <ArrowUp className="h-3 w-3 text-green-300" />}
                      {data.trend === 'bearish' && <ArrowDown className="h-3 w-3 text-red-300" />}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="signals" className="mt-0">
              <div className="bg-blue-950/20 p-3 rounded mb-3">
                <h3 className="text-blue-200 font-medium mb-2 text-sm">AI-Generated Trading Signals</h3>
                <div className="space-y-2">
                  {marketSignals.map((signal, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-blue-900/30 p-1.5 rounded">
                      <div className="flex items-center">
                        {signal.name === 'RSI Divergence' && <LineChart className="h-3.5 w-3.5 text-indigo-300 mr-1.5" />}
                        {signal.name === 'MACD Crossover' && <BarChart2 className="h-3.5 w-3.5 text-indigo-300 mr-1.5" />}
                        {signal.name === 'Volume Profile' && <TrendingUp className="h-3.5 w-3.5 text-indigo-300 mr-1.5" />}
                        {signal.name === 'Support Level' && <Cpu className="h-3.5 w-3.5 text-indigo-300 mr-1.5" />}
                        <span className="text-blue-100 text-xs">{signal.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          signal.signal === 'BUY' ? 'bg-green-900/50 text-green-300' : 
                          signal.signal === 'SELL' ? 'bg-red-900/50 text-red-300' : 
                          signal.signal === 'STRONG' ? 'bg-purple-900/50 text-purple-300' :
                          'bg-blue-900/50 text-blue-300'
                        }`}>
                          {signal.signal}
                        </span>
                        <span className="text-xs text-blue-300 ml-2">{signal.confidence}%</span>
                        <span className="text-xs text-blue-400 ml-2">{signal.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="correlations" className="mt-0">
              <div className="bg-blue-950/20 p-3 rounded mb-3">
                <h3 className="text-blue-200 font-medium mb-2 text-sm">Market Correlations</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(correlationData).map(([pair, score]) => (
                    <div key={pair} className="flex items-center justify-between bg-blue-900/30 p-1.5 rounded">
                      <span className="text-blue-100 text-xs">{pair}</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-blue-950/50 h-1.5 rounded-full mr-2">
                          <div 
                            className={`h-1.5 rounded-full ${
                              score > 0.8 ? 'bg-purple-500' : 
                              score > 0.6 ? 'bg-blue-500' : 
                              'bg-blue-400'
                            }`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-300">{(score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-blue-800/50 text-blue-100 border-blue-700 hover:bg-blue-800"
                    onClick={requestAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Cpu className="mr-2 h-4 w-4 animate-pulse" />
                        Analyzing Market...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Get AI Recommendations
                      </>
                    )}
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
    </div>
  );
};

export default AIInsightsBanner;
