
import { BacktestResult } from './types';
import StrategyManager from './strategyManager';
import persistenceManager from './persistenceManager';
import { TradingEventEmitter } from './tradingEventEmitter';

class BacktestingService {
  private backtestResults: BacktestResult[] = [];
  private strategyManager: StrategyManager;
  private eventEmitter: TradingEventEmitter;
  
  constructor(strategyManager: StrategyManager, eventEmitter: TradingEventEmitter) {
    this.strategyManager = strategyManager;
    this.eventEmitter = eventEmitter;
    this.loadBacktestResults();
  }
  
  private loadBacktestResults(): void {
    this.backtestResults = persistenceManager.loadBacktestResults();
  }
  
  private saveBacktestResults(): void {
    persistenceManager.saveBacktestResults(this.backtestResults);
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
    const strategy = this.strategyManager.getStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy with ID ${strategyId} not found`);
    }
    
    // Notify listeners that backtest is starting
    this.eventEmitter.emit({
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
    this.eventEmitter.emit({
      event: 'backtest_completed',
      strategy: strategy.name,
      time: Date.now()
    });
    
    return backtestResult;
  }
}

export default BacktestingService;
