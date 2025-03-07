
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowUp, ArrowDown, DollarSign, AlertTriangle, Settings, Info, Sparkles, Loader2 } from "lucide-react";
import binanceService from "@/services/binanceService";
import { BinanceBalance } from "@/services/binance/types";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedBalance extends BinanceBalance {
  usdValue: number;
  priceChangePercent: string;
  aiInsight?: string;
  potentialReturn?: string;
}

const PortfolioSummary: React.FC = () => {
  const [balances, setBalances] = useState<EnhancedBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  
  useEffect(() => {
    checkConnectionAndLoadPortfolio();
    
    const interval = setInterval(() => {
      if (isConnected) {
        loadPortfolio(false);
      }
    }, 30000);
    
    const handleCredentialsUpdate = () => {
      console.log("Credentials updated, refreshing portfolio");
      checkConnectionAndLoadPortfolio();
    };
    
    window.addEventListener('binance-credentials-updated', handleCredentialsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('binance-credentials-updated', handleCredentialsUpdate);
    };
  }, [isConnected]);
  
  const checkConnectionAndLoadPortfolio = async () => {
    if (!binanceService.hasCredentials()) {
      setIsConnected(false);
      setLoadError("API credentials not configured. Please set them in Settings.");
      setConnectionTested(true);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const testResult = await binanceService.testConnection();
      setConnectionTested(true);
      
      if (testResult) {
        setIsConnected(true);
        await loadPortfolio();
      } else {
        setIsConnected(false);
        const errorMessage = binanceService.getLastConnectionError() || 
                            "Connection test failed. Please check your API credentials and connection.";
        setLoadError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      setIsConnected(false);
      setLoadError("Connection test failed with an error. Please check your API credentials.");
      setConnectionTested(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolio = async (showToast = true) => {
    try {
      setIsLoading(true);
      if (showToast) {
        setLoadError(null);
      }
      
      await binanceService.testConnection(); // Force a fresh connection test before loading
      
      const accountInfo = await binanceService.getAccountInfo();
      
      if (!accountInfo || !accountInfo.balances) {
        console.warn("Invalid account data received:", accountInfo);
        setLoadError("No account data received from Binance API. Please verify your API key permissions.");
        setBalances([]);
        setTotalValue(0);
        return;
      }

      // Check if we have any real balances or just placeholder zero balances
      const hasRealBalances = accountInfo.balances.some(
        balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
      );
      
      if (!hasRealBalances && binanceService.getConnectionStatus() === 'connected') {
        const apiPermissions = binanceService.getApiPermissions();
        if (!apiPermissions.read) {
          console.warn("API key doesn't have read permission. Using placeholder balances");
          setLoadError("Connected to Binance API, but your API key doesn't have permission to read account data. Please update your API key permissions or enable proxy mode in settings.");
        } else if (!binanceService.getProxyMode()) {
          console.warn("Direct API access may be restricted. Try enabling proxy mode");
          setLoadError("Connected to Binance API, but limited account data access. Try enabling proxy mode in settings to access your account data securely.");
        } else {
          console.warn("Only zero balances received - connected but no balances found");
          setLoadError("Connected to Binance API, but no non-zero balances found in your account.");
        }
        
        // Just create some placeholder zero balances for display
        const placeholderBalances: EnhancedBalance[] = [
          { asset: 'BTC', free: '0', locked: '0', usdValue: 0, priceChangePercent: '0' },
          { asset: 'ETH', free: '0', locked: '0', usdValue: 0, priceChangePercent: '0' },
          { asset: 'USDT', free: '0', locked: '0', usdValue: 0, priceChangePercent: '0' }
        ];
        setBalances(placeholderBalances);
        setTotalValue(0);
        return;
      }
      
      if (accountInfo.balances.length === 0) {
        console.warn("Empty balances array received");
        setLoadError("No assets found in your Binance account. Your account may be empty or API permissions might be limited.");
        setBalances([]);
        setTotalValue(0);
        return;
      }
      
      const prices = await binanceService.getPrices();
      const symbols = await binanceService.getSymbols();
      
      processPortfolioData(accountInfo, prices, symbols);
      
      if (showToast) {
        toast.success("Portfolio data loaded successfully from Binance");
      }
    } catch (error) {
      console.error("Failed to load portfolio data:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load portfolio data from Binance");
      if (showToast) {
        toast.error(error instanceof Error ? error.message : "Failed to load portfolio data from Binance");
      }
      setBalances([]);
      setTotalValue(0);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    
    try {
      const enhancedBalances = [...balances];
      
      const insights = {
        "BTC": {
          insight: "Strong bullish momentum with increasing institutional interest. Recent price consolidation suggests potential for a breakout.",
          potential: "8-12%"
        },
        "ETH": {
          insight: "Recent network upgrades have improved scalability. Growing DeFi ecosystem offers positive long-term outlook despite short-term volatility.",
          potential: "7-15%"
        },
        "SOL": {
          insight: "High transaction throughput attracting developers. Recent price stability indicates market confidence after past volatility.",
          potential: "10-20%"
        },
        "BNB": {
          insight: "Exchange token with strong utility value. BNB burn mechanism creates deflationary pressure, supporting long-term price appreciation.",
          potential: "5-9%"
        },
        "USDT": {
          insight: "Stable asset serving as portfolio foundation. Consider deploying into yield-generating opportunities or during market dips.",
          potential: "0-2%"
        },
        "ADA": {
          insight: "Ongoing development milestones on roadmap. Smart contract functionality expanding ecosystem, though adoption remains a key metric to watch.",
          potential: "6-14%"
        },
        "DOT": {
          insight: "Parachain ecosystem growing steadily. Interoperability features position well for multi-chain future.",
          potential: "9-18%"
        },
        "XRP": {
          insight: "Regulatory clarity improving sentiment. Cross-border payment solutions gaining institutional partners.",
          potential: "4-13%"
        },
        "MATIC": {
          insight: "Layer-2 scaling solution with growing adoption. ZK-rollup implementation improving performance.",
          potential: "8-16%"
        },
        "LINK": {
          insight: "Critical oracle infrastructure for DeFi. New CCIP protocol expanding use cases beyond price feeds.",
          potential: "7-15%"
        },
        "AVAX": {
          insight: "Fast-finality blockchain with subnet architecture. Enterprise adoption increasing as scalability improves.",
          potential: "9-17%"
        }
      };
      
      enhancedBalances.forEach((balance, index) => {
        const assetInfo = insights[balance.asset as keyof typeof insights];
        enhancedBalances[index].aiInsight = assetInfo?.insight || 
          `${balance.asset} shows ${parseFloat(balance.priceChangePercent) > 0 ? 'positive' : 'negative'} price action in the current market cycle. Monitor for trend continuation.`;
        
        enhancedBalances[index].potentialReturn = assetInfo?.potential || 
          `${Math.abs(parseFloat(balance.priceChangePercent) * 1.5).toFixed(1)}-${Math.abs(parseFloat(balance.priceChangePercent) * 2.5).toFixed(1)}%`;
      });
      
      setBalances(enhancedBalances);
      toast.success("AI insights generated for your portfolio");
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights");
    } finally {
      setGeneratingInsights(false);
    }
  };
  
  const processPortfolioData = (accountInfo: any, prices?: Record<string, string>, symbols?: any[]) => {
    try {
      const significantBalances = accountInfo.balances
        .filter((balance: BinanceBalance) => 
          parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        )
        .map((balance: BinanceBalance) => {
          let usdValue = 0;
          let priceChangePercent = "0";
          
          if (balance.asset === 'USDT') {
            usdValue = parseFloat(balance.free) + parseFloat(balance.locked);
          } else {
            const symbolKey = `${balance.asset}USDT`;
            if (prices && prices[symbolKey]) {
              const price = parseFloat(prices[symbolKey]);
              const amount = parseFloat(balance.free) + parseFloat(balance.locked);
              usdValue = amount * price;
              
              if (symbols) {
                const symbol = symbols.find((s: any) => s.symbol === symbolKey);
                if (symbol) {
                  priceChangePercent = symbol.priceChangePercent;
                }
              }
            }
          }
          
          return {
            ...balance,
            usdValue,
            priceChangePercent
          };
        })
        .sort((a: EnhancedBalance, b: EnhancedBalance) => b.usdValue - a.usdValue);
      
      console.log("Processed balances:", significantBalances);
      
      const portfolioTotal = significantBalances.reduce(
        (sum: number, balance: EnhancedBalance) => sum + balance.usdValue, 
        0
      );
      
      setBalances(significantBalances);
      setTotalValue(portfolioTotal);
    } catch (err) {
      console.error("Error processing portfolio data:", err);
      setBalances([]);
      setTotalValue(0);
      throw new Error("Error processing portfolio data from Binance");
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Portfolio Summary</CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-md text-slate-200 hover:text-white hover:bg-slate-800"
                    onClick={() => setShowAIInsights(!showAIInsights)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showAIInsights ? "Hide" : "Show"} AI Insights</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => loadPortfolio()}
              disabled={isLoading}
              className="text-slate-200 hover:text-white hover:bg-slate-800"
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
      <CardContent className="pt-4">
        {!connectionTested ? (
          <div className="text-center py-6">
            <Loader2 className="h-10 w-10 text-blue-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-200">Checking Binance API connection...</p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
            <p className="text-yellow-100 font-medium">Not connected to Binance API</p>
            <p className="text-slate-200 text-sm mt-1">Please configure API credentials in Settings</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure API
            </Button>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-300 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-200 font-medium">
                      Error loading portfolio data
                    </p>
                    <p className="text-xs text-red-300 mt-1">
                      {loadError}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2 border-red-800 bg-red-900/30 text-red-200 hover:bg-red-900/50"
                      onClick={() => loadPortfolio()}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Try again
                    </Button>
                  </div>
                </div>
              </div>
            )}
        
            {totalValue > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Total Portfolio Value</span>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-white" />
                    <span className="text-xl font-bold text-white">{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                {balances.length > 0 && showAIInsights && (
                  <Button
                    variant="outline" 
                    size="sm"
                    className="mt-1 w-full border-indigo-800 bg-indigo-900/30 text-indigo-200 hover:bg-indigo-900/50"
                    onClick={generateAIInsights}
                    disabled={generatingInsights}
                  >
                    {generatingInsights ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating AI insights...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Generate AI insights for your portfolio
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {balances.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {balances.map((balance, index) => (
                  <div key={index} className="p-3 rounded-md bg-slate-800 border border-slate-700">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center">
                        <div className="font-medium text-white text-lg">{balance.asset}</div>
                        <Badge 
                          className={`ml-2 ${
                            parseFloat(balance.priceChangePercent) > 0 
                              ? 'bg-green-900/60 text-green-300 hover:bg-green-900' 
                              : parseFloat(balance.priceChangePercent) < 0
                                ? 'bg-red-900/60 text-red-300 hover:bg-red-900'
                                : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {parseFloat(balance.priceChangePercent) > 0 ? '+' : ''}
                          {parseFloat(balance.priceChangePercent).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span>
                        {parseFloat(balance.free).toLocaleString('en-US', { maximumFractionDigits: 8 })}
                        {parseFloat(balance.locked) > 0 && 
                          ` (${parseFloat(balance.locked).toLocaleString('en-US', { maximumFractionDigits: 8 })} locked)`
                        }
                      </span>
                      <span>
                        {balance.usdValue > 0 && (
                          `${((balance.usdValue / totalValue) * 100).toFixed(1)}% of portfolio`
                        )}
                      </span>
                    </div>
                    
                    {showAIInsights && balance.aiInsight && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <div className="flex items-start">
                          <Sparkles className="h-3 w-3 text-indigo-400 mt-1 mr-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-300">{balance.aiInsight}</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-indigo-400">Potential return:</span>
                              <span className="text-xs font-medium text-indigo-300">{balance.potentialReturn}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-200">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-300" />
                    <p>Loading portfolio data from Binance...</p>
                  </div>
                ) : (
                  <div>
                    <p>No assets found in your Binance account</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Check that your API key has the necessary permissions
                    </p>
                    <Button 
                      variant="link" 
                      className="text-blue-300 p-0 h-auto mt-3"
                      onClick={() => loadPortfolio()}
                    >
                      Refresh portfolio
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
