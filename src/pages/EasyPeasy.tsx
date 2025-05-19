
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, ArrowDown, ArrowUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import binanceService from "@/services/binanceService";
import mlService from "@/services/trading/ml/mlService";
import SymbolSelector from "@/components/easyPeasy/SymbolSelector";
import ActionCard from "@/components/easyPeasy/ActionCard";
import NextActionTimer from "@/components/easyPeasy/NextActionTimer";

const EasyPeasy: React.FC = () => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionableAdvice, setActionableAdvice] = useState<any[]>([]);
  
  useEffect(() => {
    // Initialize ML service if not already initialized
    mlService.initialize().then(() => {
      // Fetch initial data for selected symbols
      fetchAdviceForSymbols();
    });
    
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(fetchAdviceForSymbols, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSymbols]);
  
  const fetchAdviceForSymbols = async () => {
    setLoading(true);
    try {
      // Get current prices for context
      const prices = await binanceService.getPrices();
      
      // Generate advice for each selected symbol
      const advicePromises = selectedSymbols.map(async (symbol) => {
        // Get historical data for predictions
        let historicalData = [];
        try {
          historicalData = await binanceService.getKlines(symbol, "1h", 24);
        } catch (error) {
          console.error(`Failed to get historical data for ${symbol}:`, error);
          // Use mock data if API fails
          historicalData = Array(24).fill({ close: prices[symbol] || "1000" });
        }
        
        // Get ML predictions
        const prediction = await mlService.predictPrice(symbol, "1h", historicalData);
        
        // Get sentiment analysis
        const sentiment = await mlService.analyzeSentiment(symbol);
        
        // Current price
        const currentPrice = parseFloat(prices[symbol] || "0");
        
        // Generate actionable advice
        const action = generateActionableAdvice(symbol, prediction, sentiment, currentPrice);
        
        return {
          symbol,
          currentPrice,
          prediction,
          sentiment,
          action,
          timestamp: Date.now(),
        };
      });
      
      const results = await Promise.all(advicePromises);
      setActionableAdvice(results);
    } catch (error) {
      console.error("Error fetching advice:", error);
      toast.error("Failed to update trading advice. Trying again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const generateActionableAdvice = (symbol: string, prediction: any, sentiment: any, currentPrice: number) => {
    // Determine action based on prediction and sentiment
    const priceChange = prediction.predictedPrice - currentPrice;
    const percentChange = (priceChange / currentPrice) * 100;
    const strongSignal = Math.abs(percentChange) > 3 || prediction.confidence > 0.75;
    
    let action = "HOLD";
    if (prediction.direction === "up" && sentiment.sentiment === "positive") {
      action = "BUY";
    } else if (prediction.direction === "down" && sentiment.sentiment === "negative") {
      action = "SELL";
    } else if (prediction.direction === "up" && prediction.confidence > 0.7) {
      action = "BUY";
    } else if (prediction.direction === "down" && prediction.confidence > 0.7) {
      action = "SELL";
    }
    
    // Calculate optimal time for action (just for demonstration)
    const now = new Date();
    const actionTime = new Date();
    
    // Set a reasonable time in the near future (1-4 hours)
    actionTime.setHours(now.getHours() + Math.floor(Math.random() * 4) + 1);
    
    // Format time as HH:MM
    const formattedTime = actionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Calculate price targets
    const entryPrice = prediction.direction === "up" 
      ? currentPrice * 0.995  // Buy slightly below current price
      : currentPrice * 1.005; // Sell slightly above current price
    
    const targetPrice = prediction.direction === "up"
      ? currentPrice * (1 + (Math.random() * 0.05 + 0.02)) // 2-7% gain
      : currentPrice * (1 - (Math.random() * 0.05 + 0.02)); // 2-7% drop
    
    const stopPrice = prediction.direction === "up"
      ? currentPrice * (1 - (Math.random() * 0.02 + 0.01)) // 1-3% loss
      : currentPrice * (1 + (Math.random() * 0.02 + 0.01)); // 1-3% rise
      
    return {
      action,
      strongSignal,
      actionTime: formattedTime,
      entryPrice: entryPrice.toFixed(2),
      targetPrice: targetPrice.toFixed(2),
      stopPrice: stopPrice.toFixed(2),
      reason: generateReason(prediction, sentiment),
    };
  };
  
  const generateReason = (prediction: any, sentiment: any) => {
    const reasons = [
      `${prediction.direction === "up" ? "Upward" : "Downward"} momentum with ${prediction.confidence.toFixed(2) * 100}% confidence`,
      `${sentiment.sentiment === "positive" ? "Positive" : sentiment.sentiment === "negative" ? "Negative" : "Neutral"} market sentiment (${sentiment.score.toFixed(2) * 100}%)`,
    ];
    
    return reasons;
  };
  
  const handleSymbolsChange = (newSymbols: string[]) => {
    setSelectedSymbols(newSymbols);
  };
  
  const handleRefresh = () => {
    fetchAdviceForSymbols();
    toast.success("Refreshing trading advice...");
  };
  
  const handleAction = (symbol: string, action: string) => {
    // In simulation mode, just show what would happen
    toast.success(`Simulated ${action} order for ${symbol}`);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 rounded-xl p-6 border border-indigo-800/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Easy Peasy</h1>
              <p className="text-purple-300">Simple, actionable trading advice for beginners</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh} 
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? "Updating..." : "Refresh Advice"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-400" />
                Select Your Symbols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SymbolSelector 
                selectedSymbols={selectedSymbols} 
                onChange={handleSymbolsChange} 
              />
              <p className="text-slate-400 text-sm mt-2">
                Select up to 5 cryptocurrencies to get simple trading advice
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {actionableAdvice.map((item) => (
            <ActionCard 
              key={item.symbol} 
              symbol={item.symbol} 
              advice={item.action} 
              currentPrice={item.currentPrice} 
              onAction={handleAction}
            />
          ))}
        </div>
        
        <div className="mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NextActionTimer actionableAdvice={actionableAdvice} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EasyPeasy;
