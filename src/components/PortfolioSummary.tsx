
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
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
  
  useEffect(() => {
    loadPortfolio();
    
    // Refresh portfolio data every minute
    const interval = setInterval(() => {
      loadPortfolio();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadPortfolio = async () => {
    if (!binanceService.hasCredentials()) {
      toast.error("Please configure Binance API credentials in Settings");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get account balances
      const accountInfo = await binanceService.getAccountInfo();
      
      // Get current prices to calculate USD values
      const prices = await binanceService.getPrices();
      
      // Get symbol info for percent changes
      const symbols = await binanceService.getSymbols();
      
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
            if (prices[symbolKey]) {
              usdValue = (parseFloat(balance.free) + parseFloat(balance.locked)) * parseFloat(prices[symbolKey]);
              
              // Find price change percentage
              const symbol = symbols.find(s => s.symbol === symbolKey);
              if (symbol) {
                priceChangePercent = symbol.priceChangePercent;
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
    } catch (error) {
      console.error("Failed to load portfolio:", error);
      toast.error("Failed to load portfolio data");
    } finally {
      setIsLoading(false);
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
            onClick={loadPortfolio}
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
      </CardHeader>
      <CardContent className="pt-4">
        {totalValue > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-slate-400">Total Value</span>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="text-xl font-bold">{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
        
        {balances.length > 0 ? (
          <div className="space-y-3">
            {balances.map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-800">
                <div>
                  <div className="font-medium">{balance.asset}</div>
                  <div className="text-xs text-slate-400">
                    {parseFloat(balance.free).toLocaleString('en-US', { maximumFractionDigits: 8 })}
                    {parseFloat(balance.locked) > 0 && 
                      ` (${parseFloat(balance.locked).toLocaleString('en-US', { maximumFractionDigits: 8 })} locked)`
                    }
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  {parseFloat(balance.priceChangePercent) !== 0 && (
                    <div className={`flex items-center justify-end text-xs ${
                      parseFloat(balance.priceChangePercent) > 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
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
          <div className="text-center py-6 text-slate-400">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin mb-3" />
                <p>Loading portfolio data...</p>
              </div>
            ) : (
              <div>
                <p>No assets found</p>
                <Button 
                  variant="link" 
                  className="text-blue-400 p-0 h-auto mt-1"
                  onClick={loadPortfolio}
                >
                  Refresh portfolio
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
