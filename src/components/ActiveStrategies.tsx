
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tradingService from "@/services/tradingService";
import { Strategy } from "@/services/tradingService";

const ActiveStrategies: React.FC = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  
  // Load active strategies on component mount
  useEffect(() => {
    const activeStrategies = tradingService.getActiveStrategies();
    setStrategies(activeStrategies);
  }, []);
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Active Strategies</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-400 hover:text-blue-300"
            onClick={() => navigate("/strategies")}
          >
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {strategies.length > 0 ? (
          <ul className="space-y-3">
            {strategies.map((strategy) => (
              <li key={strategy.id} className="flex items-center justify-between rounded-md bg-slate-800 p-3">
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
                      {strategy.performance}
                    </Badge>
                    <span className="ml-2 text-xs text-slate-400">{strategy.symbol}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-white"
                  onClick={() => navigate(`/strategies/${strategy.id}`)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <p>No active strategies</p>
            <Button 
              variant="link" 
              className="text-blue-400 p-0 h-auto mt-1"
              onClick={() => navigate("/strategies")}
            >
              Go to strategies
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveStrategies;
