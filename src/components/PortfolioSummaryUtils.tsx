
import { BinanceBalance, BalanceInfo } from "@/services/binance/types";
import { isDefaultBalance } from "@/services/binance/accountUtils";

interface EnhancedBalance extends BinanceBalance {
  usdValue: number;
  priceChangePercent: string;
  aiInsight?: string;
  potentialReturn?: string;
  isDefault?: boolean;
}

export interface ProcessedPortfolioData {
  balances: EnhancedBalance[];
  totalValue: number;
  isDefault: boolean;
}

export const processPortfolioData = (
  accountInfo: any, 
  prices?: Record<string, string>, 
  symbols?: any[]
): ProcessedPortfolioData => {
  try {
    console.log("Processing portfolio data...");
    console.log("Account info:", accountInfo);
    
    // Check if we're using default data
    const isDefaultData = accountInfo && accountInfo.balances && 
      (isDefaultBalance(accountInfo.balances) || accountInfo.isDefault === true);
    
    if (isDefaultData) {
      console.warn("DETECTED DEFAULT DATA IN PORTFOLIO PROCESSING");
    }
    
    // Safety check for balances
    if (!accountInfo || !accountInfo.balances || !Array.isArray(accountInfo.balances)) {
      console.error("Invalid account info format:", accountInfo);
      return { balances: [], totalValue: 0, isDefault: true };
    }
    
    const significantBalances = accountInfo.balances
      .filter((balance: BinanceBalance) => {
        const freeAmount = parseFloat(balance.free);
        const lockedAmount = parseFloat(balance.locked);
        const hasBalance = freeAmount > 0.000000001 || lockedAmount > 0.000000001;
        return hasBalance;
      })
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
          priceChangePercent,
          isDefault: isDefaultData
        };
      })
      .sort((a: EnhancedBalance, b: EnhancedBalance) => b.usdValue - a.usdValue);
    
    const portfolioTotal = significantBalances.reduce(
      (sum: number, balance: EnhancedBalance) => sum + balance.usdValue, 
      0
    );
    
    console.log(`Processed ${significantBalances.length} balances with total value: ${portfolioTotal}`);
    console.log(`Is default data: ${isDefaultData}`);
    
    return {
      balances: significantBalances,
      totalValue: portfolioTotal,
      isDefault: isDefaultData
    };
  } catch (err) {
    console.error("Error processing portfolio data:", err);
    return {
      balances: [],
      totalValue: 0,
      isDefault: true
    };
  }
};

export const generateAIInsightsForBalances = (balances: EnhancedBalance[]): EnhancedBalance[] => {
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
  
  return enhancedBalances;
};
