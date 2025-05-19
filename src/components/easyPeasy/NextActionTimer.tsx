
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NextActionTimerProps {
  actionableAdvice: any[];
}

const NextActionTimer: React.FC<NextActionTimerProps> = ({ actionableAdvice }) => {
  const [nextActions, setNextActions] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Update clock every minute
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    
    // Initial update
    updateClock();
    
    // Set interval for updates
    const interval = setInterval(updateClock, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Process and sort upcoming actions
  useEffect(() => {
    // Ensure actionableAdvice is an array before processing
    if (!Array.isArray(actionableAdvice) || actionableAdvice.length === 0) {
      setNextActions([]);
      return;
    }
    
    try {
      // Create next actions timeline sorted by time
      const actions = actionableAdvice
        .filter(item => item && item.action && item.action.action !== "HOLD")
        .map(item => ({
          time: item.action.actionTime,
          symbol: item.symbol.replace('USDT', ''),
          action: item.action.action,
          price: item.action.entryPrice,
        }))
        .sort((a, b) => {
          // Convert time strings to comparable values
          const timeA = convertTimeStringToMinutes(a.time);
          const timeB = convertTimeStringToMinutes(b.time);
          return timeA - timeB;
        });
        
      setNextActions(actions);
    } catch (error) {
      console.error("Error processing action data:", error);
      setNextActions([]);
    }
  }, [actionableAdvice]);
  
  // Helper to convert "HH:MM" to minutes since midnight for sorting
  const convertTimeStringToMinutes = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    } catch (error) {
      console.error("Error converting time string:", error);
      return 0;
    }
  };
  
  if (nextActions.length === 0) {
    return (
      <div className="text-center p-8 text-white/60">
        No upcoming actions scheduled. Select more symbols or refresh advice.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/60">Current time:</div>
        <div className="flex items-center bg-slate-800 px-3 py-1 rounded-md">
          <Clock className="h-4 w-4 mr-2 text-white/70" />
          <span className="text-white font-mono">{currentTime}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {nextActions.map((action, index) => (
          <div 
            key={`${action.symbol}-${index}`} 
            className="flex items-center justify-between p-3 rounded-md bg-slate-800/50 border border-slate-700"
          >
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${
                action.action === "BUY" ? "bg-green-500" : "bg-red-500"
              }`}></div>
              <span className="font-mono text-white/80">{action.time}</span>
            </div>
            
            <div className="font-medium text-white">
              {action.action} {action.symbol} @ ${parseFloat(action.price).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-white/60 mt-4">
        These suggestions are based on AI analysis and market conditions.
        Always do your own research before making trading decisions.
      </p>
    </div>
  );
};

export default NextActionTimer;
