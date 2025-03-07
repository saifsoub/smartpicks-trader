
export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  assets: string[];
  enabled: boolean;
  riskLevel: "low" | "medium" | "high";
  timeframe: string;
  indicators: string[];
  conditions: {
    type: string;
    parameters: Record<string, any>;
  }[];
  actions: {
    type: "buy" | "sell";
    amount: {
      type: "percentage" | "fixed";
      value: number;
    };
  }[];
  performance: {
    totalTrades: number;
    successRate: number;
    averageProfit: number;
    lastUpdated: number;
  };
}

export interface BacktestResult {
  strategyId: string;
  startDate: number;
  endDate: number;
  initialBalance: number;
  finalBalance: number;
  trades: {
    timestamp: number;
    type: "buy" | "sell";
    asset: string;
    price: number;
    amount: number;
    profit?: number;
  }[];
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface RiskManagementSettings {
  maxPositionSize: number; // As percentage of portfolio
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxDailyLoss: number; // As percentage of portfolio
  maxOpenPositions: number;
  trailingStopEnabled: boolean;
  trailingStopPercentage?: number;
}

export type TradingEventListener = (status: {
  event: string;
  strategy?: string;
  symbol?: string;
  price?: string;
  time?: number;
}) => void;

export const STORAGE_KEYS = {
  STRATEGIES: 'tradingStrategies',
  BACKTEST_RESULTS: 'backtestResults',
  RISK_SETTINGS: 'riskManagementSettings',
};
