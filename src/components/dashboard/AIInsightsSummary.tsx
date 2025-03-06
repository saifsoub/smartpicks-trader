
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AIInsightsSummary: React.FC = () => {
  const triggerAIAnalysis = () => {
    toast.success("AI analysis started", {
      description: "Analyzing market conditions and trading opportunities"
    });
    
    // Simulate analysis completion
    setTimeout(() => {
      toast.success("Analysis complete", {
        description: "Found 3 potential trading opportunities"
      });
    }, 2000);
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
      <CardHeader className="border-b border-slate-800 pb-3 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-300" />
          AI Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex justify-between items-center mb-1">
              <div className="font-medium text-blue-300 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Market Sentiment
              </div>
              <div className="text-sm text-green-400">Bullish</div>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full mt-1">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "68%" }}></div>
            </div>
          </div>
          
          <div className="text-sm text-white">
            <h3 className="font-medium mb-2">Key AI Insights:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Bitcoin showing strong support at $65,400 level</span>
              </li>
              <li className="flex items-start">
                <ArrowUp className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>ETH/BTC ratio improving, suggesting altcoin season potential</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Increased market volatility expected in next 24-48 hours</span>
              </li>
            </ul>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            onClick={triggerAIAnalysis}
          >
            <Brain className="mr-2 h-4 w-4" />
            Get Fresh AI Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsSummary;
