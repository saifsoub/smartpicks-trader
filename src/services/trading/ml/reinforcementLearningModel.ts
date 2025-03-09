import { MarketAnalysis } from '../types';

/**
 * State representation for RL model
 */
interface State {
  rsi: number;
  macdHistogram: number;
  bollingerWidth: number;
  pricePosition: number; // Position of price relative to Bollinger Bands (0-1)
  recentTrend: number; // -1 to 1 representing downtrend to uptrend
  volatility: number;
}

/**
 * Action that can be taken by the RL agent
 */
type Action = 'BUY' | 'SELL' | 'HOLD';

/**
 * Simple Q-table implementation for reinforcement learning
 * In a real implementation, this would use a neural network
 */
export class ReinforcementLearningModel {
  private qTable: Map<string, Map<Action, number>> = new Map();
  private learningRate: number = 0.1;
  private discountFactor: number = 0.9;
  private explorationRate: number = 0.2;
  private isTraining: boolean = false;
  private modelName: string;
  
  constructor(modelName: string) {
    this.modelName = modelName;
    this.initializeQTable();
  }
  
  /**
   * Initialize Q-table with default values
   */
  private initializeQTable(): void {
    // In a real implementation, this would load pre-trained weights
    // For now, we'll just create a simple Q-table with some default values
    console.log(`Initializing Q-table for ${this.modelName}`);
  }
  
  /**
   * Convert market analysis to a state representation
   */
  private getState(marketAnalysis: MarketAnalysis): State {
    const { indicators, trend } = marketAnalysis;
    
    // Calculate price position within Bollinger Bands (0 = at lower band, 1 = at upper band)
    const range = indicators.bollinger.upper - indicators.bollinger.lower;
    const pricePosition = range > 0 ? 
      (marketAnalysis.currentPrice! - indicators.bollinger.lower) / range : 
      0.5;
    
    // Convert trend to numerical value
    let trendValue = 0;
    switch (trend) {
      case 'strong_uptrend': trendValue = 1; break;
      case 'uptrend': trendValue = 0.5; break;
      case 'neutral': trendValue = 0; break;
      case 'downtrend': trendValue = -0.5; break;
      case 'strong_downtrend': trendValue = -1; break;
    }
    
    // Calculate Bollinger Band width (volatility indicator)
    const bollingerWidth = range / indicators.bollinger.middle;
    
    // Simplified state representation
    return {
      rsi: indicators.rsi / 100, // Normalize to 0-1
      macdHistogram: indicators.macd.histogram,
      bollingerWidth,
      pricePosition,
      recentTrend: trendValue,
      volatility: bollingerWidth // Using BB width as a proxy for volatility
    };
  }
  
  /**
   * Get a string key representation of a state
   */
  private getStateKey(state: State): string {
    // Discretize continuous values to create a finite state space
    const discretizedState = {
      rsi: Math.floor(state.rsi * 10) / 10,
      macdHistogram: Math.sign(state.macdHistogram),
      bollingerWidth: Math.floor(state.bollingerWidth * 5) / 5,
      pricePosition: Math.floor(state.pricePosition * 10) / 10,
      recentTrend: Math.sign(state.recentTrend),
      volatility: state.volatility > 0.05 ? 'high' : 'low'
    };
    
    return JSON.stringify(discretizedState);
  }
  
  /**
   * Get the best action for a given state
   */
  private getBestAction(stateKey: string): Action {
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map([
        ['BUY', 0],
        ['SELL', 0],
        ['HOLD', 0]
      ]));
    }
    
    const actionValues = this.qTable.get(stateKey)!;
    let bestAction: Action = 'HOLD';
    let bestValue = -Infinity;
    
    actionValues.forEach((value, action) => {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    });
    
    return bestAction;
  }
  
  /**
   * Select an action using epsilon-greedy policy
   */
  private selectAction(stateKey: string): Action {
    // In training mode, occasionally select random action for exploration
    if (this.isTraining && Math.random() < this.explorationRate) {
      const actions: Action[] = ['BUY', 'SELL', 'HOLD'];
      return actions[Math.floor(Math.random() * actions.length)];
    }
    
    // Otherwise select the best action
    return this.getBestAction(stateKey);
  }
  
  /**
   * Predict the best action for a given market state
   */
  public predict(marketAnalysis: MarketAnalysis): Action {
    // Convert market analysis to state
    const state = this.getState(marketAnalysis);
    const stateKey = this.getStateKey(state);
    
    // Select action based on current policy
    return this.selectAction(stateKey);
  }
  
  /**
   * Update the model with the result of an action
   */
  public update(
    marketAnalysis: MarketAnalysis, 
    action: Action, 
    reward: number, 
    nextMarketAnalysis: MarketAnalysis
  ): void {
    if (!this.isTraining) return;
    
    // Convert states to keys
    const state = this.getState(marketAnalysis);
    const nextState = this.getState(nextMarketAnalysis);
    const stateKey = this.getStateKey(state);
    const nextStateKey = this.getStateKey(nextState);
    
    // Ensure state exists in Q-table
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map([
        ['BUY', 0],
        ['SELL', 0],
        ['HOLD', 0]
      ]));
    }
    
    // Get current Q-value
    const actionValues = this.qTable.get(stateKey)!;
    const currentQValue = actionValues.get(action) || 0;
    
    // Get maximum Q-value for next state
    const nextBestAction = this.getBestAction(nextStateKey);
    const nextActionValues = this.qTable.get(nextStateKey) || new Map([
      ['BUY', 0],
      ['SELL', 0],
      ['HOLD', 0]
    ]);
    const nextQValue = nextActionValues.get(nextBestAction) || 0;
    
    // Update Q-value using Q-learning formula
    const newQValue = currentQValue + this.learningRate * (
      reward + this.discountFactor * nextQValue - currentQValue
    );
    
    // Update Q-table
    actionValues.set(action, newQValue);
  }
  
  /**
   * Set training mode
   */
  public setTrainingMode(isTraining: boolean): void {
    this.isTraining = isTraining;
    
    // Reduce exploration when not in training
    if (!isTraining) {
      this.explorationRate = 0.05;
    } else {
      this.explorationRate = 0.2;
    }
  }
  
  /**
   * Save model
   */
  public save(): string {
    // In a real implementation, this would save the model weights to a file
    // For now, we'll just serialize the Q-table
    const serialized: Record<string, Record<Action, number>> = {};
    
    this.qTable.forEach((actionValues, stateKey) => {
      serialized[stateKey] = Object.fromEntries(actionValues) as Record<Action, number>;
    });
    
    return JSON.stringify(serialized);
  }
  
  /**
   * Load model
   */
  public load(serialized: string): void {
    // In a real implementation, this would load model weights from a file
    // For now, we'll just deserialize the Q-table
    try {
      const parsed = JSON.parse(serialized);
      this.qTable.clear();
      
      Object.entries(parsed).forEach(([stateKey, actionValues]) => {
        this.qTable.set(stateKey, new Map(Object.entries(actionValues) as [Action, number][]));
      });
      
      console.log(`Loaded model with ${this.qTable.size} states`);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }
}
