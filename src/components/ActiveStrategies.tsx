
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Info, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tradingService from "@/services/tradingService";
import { Strategy } from "@/services/tradingService";

const ActiveStrategies: React.FC = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  
  // Load active strategies on component mount and when they change
  useEffect(() => {
    const loadStrategies = () => {
      const activeStrategies = tradingService.getActiveStrategies();
      setStrategies(activeStrategies);
    };
    
    // Initial load
    loadStrategies();
    
    // Set up event listener for strategy changes
    const handleStrategyChange = () => {
      loadStrategies();
    };
    
    window.addEventListener('strategy-updated', handleStrategyChange);
    
    // Refresh every 30 seconds to show updated performance
    const interval = setInterval(loadStrategies, 30000);
    
    return () => {
      window.removeEventListener('strategy-updated', handleStrategyChange);
      clearInterval(interval);
    };
  }, []);
  
  const toggleExpand = (id: string) => {
    if (expandedStrategy === id) {
      setExpandedStrategy(null);
    } else {
      setExpandedStrategy(id);
    }
  };
  
  const getPerformanceColor = (performance: string) => {
    if (performance.startsWith('+')) {
      return 'text-green-500 bg-green-500/10 border-green-500/30';
    } else if (performance.startsWith('-')) {
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    }
    return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  };
  
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
              <li key={strategy.id} className="rounded-md bg-slate-800">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => toggleExpand(strategy.id)}
                >
                  <div>
                    <div className="font-medium flex items-center">
                      {strategy.name}
                      {strategy.performance && parseFloat(strategy.performance) < 0 && (
                        <AlertTriangle className="ml-2 h-3.5 w-3.5 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs border ${getPerformanceColor(strategy.performance || '+0.0%')}`}
                      >
                        {strategy.performance}
                      </Badge>
                      <span className="ml-2 text-xs text-slate-400">{strategy.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-white h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/strategies/${strategy.id}`);
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-white ml-1 h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {expandedStrategy === strategy.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {expandedStrategy === strategy.id && (
                  <div className="px-3 pb-3 text-sm">
                    <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      <p className="text-xs text-slate-400 mb-2">{strategy.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-slate-400">Interval</div>
                          <div className="text-sm">{strategy.interval}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Trades</div>
                          <div className="text-sm">{strategy.trades || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Win Rate</div>
                          <div className="text-sm text-green-400">{strategy.winRate || '0%'}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs p-0 h-6 text-blue-400"
                          onClick={() => navigate(`/strategies/${strategy.id}`)}
                        >
                          Edit Parameters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
