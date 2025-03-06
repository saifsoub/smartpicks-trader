
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Bell, Settings, Brain, TrendingUp, LineChart, BadgeDollarSign, BarChart4 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TradingChart from "@/components/TradingChart";
import BotStatus from "@/components/BotStatus";
import ActiveStrategies from "@/components/ActiveStrategies";
import RecentTrades from "@/components/RecentTrades";
import TradingActivityLog from "@/components/TradingActivityLog";
import PortfolioSummary from "@/components/PortfolioSummary";

const Index = () => {
  const navigate = useNavigate();

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
              Our advanced AI is analyzing market trends, news sentiment, and technical indicators to provide you with the most profitable trading opportunities. Currently monitoring 32 currency pairs and detecting bullish patterns on BTC, ETH, and SOL.
            </p>
            <div className="mt-3 flex gap-2">
              <Badge className="bg-green-700 text-white">BTC Bullish</Badge>
              <Badge className="bg-green-700 text-white">ETH Outperforming</Badge>
              <Badge className="bg-yellow-700 text-white">Market Volatility: Medium</Badge>
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
                    <span className="text-green-300 mr-2 text-lg font-medium">$66,789.21</span>
                    <span className="bg-green-400/10 text-green-300 text-xs px-1.5 py-0.5 rounded">+2.4%</span>
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
                  <LineChart className="h-5 w-5 mr-2 text-purple-300" />
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
                    <p className="text-slate-200">BTC showing strong uptrend with key support at $65,200. RSI indicates not yet overbought. MACD suggests continued momentum.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-300 mr-2" />
                      <h3 className="text-lg font-medium text-green-100">News Sentiment</h3>
                    </div>
                    <p className="text-slate-200">Positive market sentiment (78%) after recent regulatory announcements. ETF inflows continue to show institutional confidence.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center mb-2">
                      <BadgeDollarSign className="h-5 w-5 text-yellow-300 mr-2" />
                      <h3 className="text-lg font-medium text-yellow-100">AI Predictions</h3>
                    </div>
                    <p className="text-slate-200">80% probability of BTC reaching $68K within 48 hours based on current market conditions and historical patterns.</p>
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
