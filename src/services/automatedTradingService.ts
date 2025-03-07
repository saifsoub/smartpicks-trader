
import { toast } from "sonner";
import binanceService from "./binanceService";
import heartbeatService from "./heartbeatService";

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

class AutomatedTradingService {
  private strategies: TradingStrategy[] = [];
  private backtestResults: BacktestResult[] = [];
  private riskSettings: RiskManagementSettings;
  private eventListeners: TradingEventListener[] = [];
  private isRunning: boolean = false;
  private interval: number | null = null;
  private readonly STORAGE_KEYS = {
    STRATEGIES: 'tradingStrategies',
    BACKTEST_RESULTS: 'backtestResults',
    RISK_SETTINGS: 'riskManagementSettings',
  };
  
  constructor() {
    this.loadFromStorage();
    
    // Default risk settings if none exists
    if (!this.riskSettings) {
      this.riskSettings = {
        maxPositionSize: 5, // 5% max per position
        stopLossPercentage: 2.5,
        takeProfitPercentage: 5,
        maxDailyLoss: 10,
        maxOpenPositions: 3,
        trailingStopEnabled: false
      };
      this.saveRiskSettings();
    }
    
    // Default strategies if none exist
    if (this.strategies.length === 0) {
      this.strategies = this.getDefaultStrategies();
      this.saveStrategies();
    }
    
    // Start the automated trading system if the bot is running
    const heartbeatInfo = heartbeatService.getHeartbeatInfo();
    if (heartbeatInfo.botRunning) {
      this.startAutomatedTrading();
    }
    
    // Listen for bot start/stop events
    window.addEventListener('storage', (event) => {
      if (event.key === 'botHeartbeat') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.botRunning && !this.isRunning) {
            this.startAutomatedTrading();
          } else if (!data.botRunning && this.isRunning) {
            this.stopAutomatedTrading();
          }
        } catch (error) {
          console.error('Error parsing heartbeat data:', error);
        }
      }
    });
  }
  
  private loadFromStorage(): void {
    try {
      const strategiesJson = localStorage.getItem(this.STORAGE_KEYS.STRATEGIES);
      if (strategiesJson) {
        this.strategies = JSON.parse(strategiesJson);
      }
      
      const backtestResultsJson = localStorage.getItem(this.STORAGE_KEYS.BACKTEST_RESULTS);
      if (backtestResultsJson) {
        this.backtestResults = JSON.parse(backtestResultsJson);
      }
      
      const riskSettingsJson = localStorage.getItem(this.STORAGE_KEYS.RISK_SETTINGS);
      if (riskSettingsJson) {
        this.riskSettings = JSON.parse(riskSettingsJson);
      }
    } catch (error) {
      console.error('Error loading trading data from storage:', error);
      toast.error('Failed to load trading configuration');
    }
  }
  
  private saveStrategies(): void {
    localStorage.setItem(this.STORAGE_KEYS.STRATEGIES, JSON.stringify(this.strategies));
  }
  
  private saveBacktestResults(): void {
    localStorage.setItem(this.STORAGE_KEYS.BACKTEST_RESULTS, JSON.stringify(this.backtestResults));
  }
  
  private saveRiskSettings(): void {
    localStorage.setItem(this.STORAGE_KEYS.RISK_SETTINGS, JSON.stringify(this.riskSettings));
  }
  
  private getDefaultStrategies(): TradingStrategy[] {
    return [
      {
        id: '1',
        name: 'Moving Average Crossover',
        description: 'Buys when the 9-period EMA crosses above the 21-period EMA, sells when opposite occurs',
        assets: ['BTCUSDT', 'ETHUSDT'],
        enabled: false,
        riskLevel: 'medium',
        timeframe: '1h',
        indicators: ['EMA9', 'EMA21'],
        conditions: [
          {
            type: 'crossover',
            parameters: {
              fast: 'EMA9',
              slow: 'EMA21'
            }
          }
        ],
        actions: [
          {
            type: 'buy',
            amount: {
              type: 'percentage',
              value: 25
            }
          }
        ],
        performance: {
          totalTrades: 48,
          successRate: 62.5,
          averageProfit: 1.8,
          lastUpdated: Date.now() - 86400000
        }
      },
      {
        id: '2',
        name: 'RSI Oversold Bounce',
        description: 'Buys when RSI falls below 30 and then rises back above 30',
        assets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        enabled: false,
        riskLevel: 'medium',
        timeframe: '15m',
        indicators: ['RSI14'],
        conditions: [
          {
            type: 'indicator',
            parameters: {
              indicator: 'RSI14',
              condition: 'crosses_above',
              value: 30
            }
          }
        ],
        actions: [
          {
            type: 'buy',
            amount: {
              type: 'percentage',
              value: 15
            }
          }
        ],
        performance: {
          totalTrades: 36,
          successRate: 58.3,
          averageProfit: 1.4,
          lastUpdated: Date.now() - 172800000
        }
      },
      {
        id: '3',
        name: 'MACD Momentum Strategy',
        description: 'Trades based on MACD signal line crossovers to identify momentum shifts',
        assets: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
        enabled: false,
        riskLevel: 'high',
        timeframe: '4h',
        indicators: ['MACD'],
        conditions: [
          {
            type: 'indicator',
            parameters: {
              indicator: 'MACD',
              condition: 'signal_crossover',
              direction: 'bullish'
            }
          }
        ],
        actions: [
          {
            type: 'buy',
            amount: {
              type: 'percentage',
              value: 20
            }
          }
        ],
        performance: {
          totalTrades: 24,
          successRate: 70.8,
          averageProfit: 2.6,
          lastUpdated: Date.now() - 259200000
        }
      }
    ];
  }
  
  public getStrategies(): TradingStrategy[] {
    return [...this.strategies];
  }
  
  public getStrategy(id: string): TradingStrategy | undefined {
    return this.strategies.find(s => s.id === id);
  }
  
  public addStrategy(strategy: Omit<TradingStrategy, 'id' | 'performance'>): TradingStrategy {
    const newStrategy: TradingStrategy = {
      ...strategy,
      id: Date.now().toString(),
      performance: {
        totalTrades: 0,
        successRate: 0,
        averageProfit: 0,
        lastUpdated: Date.now()
      }
    };
    
    this.strategies.push(newStrategy);
    this.saveStrategies();
    this.notifyListeners({
      event: 'strategy_added',
      strategy: newStrategy.name
    });
    
    return newStrategy;
  }
  
  public updateStrategy(strategy: TradingStrategy): void {
    const index = this.strategies.findIndex(s => s.id === strategy.id);
    if (index !== -1) {
      this.strategies[index] = strategy;
      this.saveStrategies();
      this.notifyListeners({
        event: 'strategy_updated',
        strategy: strategy.name
      });
    }
  }
  
  public deleteStrategy(id: string): void {
    const strategyName = this.strategies.find(s => s.id === id)?.name;
    this.strategies = this.strategies.filter(s => s.id !== id);
    this.saveStrategies();
    
    if (strategyName) {
      this.notifyListeners({
        event: 'strategy_deleted',
        strategy: strategyName
      });
    }
  }
  
  public getRiskSettings(): RiskManagementSettings {
    return {...this.riskSettings};
  }
  
  public updateRiskSettings(settings: RiskManagementSettings): void {
    this.riskSettings = settings;
    this.saveRiskSettings();
    this.notifyListeners({
      event: 'risk_settings_updated'
    });
  }
  
  public getBacktestResults(): BacktestResult[] {
    return [...this.backtestResults];
  }
  
  public getBacktestResultForStrategy(strategyId: string): BacktestResult | undefined {
    return this.backtestResults.find(r => r.strategyId === strategyId);
  }
  
  public async runBacktest(
    strategyId: string, 
    startDate: number, 
    endDate: number, 
    initialBalance: number
  ): Promise<BacktestResult> {
    const strategy = this.getStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy with ID ${strategyId} not found`);
    }
    
    // Notify listeners that backtest is starting
    this.notifyListeners({
      event: 'backtest_started',
      strategy: strategy.name,
      time: Date.now()
    });
    
    // For demonstration purposes, we'll simulate a backtest result
    // In a real implementation, this would involve fetching historical data
    // and simulating the strategy execution against that data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate simulated trades
    const numTrades = Math.floor(Math.random() * 30) + 20; // 20-50 trades
    const successRate = Math.random() * 0.3 + 0.5; // 50-80% success rate
    const trades = [];
    
    let currentBalance = initialBalance;
    const tradeInterval = (endDate - startDate) / numTrades;
    
    for (let i = 0; i < numTrades; i++) {
      const timestamp = startDate + (i * tradeInterval);
      const isBuy = i % 2 === 0;
      const asset = strategy.assets[Math.floor(Math.random() * strategy.assets.length)];
      const price = asset.includes('BTC') ? 50000 + (Math.random() * 10000 - 5000) :
                    asset.includes('ETH') ? 2000 + (Math.random() * 500 - 250) :
                    500 + (Math.random() * 100 - 50);
                    
      const amount = currentBalance * 0.1 / price; // 10% of current balance
      
      // For sell trades, calculate profit
      let profit;
      if (!isBuy && trades.length > 0) {
        const isSuccessful = Math.random() < successRate;
        profit = isSuccessful ? 
          amount * price * (Math.random() * 0.05 + 0.01) : // 1-6% profit
          -1 * amount * price * (Math.random() * 0.03 + 0.005); // 0.5-3.5% loss
          
        currentBalance += profit;
      }
      
      trades.push({
        timestamp,
        type: isBuy ? 'buy' : 'sell',
        asset,
        price,
        amount,
        ...(profit !== undefined && { profit })
      });
    }
    
    // Calculate metrics
    const winningTrades = trades.filter(t => t.profit !== undefined && t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit !== undefined && t.profit < 0).length;
    const winRate = winningTrades / (winningTrades + losingTrades);
    
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(trades.reduce((sum, t) => sum + (t.profit && t.profit < 0 ? t.profit : 0), 0));
    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
    
    // Calculate maximum drawdown
    let peak = initialBalance;
    let maxDrawdown = 0;
    let runningBalance = initialBalance;
    
    for (const trade of trades) {
      if (trade.profit) {
        runningBalance += trade.profit;
        
        if (runningBalance > peak) {
          peak = runningBalance;
        }
        
        const drawdown = (peak - runningBalance) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    const backtestResult: BacktestResult = {
      strategyId,
      startDate,
      endDate,
      initialBalance,
      finalBalance: currentBalance,
      trades,
      metrics: {
        totalTrades: winningTrades + losingTrades,
        winRate: winRate * 100,
        profitFactor,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio: 1.5 // Simplified calculation
      }
    };
    
    // Save the backtest result
    const existingIndex = this.backtestResults.findIndex(r => r.strategyId === strategyId);
    if (existingIndex !== -1) {
      this.backtestResults[existingIndex] = backtestResult;
    } else {
      this.backtestResults.push(backtestResult);
    }
    
    this.saveBacktestResults();
    
    // Notify listeners that backtest is complete
    this.notifyListeners({
      event: 'backtest_completed',
      strategy: strategy.name,
      time: Date.now()
    });
    
    return backtestResult;
  }
  
  public startAutomatedTrading(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting automated trading system');
    
    // Check for strategy triggers every minute
    this.interval = window.setInterval(() => this.checkStrategies(), 60000);
    
    // Run immediately upon start
    this.checkStrategies();
    
    this.notifyListeners({
      event: 'trading_started',
      time: Date.now()
    });
  }
  
  public stopAutomatedTrading(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('Stopping automated trading system');
    
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.notifyListeners({
      event: 'trading_stopped',
      time: Date.now()
    });
  }
  
  private async checkStrategies(): Promise<void> {
    if (!this.isRunning) return;
    
    const enabledStrategies = this.strategies.filter(s => s.enabled);
    if (enabledStrategies.length === 0) return;
    
    try {
      console.log(`Checking ${enabledStrategies.length} active trading strategies`);
      
      // Get current prices
      const prices = await binanceService.getPrices();
      
      for (const strategy of enabledStrategies) {
        // In a real implementation, this would evaluate the strategy conditions
        // against current market data. For demo purposes, we'll randomly trigger
        // strategies occasionally.
        
        if (Math.random() > 0.8) { // 20% chance to trigger
          const asset = strategy.assets[Math.floor(Math.random() * strategy.assets.length)];
          const price = prices[asset] || '0';
          
          console.log(`Strategy "${strategy.name}" triggered for ${asset} at ${price}`);
          
          this.notifyListeners({
            event: 'strategy_triggered',
            strategy: strategy.name,
            symbol: asset,
            price,
            time: Date.now()
          });
          
          // In a real implementation, this would execute the strategy's actions
          // (e.g., placing buy/sell orders) according to risk management settings
        }
      }
    } catch (error) {
      console.error('Error checking strategies:', error);
    }
  }
  
  public subscribeToUpdates(listener: TradingEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(event: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

const automatedTradingService = new AutomatedTradingService();
export default automatedTradingService;
