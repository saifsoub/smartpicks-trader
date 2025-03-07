
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const AITradingAssistant: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<{
    asset: string;
    prediction: string;
    confidence: number;
    direction: "up" | "down" | "sideways";
    timeframe: string;
  }[]>([
    {
      asset: "Bitcoin (BTC)",
      prediction: "Price likely to increase over the next 24 hours based on increased buying pressure and positive sentiment indicators.",
      confidence: 78,
      direction: "up",
      timeframe: "24h"
    },
    {
      asset: "Ethereum (ETH)",
      prediction: "Consolidation expected with slight upward bias. Technical indicators show support at $2,240.",
      confidence: 65,
      direction: "up",
      timeframe: "48h"
    },
    {
      asset: "Binance Coin (BNB)",
      prediction: "Potential downward movement as selling pressure increases. Watch for key support at $340.",
      confidence: 72,
      direction: "down",
      timeframe: "12h"
    }
  ]);

  const generatePrediction = () => {
    if (!query.trim()) {
      toast.error("Please enter a query first");
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPrediction = {
        asset: query.includes("BTC") || query.includes("bitcoin") ? "Bitcoin (BTC)" : 
               query.includes("ETH") || query.includes("ethereum") ? "Ethereum (ETH)" : 
               "Solana (SOL)",
        prediction: "Analysis indicates a potential breakout within the next 24 hours. Volume indicators show increasing interest, and the RSI is approaching overbought territory.",
        confidence: Math.floor(Math.random() * 25) + 65, // 65-90%
        direction: Math.random() > 0.3 ? "up" : "down" as "up" | "down",
        timeframe: "24h"
      };
      
      setPredictions([newPrediction, ...predictions.slice(0, 2)]);
      setLoading(false);
      setQuery("");
      
      toast.success("New AI prediction generated", {
        description: `Analysis complete for ${newPrediction.asset}`
      });
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-white flex items-center">
              <Brain className="h-5 w-5 mr-2 text-indigo-400" />
              AI Prediction Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about a cryptocurrency or market trend..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button 
                  onClick={generatePrediction}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Generate <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {predictions.map((pred, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-indigo-300">{pred.asset}</div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      pred.direction === "up" ? "bg-green-900/40 text-green-400" : 
                      pred.direction === "down" ? "bg-red-900/40 text-red-400" : 
                      "bg-yellow-900/40 text-yellow-400"
                    }`}>
                      {pred.direction === "up" ? "Bullish" : 
                       pred.direction === "down" ? "Bearish" : 
                       "Neutral"} ({pred.timeframe})
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{pred.prediction}</p>
                  <div className="flex items-center">
                    <div className="text-xs text-gray-400 mr-2">Confidence:</div>
                    <div className="w-full bg-slate-700 h-2 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          pred.confidence > 75 ? "bg-green-500" : 
                          pred.confidence > 60 ? "bg-yellow-500" : 
                          "bg-red-500"
                        }`} 
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">{pred.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-400" />
              AI Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-sm text-gray-300 mb-1">Prediction Accuracy</div>
                <div className="flex items-center">
                  <div className="w-full bg-slate-700 h-2 rounded-full mr-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <div className="text-xs text-gray-400">78%</div>
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-sm text-gray-300 mb-1">Average Return</div>
                <div className="flex items-center">
                  <div className="w-full bg-slate-700 h-2 rounded-full mr-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "12%" }}></div>
                  </div>
                  <div className="text-xs text-green-400">+12%</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mt-4">
                <p>The AI prediction engine uses a combination of technical indicators, sentiment analysis, and on-chain metrics to generate trading insights. Models are retrained weekly with the latest market data.</p>
              </div>
              
              <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                <Sparkles className="h-4 w-4 mr-2" />
                Retrain AI Model
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITradingAssistant;
