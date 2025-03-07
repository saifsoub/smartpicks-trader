
import binanceService from '../binanceService';
import StrategyManager from './strategyManager';
import { TradingEventEmitter } from './tradingEventEmitter';

class StrategyExecutor {
  private isRunning: boolean = false;
  private interval: number | null = null;
  private strategyManager: StrategyManager;
  private eventEmitter: TradingEventEmitter;
  
  constructor(strategyManager: StrategyManager, eventEmitter: TradingEventEmitter) {
    this.strategyManager = strategyManager;
    this.eventEmitter = eventEmitter;
  }
  
  public startTrading(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting automated trading system');
    
    // Check for strategy triggers every minute
    this.interval = window.setInterval(() => this.checkStrategies(), 60000);
    
    // Run immediately upon start
    this.checkStrategies();
    
    this.eventEmitter.emit({
      event: 'trading_started',
      time: Date.now()
    });
  }
  
  public stopTrading(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('Stopping automated trading system');
    
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.eventEmitter.emit({
      event: 'trading_stopped',
      time: Date.now()
    });
  }
  
  public isActive(): boolean {
    return this.isRunning;
  }
  
  private async checkStrategies(): Promise<void> {
    if (!this.isRunning) return;
    
    const enabledStrategies = this.strategyManager.getStrategies().filter(s => s.enabled);
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
          
          this.eventEmitter.emit({
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
}

export default StrategyExecutor;
