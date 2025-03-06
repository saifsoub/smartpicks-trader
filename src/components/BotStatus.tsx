
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause } from "lucide-react";

const BotStatus: React.FC = () => {
  const [isActive, setIsActive] = React.useState(true);

  const toggleBotStatus = () => {
    setIsActive(!isActive);
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <span>Bot Status</span>
          <Badge className={isActive ? "bg-green-500" : "bg-red-500"}>
            {isActive ? "Running" : "Stopped"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-slate-400">Uptime</div>
          <div className="text-right">2d 14h 32m</div>
          
          <div className="text-slate-400">Total Trades</div>
          <div className="text-right">48</div>
          
          <div className="text-slate-400">Win Rate</div>
          <div className="text-right text-green-400">72.4%</div>
          
          <div className="text-slate-400">Profit/Loss</div>
          <div className="text-right text-green-400">+$893.21</div>
        </div>
        
        <Button 
          className={isActive 
            ? "w-full bg-red-500 hover:bg-red-600" 
            : "w-full bg-green-500 hover:bg-green-600"
          }
          onClick={toggleBotStatus}
        >
          {isActive 
            ? <><Pause className="mr-2 h-4 w-4" /> Stop Bot</> 
            : <><Play className="mr-2 h-4 w-4" /> Start Bot</>
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default BotStatus;
