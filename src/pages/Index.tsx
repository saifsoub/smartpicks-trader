
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Layout, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "@/components/dashboard/Header";
import PriceDisplay from "@/components/dashboard/PriceDisplay";
import AIInsightsBanner from "@/components/dashboard/AIInsightsBanner";
import MarketInsightsPanel from "@/components/dashboard/MarketInsightsPanel";
import RiskManagementTools from "@/components/RiskManagementTools";
import BotStatus from "@/components/BotStatus";
import PortfolioSummary from "@/components/PortfolioSummary";
import RecentTrades from "@/components/RecentTrades";
import tradingService from "@/services/tradingService";
import TradingChart from "@/components/TradingChart";
import AutomatedTradingSetup from "@/components/AutomatedTradingSetup";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import AIChatAssistant from "@/components/AIChatAssistant";
import NewbieGuideDashboard from "@/components/NewbieGuideDashboard";

const Index: React.FC = () => {
  const [dashboardMode, setDashboardMode] = useState<'beginner' | 'advanced'>('beginner');
  const [isSetupMode, setIsSetupMode] = useState(true);
  const navigate = useNavigate();
  
  const marketSentiment = tradingService.getMarketSentiment();
  
  // Mock data for BTC price and change
  const btcPrice = "67,850.45";
  const btcChange = 3.72;
  
  const aiInsights = {
    mainInsight: "Bitcoin shows a strong bullish trend with increasing institutional interest. Technical indicators and sentiment analysis suggest further upside potential.",
    technicalAnalysis: "Multiple indicators showing bullish signals with strong support at $65,400. RSI at 62 indicates room for growth before overbought conditions.",
    newsSentiment: "Recent regulatory developments are positive for the market. Social sentiment analysis shows 72% bullish perspectives across major platforms.",
    prediction: "Short-term target of $69,000 with 78% confidence. Momentum indicators suggest strong uptrend continuation."
  };
  
  const toggleSetupMode = () => {
    setIsSetupMode(!isSetupMode);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-4 flex-1">
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Trading Dashboard</h1>
            <p className="text-slate-400">Your intelligent cryptocurrency trading assistant</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Tabs 
              value={dashboardMode} 
              onValueChange={(value) => setDashboardMode(value as 'beginner' | 'advanced')}
              className="bg-slate-900/80 border border-slate-800 rounded-lg p-1"
            >
              <TabsList className="bg-slate-800/90">
                <TabsTrigger value="beginner" className="data-[state=active]:bg-indigo-800">
                  <Brain className="h-4 w-4 mr-1.5" />
                  Beginner Mode
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-indigo-800">
                  <BarChart2 className="h-4 w-4 mr-1.5" />
                  Advanced Mode
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {!isSetupMode && (
              <Button
                onClick={toggleSetupMode}
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
              >
                <Zap className="mr-2 h-4 w-4" />
                Setup Bot
              </Button>
            )}
            
            {isSetupMode && (
              <Button
                onClick={toggleSetupMode}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                <Layout className="mr-2 h-4 w-4" />
                View Dashboard
              </Button>
            )}
          </div>
        </div>
        
        {isSetupMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AutomatedTradingSetup />
            </div>
            <div className="space-y-4">
              <NewbieGuideDashboard />
              
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <CardTitle className="text-white">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-slate-300 mb-4">
                    Setting up your first AI trading bot is easy! Follow the setup wizard to get started with automated trading in minutes.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      onClick={() => navigate("/settings")}
                    >
                      API Settings
                    </Button>
                    <Button 
                      className="bg-blue-700 hover:bg-blue-800"
                      onClick={() => navigate("/strategies")}
                    >
                      Trading Strategies
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <PriceDisplay btcPrice={btcPrice} btcChange={btcChange} />
            
            {dashboardMode === 'beginner' ? (
              <AIInsightsBanner 
                marketSentiment={marketSentiment} 
                mainInsight={aiInsights.mainInsight} 
              />
            ) : (
              <MarketInsightsPanel 
                aiInsights={aiInsights}
                marketSentiment={marketSentiment}
              />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <TradingChart />
              </div>
              <div className="space-y-4">
                <BotStatus />
                {dashboardMode === 'beginner' && <RiskManagementTools />}
                {dashboardMode === 'advanced' && <PerformanceMetrics />}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-4 lg:col-span-2">
                <PortfolioSummary />
                <RecentTrades />
              </div>
              <div className="lg:col-span-1 h-[500px]">
                {dashboardMode === 'beginner' ? (
                  <AIChatAssistant />
                ) : (
                  <div className="space-y-4">
                    <RiskManagementTools />
                    <NewbieGuideDashboard />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
