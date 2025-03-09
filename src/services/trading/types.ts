
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
  // New fields for ML strategies
  mlEnabled?: boolean;
  mlModel?: string;
  sentimentAnalysis?: boolean;
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
  dynamicPositionSizing?: boolean;
  riskPerTrade?: number; // Percentage of portfolio to risk per trade
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
  ML_MODELS: 'mlModels',
  ML_SETTINGS: 'mlSettings',
  NETWORK_STATUS: 'networkStatus',
  CONNECTION_BYPASS: 'connectionBypass',
  DIRECT_API: 'directApi',
  OFFLINE_MODE: 'offlineMode'
};

export interface MarketAnalysis {
  symbol: string;
  timeframe: string;
  indicators: {
    rsi: number;
    macd: {
      line: number;
      signal: number;
      histogram: number;
    };
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  trend: 'strong_uptrend' | 'uptrend' | 'neutral' | 'downtrend' | 'strong_downtrend';
  signal: 'BUY' | 'SELL' | 'HOLD';
  currentPrice?: number;
  // New fields for sentiment analysis
  sentiment?: {
    score: number;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  // New fields for ML predictions
  prediction?: {
    predictedPrice: number;
    confidence: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface Position {
  symbol: string;
  entryPrice: number;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStop: number | null;
  entryTime: number;
  side: 'long' | 'short';
}

export interface BalanceInfo {
  available: string;
  total: string;
  usdValue?: number;
}

// New interfaces for ML/AI features

export interface MLModel {
  id: string;
  name: string;
  type: 'price_prediction' | 'sentiment_analysis' | 'reinforcement_learning';
  description: string;
  status: 'training' | 'ready' | 'failed';
  accuracy: number;
  lastUpdated: number;
  parameters: Record<string, any>;
}

export interface MLPrediction {
  modelId: string;
  symbol: string;
  timestamp: number;
  predictedValue: number;
  actualValue?: number;
  confidence: number;
  features: string[];
}

export interface SentimentSource {
  id: string;
  name: string;
  type: 'news' | 'social' | 'forum';
  url: string;
  weight: number;
  enabled: boolean;
}

export interface WebSocketStreamData {
  stream: string;
  data: any;
  timestamp: number;
}

// New type for network status
export interface NetworkStatus {
  isOnline: boolean;
  lastSuccessfulConnection: number;
  connectionErrors: number;
  bypassChecks: boolean;
  directApi: boolean;
  offlineMode: boolean;
}
