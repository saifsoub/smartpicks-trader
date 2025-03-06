import React, { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import AIInsightsBanner from "@/components/dashboard/AIInsightsBanner";
import PriceDisplay from "@/components/dashboard/PriceDisplay";
import MarketInsightsPanel from "@/components/dashboard/MarketInsightsPanel";
import BotStatus from "@/components/BotStatus";
import ActiveStrategies from "@/components/ActiveStrategies";
import RecentTrades from "@/components/RecentTrades";
import TradingActivityLog from "@/components/TradingActivityLog";
import PortfolioSummary from "@/components/PortfolioSummary";
import TradingChartEnhanced from "@/components/TradingChartEnhanced";
import RiskManagementTools from "@/components/RiskManagementTools";
import BacktestingModule from "@/components/BacktestingModule";
import TwoFactorAuth from "@/components/TwoFactorAuth";
import SocialTradingFeatures from "@/components/SocialTradingFeatures";
import tradingService from "@/services/tradingService";
import binanceService from "@/services/binanceService";
import notificationService from "@/services/notificationService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Index = () => {
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
      <Header />

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        {/* AI Insights Banner */}
        <AIInsightsBanner 
          marketSentiment={marketSentiment} 
          mainInsight={aiInsights.mainInsight} 
        />

        <Tabs defaultValue="trading">
          <div className="mb-4">
            <TabsList className="w-full bg-slate-800 p-1">
              <TabsTrigger value="trading" className="flex-1">Trading Dashboard</TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1">Advanced Analysis</TabsTrigger>
              <TabsTrigger value="social" className="flex-1">Social Trading</TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Trading Chart - Takes 8/12 of screen on large displays */}
              <div className="lg:col-span-8">
                <PriceDisplay 
                  btcPrice={btcPrice} 
                  btcChange={btcChange} 
                />
              </div>

              {/* Right sidebar with bot status and portfolio */}
              <div className="lg:col-span-4 space-y-6">
                <BotStatus />
                <PortfolioSummary />
                <ActiveStrategies />
              </div>

              {/* Market Insights Panel */}
              <div className="lg:col-span-12">
                <MarketInsightsPanel 
                  aiInsights={aiInsights} 
                  marketSentiment={marketSentiment} 
                />
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
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Enhanced Trading Chart */}
              <div className="lg:col-span-8">
                <div className="bg-slate-900 border-slate-800 shadow-lg rounded-lg overflow-hidden">
                  <div className="border-b border-slate-800 px-4 py-3">
                    <h3 className="text-lg font-medium text-white">Advanced Chart Analysis</h3>
                  </div>
                  <TradingChartEnhanced />
                </div>
              </div>

              {/* Risk Management */}
              <div className="lg:col-span-4">
                <RiskManagementTools currentPrice={parseFloat(btcPrice.replace(/,/g, ''))} />
              </div>

              {/* Backtesting Module */}
              <div className="lg:col-span-12">
                <BacktestingModule />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-12">
                <SocialTradingFeatures />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <TwoFactorAuth />
              </div>
              <div className="lg:col-span-6">
                {/* Additional security content could go here */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
