
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, BarChart2, Lock, Star, CheckCircle, AlertCircle, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import tradingService from "@/services/tradingService";
import binanceService from "@/services/binanceService";
import { useNavigate } from "react-router-dom";

const strategyDescriptions = {
  "smart-ai": "Our most advanced AI model analyzes multiple data sources including market patterns, social sentiment, and economic indicators to make trading decisions with high precision.",
  "balanced": "A moderate approach balancing risk and reward, this strategy uses a combination of technical indicators and AI to identify profitable trading opportunities.",
  "conservative": "Focuses on capital preservation with smaller, more frequent trades. Lower risk but consistent returns.",
  "aggressive": "Aims for higher returns with more aggressive position sizes and higher risk tolerance. Recommended for experienced traders only."
};

const AutomatedTradingSetup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedStrategy, setSelectedStrategy] = useState("smart-ai");
  const [riskLevel, setRiskLevel] = useState(50);
  const [isConnected, setIsConnected] = useState(binanceService.hasCredentials());
  const [isLoading, setIsLoading] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [autoReinvest, setAutoReinvest] = useState(true);
  const [enableSafeguards, setEnableSafeguards] = useState(true);
  const [selectedPairs, setSelectedPairs] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const [initialAmount, setInitialAmount] = useState("100");
  
  const strategyIcons = {
    "smart-ai": <Brain className="h-5 w-5 text-purple-400" />,
    "balanced": <BarChart2 className="h-5 w-5 text-blue-400" />,
    "conservative": <Lock className="h-5 w-5 text-green-400" />,
    "aggressive": <Zap className="h-5 w-5 text-orange-400" />
  };
  
  const handleContinue = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      completeSetup();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };
  
  const connectBinance = () => {
    // In a real application, this would redirect to Binance API setup or OAuth
    navigate("/settings");
    toast.info("Please set up your Binance API credentials");
  };
  
  const completeSetup = async () => {
    setIsLoading(true);
    try {
      // Update trading bot settings with user preferences
      tradingService.updateBotSettings({
        tradingPairs: selectedPairs,
        riskLevel: riskLevel,
        useTrailingStopLoss: riskLevel > 40, // Enable trailing stop loss for moderate to high risk
        useTakeProfit: true,
        useDynamicPositionSizing: true
      });
      
      // Enable AI-based functions based on the selected strategy
      if (selectedStrategy === "smart-ai") {
        // Enable advanced AI features by sending events to the trading service
        window.dispatchEvent(new CustomEvent('enable-advanced-ai'));
      }
      
      // Start the bot for automated trading
      const success = await tradingService.startTrading();
      
      if (success) {
        setSetupCompleted(true);
        toast.success("Your AI trading bot has been set up and is now live!", {
          duration: 5000
        });
      } else {
        toast.error("There was an issue starting the trading bot");
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStrategyDescription = (strategy: string) => {
    return strategyDescriptions[strategy as keyof typeof strategyDescriptions] || "";
  };
  
  const getRiskText = (risk: number) => {
    if (risk < 30) return "Low Risk: Prioritizes capital preservation with smaller position sizes and tighter stop losses.";
    if (risk < 60) return "Moderate Risk: Balanced approach with moderate position sizes and standard risk management.";
    return "High Risk: Larger position sizes and wider stop losses for potentially higher returns.";
  };
  
  if (setupCompleted) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border-slate-800 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto rounded-full w-16 h-16 bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="text-green-400 h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">Your AI Trading Bot is Now Live!</h2>
            <p className="text-blue-200 mb-4">Your intelligent trading assistant is now searching for profitable opportunities.</p>
            
            <div className="w-full bg-blue-950/50 rounded-full h-2 mb-5">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Risk Level</div>
                <div className="text-lg font-semibold text-white">{riskLevel}%</div>
              </div>
              <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Strategy</div>
                <div className="text-lg font-semibold text-white flex items-center justify-center">
                  {strategyIcons[selectedStrategy as keyof typeof strategyIcons]}
                  <span className="ml-1.5">
                    {selectedStrategy === "smart-ai" ? "Smart AI" : 
                     selectedStrategy === "balanced" ? "Balanced" : 
                     selectedStrategy === "conservative" ? "Conservative" : "Aggressive"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-5">
              <Button 
                className="w-full bg-indigo-700 hover:bg-indigo-800"
                onClick={() => navigate("/")}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
            
            <p className="text-xs text-slate-300">
              Your AI assistant will continuously monitor the market and make trades according to your selected strategy and risk level.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800">
        <CardTitle className="text-white">AI Trading Bot Setup</CardTitle>
        <CardDescription className="text-slate-400">
          Configure your automated trading assistant
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="mb-5">
          <div className="flex justify-between relative mb-1">
            {[1, 2, 3].map((stepNum) => (
              <div 
                key={stepNum}
                className={`rounded-full w-8 h-8 flex items-center justify-center z-10 ${
                  stepNum < step ? 'bg-green-500 text-white' : 
                  stepNum === step ? 'bg-blue-500 text-white' : 
                  'bg-slate-700 text-slate-300'
                }`}
              >
                {stepNum < step ? <CheckCircle className="h-5 w-5" /> : stepNum}
              </div>
            ))}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700"></div>
            <div 
              className="absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-300"
              style={{ width: `${(step - 1) * 50}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>Strategy</span>
            <span>Risk Level</span>
            <span>Connect</span>
          </div>
        </div>
        
        {step === 1 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Select Trading Strategy</h3>
            
            <Tabs 
              defaultValue={selectedStrategy} 
              onValueChange={setSelectedStrategy}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-4 bg-slate-800">
                <TabsTrigger value="smart-ai" className="data-[state=active]:bg-indigo-800">
                  <Brain className="h-4 w-4 mr-1.5" />
                  Smart AI
                </TabsTrigger>
                <TabsTrigger value="balanced" className="data-[state=active]:bg-blue-800">
                  <BarChart2 className="h-4 w-4 mr-1.5" />
                  Balanced
                </TabsTrigger>
                <TabsTrigger value="conservative" className="data-[state=active]:bg-green-800">
                  <Lock className="h-4 w-4 mr-1.5" />
                  Safe
                </TabsTrigger>
                <TabsTrigger value="aggressive" className="data-[state=active]:bg-orange-800">
                  <Zap className="h-4 w-4 mr-1.5" />
                  Aggressive
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="smart-ai" className="p-4 bg-slate-800/50 rounded-lg mt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-900/50 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-300">Smart AI Strategy</h4>
                    <p className="text-sm text-slate-300">{getStrategyDescription("smart-ai")}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <span className="text-xs text-blue-300 ml-2">Recommended for beginners</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="balanced" className="p-4 bg-slate-800/50 rounded-lg mt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-900/50 p-2 rounded-lg">
                    <BarChart2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-300">Balanced Strategy</h4>
                    <p className="text-sm text-slate-300">{getStrategyDescription("balanced")}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400/30" />
                      <span className="text-xs text-blue-300 ml-2">Good for most traders</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="conservative" className="p-4 bg-slate-800/50 rounded-lg mt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-green-900/50 p-2 rounded-lg">
                    <Lock className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-300">Conservative Strategy</h4>
                    <p className="text-sm text-slate-300">{getStrategyDescription("conservative")}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400/30" />
                      <Star className="h-3.5 w-3.5 text-yellow-400/30" />
                      <span className="text-xs text-blue-300 ml-2">Capital preservation focused</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="aggressive" className="p-4 bg-slate-800/50 rounded-lg mt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-900/50 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-300">Aggressive Strategy</h4>
                    <p className="text-sm text-slate-300">{getStrategyDescription("aggressive")}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <Star className="h-3.5 w-3.5 text-yellow-400/30" />
                      <span className="text-xs text-orange-300 ml-2">For experienced traders</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Trading Pairs</h4>
              <div className="grid grid-cols-3 gap-2">
                {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT"].map((pair) => (
                  <Button
                    key={pair}
                    variant={selectedPairs.includes(pair) ? "default" : "outline"}
                    className={`text-xs ${
                      selectedPairs.includes(pair) 
                        ? "bg-indigo-700 hover:bg-indigo-800 text-white" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                    }`}
                    onClick={() => {
                      if (selectedPairs.includes(pair)) {
                        if (selectedPairs.length > 1) { // Don't allow removing all pairs
                          setSelectedPairs(selectedPairs.filter(p => p !== pair));
                        }
                      } else {
                        setSelectedPairs([...selectedPairs, pair]);
                      }
                    }}
                  >
                    {pair.replace("USDT", "")}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-reinvest" className="text-sm text-slate-200">
                    Auto-reinvest profits
                  </Label>
                  <Switch 
                    id="auto-reinvest" 
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-safeguards" className="text-sm text-slate-200">
                    Enable loss protection
                  </Label>
                  <Switch 
                    id="enable-safeguards" 
                    checked={enableSafeguards}
                    onCheckedChange={setEnableSafeguards}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Set Risk Level</h3>
            
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-200">Risk Level</span>
                <span className={`text-sm font-medium ${
                  riskLevel < 30 ? 'text-green-400' : 
                  riskLevel < 60 ? 'text-blue-400' : 
                  'text-orange-400'
                }`}>{riskLevel}%</span>
              </div>
              
              <Slider 
                value={[riskLevel]} 
                min={10} 
                max={90} 
                step={5} 
                onValueChange={(values) => setRiskLevel(values[0])}
                className="my-4"
              />
              
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-400">Conservative</span>
                <span className="text-blue-400">Balanced</span>
                <span className="text-orange-400">Aggressive</span>
              </div>
              
              <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
                {getRiskText(riskLevel)}
              </div>
            </div>
            
            <div className="mb-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Initial Investment</h4>
              <div className="flex gap-2">
                {["50", "100", "250", "500", "1000"].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className={`text-xs flex-1 ${
                      initialAmount === amount 
                        ? "bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-600" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                    }`}
                    onClick={() => setInitialAmount(amount)}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                This is the suggested starting amount for this strategy. You'll be able to adjust this later.
              </p>
            </div>
            
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg mb-5">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-200">Expected Performance</p>
                  <p className="text-xs text-blue-300 mt-1">
                    Based on historical performance, this strategy with your selected risk level has shown:
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-blue-900/40 p-2 rounded text-center">
                      <div className="text-xs text-blue-200">Monthly</div>
                      <div className="text-base font-semibold text-green-300">+{riskLevel * 0.08 + 1.5}%</div>
                    </div>
                    <div className="bg-blue-900/40 p-2 rounded text-center">
                      <div className="text-xs text-blue-200">Volatility</div>
                      <div className="text-base font-semibold text-blue-300">{riskLevel * 0.1 + 5}%</div>
                    </div>
                    <div className="bg-blue-900/40 p-2 rounded text-center">
                      <div className="text-xs text-blue-200">Win Rate</div>
                      <div className="text-base font-semibold text-green-300">{90 - riskLevel * 0.2}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Connect Your Account</h3>
            
            {!isConnected ? (
              <div className="p-5 rounded-lg bg-slate-800/50 border border-slate-700 text-center mb-5">
                <div className="rounded-full w-16 h-16 bg-indigo-900/30 flex items-center justify-center mx-auto mb-3">
                  <Lock className="h-8 w-8 text-indigo-400" />
                </div>
                <h4 className="text-white font-medium mb-2">Connect to Binance</h4>
                <p className="text-sm text-slate-300 mb-4">
                  To start automated trading, connect your Binance account by providing your API keys.
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={connectBinance}
                >
                  Connect Binance Account
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-800 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-200 font-medium">Binance Account Connected</p>
                    <p className="text-xs text-green-300 mt-1">
                      Your trading bot will use your Binance account for automated trading.
                    </p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-800 space-y-3">
                  <h4 className="text-white font-medium">Trading Bot Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400">Strategy</div>
                      <div className="text-white flex items-center">
                        {strategyIcons[selectedStrategy as keyof typeof strategyIcons]}
                        <span className="ml-1">
                          {selectedStrategy === "smart-ai" ? "Smart AI" : 
                           selectedStrategy === "balanced" ? "Balanced" : 
                           selectedStrategy === "conservative" ? "Conservative" : "Aggressive"}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-slate-400">Risk Level</div>
                      <div className="text-white">{riskLevel}%</div>
                    </div>
                    
                    <div>
                      <div className="text-slate-400">Trading Pairs</div>
                      <div className="text-white">{selectedPairs.length} pairs</div>
                    </div>
                    
                    <div>
                      <div className="text-slate-400">Suggested Initial</div>
                      <div className="text-white">${initialAmount} USDT</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-300 mt-2">
                    Your AI bot will automatically manage positions and execute trades according to your preferences.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 flex gap-3 justify-between">
          {step > 1 ? (
            <Button 
              variant="outline" 
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              onClick={handleBack}
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          <Button 
            className={`${
              step === 3 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleContinue}
            disabled={step === 3 && !isConnected || isLoading}
          >
            {isLoading ? (
              <>Loading...</>
            ) : step === 3 ? (
              <>Start AI Trading</>
            ) : (
              <>Continue</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomatedTradingSetup;
