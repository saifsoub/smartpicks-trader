
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Layout, BarChart2, Bot, Lightbulb, ArrowRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/dashboard/Header";
import TradingChart from "@/components/TradingChart";
import AIInsightsSummary from "@/components/dashboard/AIInsightsSummary";
import PortfolioSummary from "@/components/PortfolioSummary";
import RecentTrades from "@/components/RecentTrades";
import binanceService from "@/services/binanceService";
import AIChatAssistant from "@/components/AIChatAssistant";
import BotStatus from "@/components/BotStatus";
import BotPerformanceChart from "@/components/BotPerformanceChart";

const Index: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'setup'>('dashboard');
  const [btcPrice, setBtcPrice] = useState("0.00");
  const [btcChange, setBtcChange] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  
  useEffect(() => {
    // Load real-time price data when component mounts
    fetchPriceData();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchPriceData, 30000); // every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchPriceData = async () => {
    try {
      // Get current BTC price
      const prices = await binanceService.getPrices();
      if (prices && prices["BTCUSDT"]) {
        setBtcPrice(parseFloat(prices["BTCUSDT"]).toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }));
      }
      
      // Get BTC price change
      const symbols = await binanceService.getSymbols();
      const btcSymbol = symbols.find(s => s.symbol === "BTCUSDT");
      if (btcSymbol) {
        setBtcChange(parseFloat(btcSymbol.priceChangePercent));
      }
    } catch (error) {
      console.error("Failed to fetch price data:", error);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-4 flex-1">
        <div className="mb-6 bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-purple-900/40 rounded-xl p-6 border border-blue-800/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">AI Trading Bot</h1>
              <p className="text-blue-300">Your automated trading companion</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Tabs 
                value={currentView} 
                onValueChange={(value) => setCurrentView(value as 'dashboard' | 'setup')}
                className="bg-slate-900/80 border border-slate-800 rounded-lg p-1"
              >
                <TabsList className="bg-slate-800/90">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-800">
                    <BarChart2 className="h-4 w-4 mr-1.5" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="setup" className="data-[state=active]:bg-indigo-800">
                    <Bot className="h-4 w-4 mr-1.5" />
                    AI Setup
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-900/40 rounded-lg p-3 flex items-center">
              <div className="bg-indigo-700 rounded-full p-2 mr-3">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white text-sm">Bitcoin</div>
                <div className="text-xl font-bold text-blue-100">${btcPrice}</div>
              </div>
            </div>
            
            <div className="bg-indigo-900/40 rounded-lg p-3 flex items-center">
              <div className={`${btcChange >= 0 ? 'bg-green-700' : 'bg-red-700'} rounded-full p-2 mr-3`}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white text-sm">24h Change</div>
                <div className={`text-xl font-bold ${btcChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="flex-1 hidden md:block">
              <Button 
                className="ml-auto flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 float-right"
                onClick={() => toast.success("AI Assistant activated")}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Get AI Insights
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-full justify-start p-1 mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-800">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-indigo-800">Bot Performance</TabsTrigger>
            <TabsTrigger value="chart" className="data-[state=active]:bg-indigo-800">Trading</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-indigo-800">AI Tools</TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-indigo-800">Portfolio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <BotPerformanceChart />
              </div>
              <div className="space-y-4">
                <BotStatus />
                <AIInsightsSummary />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <PortfolioSummary />
              </div>
              <div>
                <RecentTrades />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <BotPerformanceChart />
              </div>
              <div>
                <BotStatus />
              </div>
            </div>
            <RecentTrades />
          </TabsContent>
          
          <TabsContent value="chart" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 gap-4">
              <TradingChart symbol={selectedSymbol} />
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4 mt-0">
            <Card className="bg-slate-900 border-slate-800 shadow-lg">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-indigo-400" />
                  AI Trading Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[500px]">
                <AIChatAssistant />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio" className="space-y-4 mt-0">
            <PortfolioSummary />
            <RecentTrades />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
