
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, BarChart2, Bot, Shield, Users, Settings, AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/dashboard/Header";
import BotPerformanceChart from "@/components/BotPerformanceChart";
import AIInsightsSummary from "@/components/dashboard/AIInsightsSummary";
import BotStatus from "@/components/BotStatus";
import PortfolioSummary from "@/components/PortfolioSummary";
import RecentTrades from "@/components/RecentTrades";
import TradingActivityLog from "@/components/TradingActivityLog";
import BacktestingModule from "@/components/BacktestingModule";
import RiskManagementTools from "@/components/RiskManagementTools";
import SocialTradingFeatures from "@/components/SocialTradingFeatures";
import TradeFilterSettings from "@/components/TradeFilterSettings";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import ActiveStrategies from "@/components/ActiveStrategies";
import TwoFactorAuth from "@/components/TwoFactorAuth";
import automatedTradingService from "@/services/automatedTradingService";
import AITradingAssistant from "@/components/AITradingAssistant";

const BotDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    // Initialize the automated trading service
    const unsubscribe = automatedTradingService.subscribeToUpdates((status) => {
      if (status.event === "strategy_triggered") {
        toast.info(`Strategy triggered: ${status.strategy}`, {
          description: `${status.symbol} at ${status.price}`
        });
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-4 flex-1">
        <div className="mb-6 bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-purple-900/40 rounded-xl p-6 border border-blue-800/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">AI Trading Bot Dashboard</h1>
              <p className="text-blue-300">Comprehensive trading management system</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <TwoFactorAuth />
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-full justify-start p-1 mb-4 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-800">
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="strategies" className="data-[state=active]:bg-indigo-800">
              <Zap className="h-4 w-4 mr-1.5" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-indigo-800">
              <Shield className="h-4 w-4 mr-1.5" />
              Risk Management
            </TabsTrigger>
            <TabsTrigger value="backtesting" className="data-[state=active]:bg-indigo-800">
              <Activity className="h-4 w-4 mr-1.5" />
              Backtesting
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-indigo-800">
              <Brain className="h-4 w-4 mr-1.5" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-indigo-800">
              <Users className="h-4 w-4 mr-1.5" />
              Social Trading
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-indigo-800">
              <Activity className="h-4 w-4 mr-1.5" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-800">
              <Settings className="h-4 w-4 mr-1.5" />
              Bot Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <PerformanceMetrics />
          </TabsContent>
          
          <TabsContent value="strategies" className="space-y-4 mt-0">
            <ActiveStrategies />
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-4 mt-0">
            <RiskManagementTools />
          </TabsContent>
          
          <TabsContent value="backtesting" className="space-y-4 mt-0">
            <BacktestingModule />
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4 mt-0">
            <AITradingAssistant />
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 mt-0">
            <SocialTradingFeatures />
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4 mt-0">
            <TradingActivityLog />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-0">
            <TradeFilterSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BotDashboard;
