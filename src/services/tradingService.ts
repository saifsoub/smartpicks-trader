
import { toast } from "sonner";
import binanceService from "./binanceService";

export interface Strategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  symbol: string;
  interval: string;
  parameters: Record<string, any>;
  lastExecuted?: Date;
  performance?: string;
  trades?: number;
  winRate?: string;
}

export interface TradeSignal {
  strategy: Strategy;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: string;
  reason: string;
  timestamp: Date;
}

class TradingService {
  private strategies: Strategy[] = [];
  private isRunning = false;
  private executionInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Load strategies from localStorage
    this.loadStrategies();
  }

  private loadStrategies() {
    const savedStrategies = localStorage.getItem('tradingStrategies');
    if (savedStrategies) {
      this.strategies = JSON.parse(savedStrategies);
    } else {
      // Initialize with default strategies if none exist
      this.strategies = [
        {
          id: "1",
          name: "RSI + MACD Crossover",
          description: "Uses RSI oversold/overbought levels combined with MACD crossover signals to identify entry and exit points.",
          isActive: true,
          symbol: "BTCUSDT",
          interval: "4h",
          parameters: {
            rsiPeriod: 14,
            rsiOversold: 30,
            rsiOverbought: 70,
            macdFast: 12,
            macdSlow: 26,
            macdSignal: 9
          },
          performance: "+12.4%",
          trades: 24,
          winRate: "75%"
        },
        {
          id: "2",
          name: "Bollinger Breakout",
          description: "Identifies breakouts from Bollinger Bands to catch trending momentum moves in volatile markets.",
          isActive: true,
          symbol: "ETHUSDT",
          interval: "1h",
          parameters: {
            bbPeriod: 20,
            bbDeviation: 2,
            entryThreshold: 2.5,
            exitThreshold: 1.0,
            stopLoss: 2.0,
            takeProfit: 4.0
          },
          performance: "+8.7%",
          trades: 16,
          winRate: "68%"
        }
      ];
      this.saveStrategies();
    }
  }

  private saveStrategies() {
    localStorage.setItem('tradingStrategies', JSON.stringify(this.strategies));
  }

  public getStrategies(): Strategy[] {
    return [...this.strategies];
  }

  public getActiveStrategies(): Strategy[] {
    return this.strategies.filter(strategy => strategy.isActive);
  }

  public getStrategyById(id: string): Strategy | undefined {
    return this.strategies.find(strategy => strategy.id === id);
  }

  public addStrategy(strategy: Omit<Strategy, 'id'>): Strategy {
    const newStrategy = {
      ...strategy,
      id: Date.now().toString(),
      trades: 0,
      performance: "0.0%",
      winRate: "0%"
    };
    
    this.strategies.push(newStrategy);
    this.saveStrategies();
    toast.success(`Strategy "${newStrategy.name}" has been added`);
    return newStrategy;
  }

  public updateStrategy(updatedStrategy: Strategy): void {
    const index = this.strategies.findIndex(s => s.id === updatedStrategy.id);
    if (index !== -1) {
      this.strategies[index] = updatedStrategy;
      this.saveStrategies();
      toast.success(`Strategy "${updatedStrategy.name}" has been updated`);
    } else {
      toast.error("Strategy not found");
    }
  }

  public deleteStrategy(id: string): void {
    const index = this.strategies.findIndex(s => s.id === id);
    if (index !== -1) {
      const name = this.strategies[index].name;
      this.strategies.splice(index, 1);
      this.saveStrategies();
      toast.success(`Strategy "${name}" has been deleted`);
    } else {
      toast.error("Strategy not found");
    }
  }

  public toggleStrategyStatus(id: string): void {
    const strategy = this.strategies.find(s => s.id === id);
    if (strategy) {
      strategy.isActive = !strategy.isActive;
      this.saveStrategies();
      toast.success(`Strategy "${strategy.name}" is now ${strategy.isActive ? 'active' : 'inactive'}`);
    } else {
      toast.error("Strategy not found");
    }
  }

  public startTrading(): boolean {
    if (!binanceService.hasCredentials()) {
      toast.error("Binance API credentials not configured");
      return false;
    }

    const activeStrategies = this.getActiveStrategies();
    if (activeStrategies.length === 0) {
      toast.error("No active strategies to execute");
      return false;
    }

    if (this.isRunning) {
      toast.info("Trading bot is already running");
      return true;
    }

    // Start the trading bot execution loop
    this.isRunning = true;
    this.executionInterval = setInterval(() => this.executeStrategies(), 60000); // Check every minute
    toast.success("Trading bot started successfully");
    return true;
  }

  public stopTrading(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    this.isRunning = false;
    toast.info("Trading bot stopped");
  }

  public isBotRunning(): boolean {
    return this.isRunning;
  }

  private async executeStrategies(): Promise<void> {
    const activeStrategies = this.getActiveStrategies();
    
    for (const strategy of activeStrategies) {
      try {
        // Get current price data
        const prices = await binanceService.getPrices();
        const currentPrice = prices[strategy.symbol];
        
        if (!currentPrice) {
          console.error(`Price not found for symbol ${strategy.symbol}`);
          continue;
        }

        // Generate trade signal based on strategy
        const signal = await this.analyzeStrategy(strategy, currentPrice);
        
        // Execute trade if signal indicates
        if (signal.action !== 'HOLD') {
          this.executeTrade(signal);
        }
        
        // Update last executed time
        strategy.lastExecuted = new Date();
        this.saveStrategies();
      } catch (error) {
        console.error(`Error executing strategy ${strategy.name}:`, error);
      }
    }
  }

  private async analyzeStrategy(strategy: Strategy, currentPrice: string): Promise<TradeSignal> {
    // This is where the actual trading logic would be implemented
    // In a real implementation, you would fetch historical data and apply indicators
    
    // For now this is a placeholder implementation
    console.log(`Analyzing ${strategy.name} for ${strategy.symbol} at price $${currentPrice}`);
    
    // Implement different strategy logics
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reason = 'No signal generated';
    
    if (strategy.name === "RSI + MACD Crossover") {
      // Here you would implement real RSI + MACD strategy logic
      // This is just a placeholder
      const randomValue = Math.random();
      
      if (randomValue < 0.1) {
        action = 'BUY';
        reason = 'RSI oversold + MACD bullish crossover detected';
      } else if (randomValue > 0.9) {
        action = 'SELL';
        reason = 'RSI overbought + MACD bearish crossover detected';
      }
    } else if (strategy.name === "Bollinger Breakout") {
      // Here you would implement real Bollinger Bands strategy logic
      // This is just a placeholder
      const randomValue = Math.random();
      
      if (randomValue < 0.1) {
        action = 'BUY';
        reason = 'Price broke above upper Bollinger Band';
      } else if (randomValue > 0.9) {
        action = 'SELL';
        reason = 'Price broke below lower Bollinger Band';
      }
    }
    
    return {
      strategy,
      symbol: strategy.symbol,
      action,
      price: currentPrice,
      reason,
      timestamp: new Date()
    };
  }

  private async executeTrade(signal: TradeSignal): Promise<void> {
    try {
      // In a production system, you would implement position sizing here
      const quantity = signal.symbol.includes('BTC') ? '0.001' : '0.01';
      
      // Log the signal
      console.log(`Executing ${signal.action} for ${signal.symbol} at $${signal.price}: ${signal.reason}`);
      
      // Execute actual trade using Binance API
      const orderResult = await binanceService.placeMarketOrder(
        signal.symbol,
        signal.action,
        quantity
      );
      
      // Update strategy statistics
      const strategy = this.getStrategyById(signal.strategy.id);
      if (strategy) {
        strategy.trades = (strategy.trades || 0) + 1;
        this.saveStrategies();
      }
      
      // Send notification about trade
      this.notifyTrade(signal);
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  }

  private notifyTrade(signal: TradeSignal): void {
    // In a real implementation, this would send notifications via Telegram or other channels
    toast.success(
      `${signal.action} signal for ${signal.symbol} at $${signal.price}`, 
      { description: signal.reason }
    );
  }
}

// Create a singleton instance
const tradingService = new TradingService();
export default tradingService;
