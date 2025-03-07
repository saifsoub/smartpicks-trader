
import { TradingStrategy } from './types';
import persistenceManager from './persistenceManager';
import { TradingEventEmitter } from './tradingEventEmitter';

class StrategyManager {
  private strategies: TradingStrategy[] = [];
  private eventEmitter: TradingEventEmitter;
  
  constructor(eventEmitter: TradingEventEmitter) {
    this.eventEmitter = eventEmitter;
    this.loadStrategies();
  }
  
  private loadStrategies(): void {
    this.strategies = persistenceManager.loadStrategies();
    
    // Default strategies if none exist
    if (this.strategies.length === 0) {
      this.strategies = this.getDefaultStrategies();
      this.saveStrategies();
    }
  }
  
  private saveStrategies(): void {
    persistenceManager.saveStrategies(this.strategies);
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
    this.eventEmitter.emit({
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
      this.eventEmitter.emit({
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
      this.eventEmitter.emit({
        event: 'strategy_deleted',
        strategy: strategyName
      });
    }
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
}

export default StrategyManager;
