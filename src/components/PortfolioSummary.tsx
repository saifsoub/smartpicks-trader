
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUp, ArrowDown, DollarSign, AlertTriangle, Settings } from "lucide-react";
import binanceService, { BinanceBalance } from "@/services/binanceService";
import { toast } from "sonner";

interface EnhancedBalance extends BinanceBalance {
  usdValue: number;
  priceChangePercent: string;
}

const PortfolioSummary: React.FC = () => {
  const [balances, setBalances] = useState<EnhancedBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check initial connection state and load portfolio
    checkConnectionAndLoadPortfolio();
    
    // Refresh portfolio data more frequently (every 30 seconds)
    const interval = setInterval(() => {
      if (isConnected) {
        loadPortfolio();
      }
    }, 30000);
    
    // Listen for credential updates from settings page
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
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Check connection
      try {
        await binanceService.testConnection();
        setIsConnected(true); // Assume connected even if test has issues
        await loadPortfolio();
      } catch (error) {
        console.error("Connection test error:", error);
        // Still set connected if we have credentials, despite errors
        // This helps with CORS issues in browser environment
        setIsConnected(true);
        await loadPortfolio();
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Get account balances
      const accountInfo = await binanceService.getAccountInfo();
      
      if (!accountInfo || !accountInfo.balances) {
        throw new Error("Invalid account data received");
      }
      
      // Get current prices to calculate USD values
      const prices = await binanceService.getPrices();
      
      // Get symbol info for percent changes
      const symbols = await binanceService.getSymbols();
      
      // Process the data with the account info and returned prices/symbols
      processPortfolioData(accountInfo, prices, symbols);
    } catch (error) {
      console.error("Failed to load portfolio data:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load portfolio data");
      toast.error("Failed to load portfolio data. Please check your API connection.");
      setBalances([]);
      setTotalValue(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to process portfolio data
  const processPortfolioData = (accountInfo: any, prices?: Record<string, string>, symbols?: any[]) => {
    try {
      // Process balances to include USD values and changes
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
              usdValue = (parseFloat(balance.free) + parseFloat(balance.locked)) * parseFloat(prices[symbolKey]);
              
              // Find price change percentage
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
      
      // Calculate total portfolio value
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
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Portfolio Summary</CardTitle>
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
      </CardHeader>
      <CardContent className="pt-4">
        {!isConnected ? (
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
              <div className="mb-4 flex items-center justify-between">
                <span className="text-slate-200">Total Value</span>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-white" />
                  <span className="text-xl font-bold text-white">{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
            
            {balances.length > 0 ? (
              <div className="space-y-3">
                {balances.map((balance, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-800">
                    <div>
                      <div className="font-medium text-white">{balance.asset}</div>
                      <div className="text-xs text-slate-200">
                        {parseFloat(balance.free).toLocaleString('en-US', { maximumFractionDigits: 8 })}
                        {parseFloat(balance.locked) > 0 && 
                          ` (${parseFloat(balance.locked).toLocaleString('en-US', { maximumFractionDigits: 8 })} locked)`
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      {parseFloat(balance.priceChangePercent) !== 0 && (
                        <div className={`flex items-center justify-end text-xs ${
                          parseFloat(balance.priceChangePercent) > 0 
                            ? 'text-green-300' 
                            : 'text-red-300'
                        }`}>
                          {parseFloat(balance.priceChangePercent) > 0 
                            ? <ArrowUp className="h-3 w-3 mr-1" /> 
                            : <ArrowDown className="h-3 w-3 mr-1" />
                          }
                          {Math.abs(parseFloat(balance.priceChangePercent)).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-200">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-300" />
                    <p>Loading portfolio data...</p>
                  </div>
                ) : (
                  <div>
                    <p>No assets found in your Binance account</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Using live Binance API
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
