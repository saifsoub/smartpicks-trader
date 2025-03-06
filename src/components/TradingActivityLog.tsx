
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, Check, AlertTriangle, Info, Trash2 } from "lucide-react";
import binanceService from "@/services/binanceService";
import { useToast } from "@/hooks/use-toast";

const TradingActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<{timestamp: Date, message: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load logs on mount
    loadLogs();
    
    // Set up an interval to refresh logs periodically
    const interval = setInterval(() => {
      loadLogs();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const loadLogs = () => {
    setIsLoading(true);
    try {
      const tradingLogs = binanceService.getTradingLogs();
      setLogs(tradingLogs);
    } catch (error) {
      console.error("Failed to load trading logs:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearLogs = () => {
    if (confirm("Are you sure you want to clear all trading logs? This cannot be undone.")) {
      binanceService.clearTradingLogs();
      setLogs([]);
      toast({
        title: "Logs cleared",
        description: "All trading activity logs have been cleared."
      });
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffMins / 1440);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };
  
  const getIconForLogType = (type: 'info' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Trading Activity Log</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearLogs}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadLogs}
              disabled={isLoading}
              className="text-slate-400 hover:text-white"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto scrollbar-thin p-0">
        {logs.length > 0 ? (
          <ul className="divide-y divide-slate-800">
            {logs.map((log, index) => (
              <li key={index} className="flex items-start gap-3 p-3 hover:bg-slate-800/50">
                <div className="mt-1">
                  {getIconForLogType(log.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{log.message}</p>
                  <div className="flex items-center mt-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Info className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No trading activity logs yet</p>
            <p className="text-xs mt-1">Logs will appear as the bot operates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingActivityLog;
