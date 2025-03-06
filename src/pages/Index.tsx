
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Bell, ChevronDown, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TradingChart from "@/components/TradingChart";
import BotStatus from "@/components/BotStatus";
import ActiveStrategies from "@/components/ActiveStrategies";
import RecentTrades from "@/components/RecentTrades";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">TradingBot</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-700 bg-slate-800 hover:bg-slate-700"
              onClick={() => navigate("/strategies")}
            >
              Strategies
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-700 bg-slate-800 hover:bg-slate-700"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trading Chart - Takes 2/3 of screen on large displays */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800 shadow-lg">
              <CardHeader className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">BTC/USDT</CardTitle>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2 text-lg font-medium">$66,789.21</span>
                    <span className="bg-green-400/10 text-green-400 text-xs px-1.5 py-0.5 rounded">+2.4%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TradingChart />
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar with bot status */}
          <div className="space-y-6">
            <BotStatus />
            <ActiveStrategies />
          </div>

          {/* Recent trades - full width */}
          <div className="lg:col-span-3">
            <RecentTrades />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
