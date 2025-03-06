import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, Bell, Settings, Brain, TrendingUp, LineChart, 
  BadgeDollarSign, BarChart4, Bot, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Gauge, MessageSquare, AreaChart
} from "lucide-react";
import TradingChart from "@/components/TradingChart";
import BotStatus from "@/components/BotStatus";
import ActiveStrategies from "@/components/ActiveStrategies";
import RecentTrades from "@/components/RecentTrades";
import TradingActivityLog from "@/components/TradingActivityLog";
import PortfolioSummary from "@/components/PortfolioSummary";
import tradingService from "@/services/tradingService";
import binanceService from "@/services/binanceService";
import notificationService from "@/services/notificationService";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [marketSentiment, setMarketSentiment] = useState<Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }>>({});
  const [btcPrice, setBtcPrice] = useState("Loading...");
  const [btcChange, setBtcChange] = useState(0);
  const [aiInsights, setAiInsights] = useState<{
    mainInsight: string;
    technicalAnalysis: string;
    newsSentiment: string;
    prediction: string;
  }>({
    mainInsight: "Analyzing market data...",
    technicalAnalysis: "Calculating technical indicators...",
    newsSentiment: "Analyzing market sentiment...",
    prediction: "Generating price predictions..."
  });
  
  useEffect(() => {
    // Load market sentiment from trading service
    const sentiment = tradingService.getMarketSentiment();
    setMarketSentiment(sentiment);
    
    // Get current BTC price
    const fetchPrice = async () => {
      try {
        const prices = await binanceService.getPrices();
        if (prices["BTCUSDT"]) {
          setBtcPrice(parseFloat(prices["BTCUSDT"]).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }));
        }
        
        // Get 24h change
        const symbols = await binanceService.getSymbols();
        const btcSymbol = symbols.find(s => s.symbol === "BTCUSDT");
        if (btcSymbol) {
          setBtcChange(parseFloat(btcSymbol.priceChangePercent));
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };
    
    fetchPrice();
    
    // Generate AI insights
    generateAiInsights();
    
    // Check if Telegram notifications are set up
    setTimeout(() => {
      notificationService.testTelegramSetup();
    }, 2000);
    
    // Set up recurring updates
    const priceInterval = setInterval(fetchPrice, 30000);
    const sentimentInterval = setInterval(() => {
      const updatedSentiment = tradingService.getMarketSentiment();
      setMarketSentiment(updatedSentiment);
    }, 120000);
    const insightsInterval = setInterval(generateAiInsights, 300000);
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(sentimentInterval);
      clearInterval(insightsInterval);
    };
  }, []);
  
  const generateAiInsights = () => {
    // Generate realistic AI insights based on market data
    // In a real implementation, this would use ML models or market data APIs
    
    const btcSentiment = marketSentiment["BTC"]?.score || Math.random() * 100;
    const isBullish = btcSentiment > 65;
    const isBearish = btcSentiment < 35;
    
    const insights = {
      mainInsight: isBullish 
        ? "Our AI detects a strong bullish pattern forming across major cryptocurrencies, with institutional buying increasing by 15% in the last 24 hours."
        : isBearish
          ? "Our AI has identified increasing bearish pressure in the short term, with significant whale movements suggesting potential sell-offs."
          : "Market appears to be in consolidation phase. Our AI suggests range-bound trading strategies until a clear breakout direction is established.",
          
      technicalAnalysis: isBullish
        ? "BTC showing strong uptrend with key support at $65,200. RSI indicates not yet overbought at 68. MACD histogram expanding positively with golden cross on 4h timeframe."
        : isBearish
          ? "BTC approaching critical support level. RSI trending downwards at 42 with bearish divergence on daily chart. MACD suggests waning momentum with death cross formation imminent."
          : "BTC trapped between $63,400 support and $67,800 resistance. RSI neutral at 52 with decreasing volatility. Key level to watch is the 200-day moving average at $61,250.",
          
      newsSentiment: isBullish
        ? "Positive market sentiment (78%) after recent regulatory announcements. ETF inflows continue to show institutional confidence. Social media mentions up 22% with bullish bias."
        : isBearish
          ? "Negative regulatory news from Asia causing market uncertainty (62% bearish sentiment). ETF outflows reported for the 3rd consecutive day. Social media sentiment shifting negative."
          : "Mixed market sentiment (52% positive) with institutional investors remaining cautious. Regulatory clarity improving but uncertainty remains in key markets.",
          
      prediction: isBullish
        ? "80% probability of BTC reaching $68K within 48 hours based on current market conditions and historical patterns. Key resistance at $70K."
        : isBearish
          ? "68% probability of BTC retesting $62K support level within 72 hours. If this level breaks, next support at $58,500."
          : "60% probability of continued consolidation between $64K-$68K for the next 24-48 hours. Watch for volume spike as indication of breakout direction."
    };
    
    setAiInsights(insights);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">TradingBot AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={() => navigate("/strategies")}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-green-300" />
              Strategies
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4 text-blue-300" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-yellow-300 hover:text-white hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        {/* AI Insights Banner */}
        <div className="mb-6 p-4 rounded-lg bg-blue-900/20 border border-blue-800 flex items-start">
          <Brain className="h-6 w-6 text-blue-300 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-medium text-blue-200 mb-1">AI Trading Assistant</h2>
            <p className="text-blue-100">
              {aiInsights.mainInsight}
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
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-blue-800/50 text-blue-100 border-blue-700 hover:bg-blue-800"
                onClick={() => {
                  toast.success("AI Assistant actively monitoring market conditions");
                  notificationService.sendMarketAnalysisAlert("BTC", "Bullish divergence detected on 4h chart", 78);
                }}
              >
                <Zap className="mr-2 h-4 w-4" />
                Get AI Recommendations
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Trading Chart - Takes 8/12 of screen on large displays */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900 border-slate-800 shadow-lg">
              <CardHeader className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">BTC/USDT</CardTitle>
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
          </div>

          {/* Right sidebar with bot status and portfolio */}
          <div className="lg:col-span-4 space-y-6">
            <BotStatus />
            <PortfolioSummary />
            <ActiveStrategies />
          </div>

          {/* Market Insights Panel */}
          <div className="lg:col-span-12">
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
          </div>

          {/* Activity log - takes 8/12 of screen */}
          <div className="lg:col-span-8">
            <TradingActivityLog />
          </div>
          
          {/* Recent trades - takes 4/12 of screen */}
          <div className="lg:col-span-4">
            <RecentTrades />
          </div>
        </div>
      </main>
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

export default Index;
