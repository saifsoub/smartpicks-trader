
import mlService from '../ml/mlService';
import { MarketAnalysis, TradingStrategy } from '../types';

/**
 * Strategy type enum
 */
export enum StrategyType {
  MEAN_REVERSION = 'mean_reversion',
  MOMENTUM = 'momentum',
  MARKET_MAKING = 'market_making',
  REINFORCEMENT_LEARNING = 'reinforcement_learning',
  SENTIMENT_BASED = 'sentiment_based'
}

/**
 * Strategy interface
 */
export interface ITradingStrategy {
  analyze(symbol: string, data: any, marketAnalysis: MarketAnalysis): Promise<string>;
  getName(): string;
  getDescription(): string;
}

/**
 * Mean Reversion Strategy
 * Buys when price is below a certain threshold and sells when it's above
 */
class MeanReversionStrategy implements ITradingStrategy {
  getName(): string {
    return 'Mean Reversion';
  }
  
  getDescription(): string {
    return 'Buys when price is below the lower Bollinger Band and sells when it\'s above the upper Bollinger Band';
  }
  
  async analyze(symbol: string, data: any, marketAnalysis: MarketAnalysis): Promise<string> {
    const { indicators, currentPrice } = marketAnalysis;
    
    if (currentPrice < indicators.bollinger.lower) {
      return 'BUY';
    } else if (currentPrice > indicators.bollinger.upper) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
}

/**
 * Momentum Strategy
 * Follows the trend, buying on uptrends and selling on downtrends
 */
class MomentumStrategy implements ITradingStrategy {
  getName(): string {
    return 'Momentum';
  }
  
  getDescription(): string {
    return 'Buys when there\'s upward momentum and sells when there\'s downward momentum';
  }
  
  async analyze(symbol: string, data: any, marketAnalysis: MarketAnalysis): Promise<string> {
    const { indicators, trend } = marketAnalysis;
    
    if (trend === 'strong_uptrend' && indicators.macd.histogram > 0) {
      return 'BUY';
    } else if (trend === 'strong_downtrend' && indicators.macd.histogram < 0) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
}

/**
 * Reinforcement Learning Strategy
 * Uses ML models to make trading decisions
 */
class ReinforcementLearningStrategy implements ITradingStrategy {
  getName(): string {
    return 'Reinforcement Learning';
  }
  
  getDescription(): string {
    return 'Uses advanced AI models to make trading decisions based on market conditions';
  }
  
  async analyze(symbol: string, data: any, marketAnalysis: MarketAnalysis): Promise<string> {
    // Use the ML service to generate a trading signal
    return await mlService.generateTradingSignal(symbol, marketAnalysis, data.portfolioState);
  }
}

/**
 * Sentiment Based Strategy
 * Makes trading decisions based on market sentiment
 */
class SentimentBasedStrategy implements ITradingStrategy {
  getName(): string {
    return 'Sentiment Analysis';
  }
  
  getDescription(): string {
    return 'Uses news and social media sentiment to make trading decisions';
  }
  
  async analyze(symbol: string, data: any, marketAnalysis: MarketAnalysis): Promise<string> {
    // Get sentiment data from the ML service
    const sentiment = await mlService.analyzeSentiment(symbol);
    
    // Combine sentiment with technical indicators
    if (sentiment.sentiment === 'positive' && marketAnalysis.indicators.rsi < 60) {
      return 'BUY';
    } else if (sentiment.sentiment === 'negative' && marketAnalysis.indicators.rsi > 40) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
}

/**
 * Strategy Factory
 * Creates and returns different trading strategies
 */
export class StrategyFactory {
  private strategies: Map<StrategyType, ITradingStrategy> = new Map();
  
  constructor() {
    this.registerStrategies();
  }
  
  private registerStrategies(): void {
    this.strategies.set(StrategyType.MEAN_REVERSION, new MeanReversionStrategy());
    this.strategies.set(StrategyType.MOMENTUM, new MomentumStrategy());
    this.strategies.set(StrategyType.REINFORCEMENT_LEARNING, new ReinforcementLearningStrategy());
    this.strategies.set(StrategyType.SENTIMENT_BASED, new SentimentBasedStrategy());
  }
  
  public getStrategy(type: StrategyType): ITradingStrategy {
    const strategy = this.strategies.get(type);
    
    if (!strategy) {
      throw new Error(`Strategy type ${type} not found`);
    }
    
    return strategy;
  }
  
  public getAllStrategies(): ITradingStrategy[] {
    return Array.from(this.strategies.values());
  }
  
  public createStrategyConfig(type: StrategyType): Partial<TradingStrategy> {
    const strategy = this.getStrategy(type);
    
    return {
      name: strategy.getName(),
      description: strategy.getDescription(),
      enabled: false,
      riskLevel: 'medium',
      assets: ['BTCUSDT', 'ETHUSDT'],
      timeframe: '1h',
      indicators: this.getIndicatorsForStrategy(type),
      conditions: this.getConditionsForStrategy(type),
      actions: [
        {
          type: 'buy',
          amount: {
            type: 'percentage',
            value: 10
          }
        }
      ]
    };
  }
  
  private getIndicatorsForStrategy(type: StrategyType): string[] {
    switch (type) {
      case StrategyType.MEAN_REVERSION:
        return ['BB20', 'RSI14'];
      case StrategyType.MOMENTUM:
        return ['EMA9', 'EMA21', 'MACD'];
      case StrategyType.REINFORCEMENT_LEARNING:
        return ['RSI14', 'MACD', 'BB20', 'ATR14'];
      case StrategyType.SENTIMENT_BASED:
        return ['RSI14', 'SENTIMENT'];
      default:
        return ['RSI14', 'EMA21'];
    }
  }
  
  private getConditionsForStrategy(type: StrategyType): any[] {
    switch (type) {
      case StrategyType.MEAN_REVERSION:
        return [
          {
            type: 'price_crossover',
            parameters: {
              reference: 'BB20.lower',
              direction: 'below'
            }
          }
        ];
      case StrategyType.MOMENTUM:
        return [
          {
            type: 'indicator',
            parameters: {
              indicator: 'MACD',
              condition: 'histogram_positive'
            }
          }
        ];
      case StrategyType.REINFORCEMENT_LEARNING:
        return [
          {
            type: 'ml_prediction',
            parameters: {
              model: 'reinforcement_learning',
              threshold: 0.7
            }
          }
        ];
      case StrategyType.SENTIMENT_BASED:
        return [
          {
            type: 'sentiment',
            parameters: {
              source: 'all',
              sentiment: 'positive',
              threshold: 0.6
            }
          }
        ];
      default:
        return [
          {
            type: 'indicator',
            parameters: {
              indicator: 'RSI14',
              condition: 'oversold'
            }
          }
        ];
    }
  }
}

export default new StrategyFactory();
