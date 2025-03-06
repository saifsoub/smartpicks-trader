
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, Bell, Settings, TrendingUp, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import notificationService from "@/services/notificationService";
import { toast } from "sonner";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const handleNotificationClick = () => {
    toast.success("Checking for new notifications...");
    notificationService.getLatestNotifications();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-6 w-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">TradingBot AI</h1>
          <Badge variant="outline" className="ml-2 bg-blue-900/30 text-blue-300 border-blue-800">
            Pro Edition
          </Badge>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-yellow-300 hover:text-white hover:bg-slate-800"
                  onClick={handleNotificationClick}
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-blue-300 hover:text-white hover:bg-slate-800"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default Header;
