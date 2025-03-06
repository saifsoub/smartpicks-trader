
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const strategies = [
  {
    id: 1,
    name: "RSI + MACD Crossover",
    active: true,
    performance: "+12.4%"
  },
  {
    id: 2,
    name: "Bollinger Breakout",
    active: true,
    performance: "+8.7%"
  }
];

const ActiveStrategies: React.FC = () => {
  const navigate = useNavigate();
  
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
        <ul className="space-y-3">
          {strategies.map((strategy) => (
            <li key={strategy.id} className="flex items-center justify-between rounded-md bg-slate-800 p-3">
              <div>
                <div className="font-medium">{strategy.name}</div>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
                    {strategy.performance}
                  </Badge>
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
      </CardContent>
    </Card>
  );
};

export default ActiveStrategies;
