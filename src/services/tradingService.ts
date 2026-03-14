import binanceService from './binanceService';
import notificationService from './notificationService';
import heartbeatService from './heartbeatService';
import { toast } from 'sonner';
import { createDefaultStrategies } from './trading/strategies/technicalStrategies';
import { TradingMode, STORAGE_KEYS } from './trading/types';

// Trading signals
type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

// Trading bot settings interface
interface BotSettings {
  tradingPairs: string[];
  riskLevel: number;
  useTrailingStopLoss: boolean;
  useTakeProfit: boolean;
  useDynamicPositionSizing: boolean;
}

// Strategy interface for use throughout the application
export interface Strategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  symbol: string;
  interval: string;
  performance: string;
  trades: number;
  winRate: string;
  parameters: Record<string, string | number>;
  lastExecuted?: string;
}

// Trading strategy interface (internal)
interface TradingStrategy {
  name: string;
  description: string;
  analyze: (data: any) => Promise<TradingSignal>;
}


// Add a new interface for performance history data
interface PerformanceData {
  time: string;
  profit: number;
  cumulativeProfit: number;
  trades: number;
  winRate: number;
}

class TradingService {
  private isRunning: boolean = false;
  private strategies: TradingStrategy[] = [];
  private tradingInterval: ReturnType<typeof setInterval> | null = null;
  private tradingPairs: string[] = [];
  private positions: Record<string, { inPosition: boolean, entryPrice: number | null, stopLoss: number | null, takeProfit: number | null }> = {};
  private performanceHistory: PerformanceData[] = [];
  private dailyPerformance: Record<string, PerformanceData> = {};
  private weeklyPerformance: Record<string, PerformanceData> = {};
  private monthlyPerformance: Record<string, PerformanceData> = {};
  private botSettings: BotSettings = {
    tradingPairs: [],
    riskLevel: 50, // 1-100 scale, higher means more aggressive
    useTrailingStopLoss: false,
    useTakeProfit: true,
    useDynamicPositionSizing: true
  };
  private strategyList: Strategy[] = [
    {
      id: '1',
      name: 'RSI + MACD Crossover',
      description: 'Combines RSI oversold conditions with MACD bullish crossovers for entry signals',
      isActive: true,
      symbol: 'BTCUSDT',
      interval: '4h',
      performance: '+5.2%',
      trades: 14,
      winRate: '71%',
      parameters: {
        'RSI Period': 14,
        'RSI Oversold': 30,
        'MACD Fast': 12,
        'MACD Slow': 26,
        'MACD Signal': 9
      },
      lastExecuted: new Date(Date.now() - 35 * 60000).toISOString()
    },
    {
      id: '2',
      name: 'Bollinger Breakout',
      description: 'Detects price breakouts from Bollinger Bands with volume confirmation',
      isActive: true,
      symbol: 'ETHUSDT',
      interval: '1h',
      performance: '+3.8%',
      trades: 28,
      winRate: '64%',
      parameters: {
        'BB Period': 20,
        'BB Deviation': 2,
        'Volume Threshold': '1.5x',
        'Stop Loss': '2%',
        'Take Profit': '4%'
      },
      lastExecuted: new Date(Date.now() - 120 * 60000).toISOString()
    },
    {
      id: '3',
      name: 'Swing Trading Strategy',
      description: 'Identifies swing trading opportunities using multiple timeframe analysis',
      isActive: false,
      symbol: 'SOLUSDT',
      interval: '1d',
      performance: '+8.7%',
      trades: 6,
      winRate: '83%',
      parameters: {
        'EMA Short': 9,
        'EMA Long': 21,
        'RSI Period': 14,
        'Stochastic Period': 14,
        'Confirmation Candles': 2
      }
    }
  ];
  private marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }> = {
    'BTC': { score: 72, trend: 'bullish' },
    'ETH': { score: 65, trend: 'bullish' },
    'SOL': { score: 58, trend: 'neutral' },
    'BNB': { score: 45, trend: 'neutral' },
    'XRP': { score: 32, trend: 'bearish' }
  };

  // Trading mode – defaults to 'demo' (safe default, no real orders).
  // Persisted in localStorage (not a secret) so the preference survives reloads.
  private tradingMode: TradingMode = 'demo';
  
  constructor() {
    this.strategies = createDefaultStrategies();

    // Load persisted trading mode; fall back to 'demo' for safety.
    const savedMode = localStorage.getItem(STORAGE_KEYS.TRADING_MODE) as TradingMode | null;
    if (savedMode === 'demo' || savedMode === 'paper' || savedMode === 'live') {
      this.tradingMode = savedMode;
    }
    
    this.initializeTradingPairs();
    
    const wasRunning = localStorage.getItem('botRunning') === 'true';
    if (wasRunning) {
      this.startTrading();
    }
  }
  
  private async initializeTradingPairs() {
    try {
      const account = await binanceService.getAccountInfo();
      if (account && account.balances) {
        // Filter balances to only include assets with non-zero balances
        const activeBalances = account.balances.filter(
          balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        );
        
        // Convert each asset to a trading pair with USDT
        this.tradingPairs = activeBalances
          .map(balance => `${balance.asset}USDT`)
          .filter(pair => pair !== 'USDTUSDT'); // Exclude USDT itself
        
        console.log('Initialized trading pairs from portfolio:', this.tradingPairs);
        
        // Initialize positions for all pairs
        for (const pair of this.tradingPairs) {
          this.positions[pair] = {
            inPosition: false,
            entryPrice: null,
            stopLoss: null,
            takeProfit: null
          };
        }
      }
    } catch (error) {
      console.error('Error initializing trading pairs:', error);
      // Fallback to default pairs if initialization fails
      this.tradingPairs = ['BTCUSDT', 'ETHUSDT'];
    }
  }
  
  public getStrategies(): Strategy[] {
    return [...this.strategyList];
  }
  
  public getActiveStrategies(): Strategy[] {
    return this.strategyList.filter(strategy => strategy.isActive);
  }
  
  public getStrategyById(id: string): Strategy | undefined {
    return this.strategyList.find(strategy => strategy.id === id);
  }
  
  public toggleStrategyStatus(id: string): boolean {
    const strategy = this.strategyList.find(strategy => strategy.id === id);
    if (strategy) {
      strategy.isActive = !strategy.isActive;
      
      toast.success(`Strategy ${strategy.isActive ? 'activated' : 'deactivated'}`);
      
      window.dispatchEvent(new CustomEvent('strategy-updated'));
      
      return true;
    }
    return false;
  }
  
  public deleteStrategy(id: string): boolean {
    const initialLength = this.strategyList.length;
    this.strategyList = this.strategyList.filter(strategy => strategy.id !== id);
    
    window.dispatchEvent(new CustomEvent('strategy-updated'));
    
    return this.strategyList.length < initialLength;
  }
  
  public getMarketSentiment(): Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }> {
    return {...this.marketSentiment};
  }

  // ---------------------------------------------------------------------------
  // Trading mode management
  // ---------------------------------------------------------------------------

  public getTradingMode(): TradingMode {
    return this.tradingMode;
  }

  public setTradingMode(mode: TradingMode): void {
    const previous = this.tradingMode;
    this.tradingMode = mode;
    localStorage.setItem(STORAGE_KEYS.TRADING_MODE, mode);

    // Stop the bot when switching away from live to prevent in-flight orders
    if (previous === 'live' && mode !== 'live' && this.isRunning) {
      this.stopTrading();
      toast.info('Trading bot stopped because mode changed away from Live.');
    }

    console.log(`Trading mode changed: ${previous} → ${mode}`);
    window.dispatchEvent(new CustomEvent('trading-mode-changed', { detail: { mode } }));
  }

  // Kill switch: immediately stop bot and reset mode to demo
  public emergencyStop(): void {
    this.stopTrading();
    this.setTradingMode('demo');
    toast.error('🚨 Emergency stop activated. Mode reset to Demo.');
    notificationService.addNotification({
      title: 'Emergency Stop',
      message: 'Trading bot stopped and mode reset to Demo.',
      type: 'error'
    });
  }
  
  public updateBotSettings(settings: Partial<BotSettings>): void {
    this.botSettings = { ...this.botSettings, ...settings };
    
    // Apply trading pairs change if needed
    if (settings.tradingPairs) {
      this.tradingPairs = [...settings.tradingPairs];
      
      // Initialize position tracking for any new pairs
      for (const pair of this.tradingPairs) {
        if (!this.positions[pair]) {
          this.positions[pair] = {
            inPosition: false,
            entryPrice: null,
            stopLoss: null,
            takeProfit: null
          };
        }
      }
    }
    
    console.log("Bot settings updated:", this.botSettings);
  }
  
  public isBotRunning(): boolean {
    return this.isRunning;
  }
  
  public async startTrading(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Trading bot is already running');
      return true;
    }
    
    try {
      // Refresh trading pairs before starting
      await this.initializeTradingPairs();
      
      console.log('Starting trading bot with pairs:', this.tradingPairs);
      this.isRunning = true;
      localStorage.setItem('botRunning', 'true');
      
      // Start heartbeat monitoring
      heartbeatService.startBot();
      
      this.analyzeMarket();
      
      // Analyze more frequently - every 2 minutes instead of 5
      this.tradingInterval = setInterval(() => {
        this.analyzeMarket();
      }, 2 * 60 * 1000);
      
      toast.success('Trading bot started successfully');
      notificationService.addNotification({
        title: 'Trading Bot Started',
        message: 'The high-performance trading bot is now running and aggressively analyzing the market for opportunities.',
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start trading bot:', error);
      this.isRunning = false;
      localStorage.removeItem('botRunning');
      
      toast.error('Failed to start trading bot');
      notificationService.addNotification({
        title: 'Trading Bot Error',
        message: 'Failed to start the trading bot. Please check the console for details.',
        type: 'error'
      });
      
      return false;
    }
  }
  
  public stopTrading(): void {
    if (!this.isRunning) {
      console.log('Trading bot is not running');
      return;
    }
    
    console.log('Stopping trading bot...');
    this.isRunning = false;
    localStorage.removeItem('botRunning');
    
    // Stop heartbeat monitoring
    heartbeatService.stopBot();
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    
    toast.info('Trading bot stopped');
    notificationService.addNotification({
      title: 'Trading Bot Stopped',
      message: 'The automated trading bot has been stopped.',
      type: 'info'
    });
  }
  
  private async analyzeMarket(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    console.log('Analyzing market for profit opportunities...');
    
    try {
      const prices = await binanceService.getPrices();
      
      // Analyze multiple timeframes for better signals
      for (const pair of this.tradingPairs) {
        // Check multiple timeframes for stronger signals
        const timeframes = ['15m', '1h', '4h'];
        const signals: TradingSignal[] = [];
        
        for (const timeframe of timeframes) {
          const signal = await this.analyzePairWithTimeframe(pair, prices[pair], timeframe);
          signals.push(signal);
        }
        
        // Get final signal across timeframes
        const finalSignal = this.determineMultiTimeframeSignal(signals);
        console.log(`Final multi-timeframe signal for ${pair}: ${finalSignal}`);
        
        // Execute with the multi-timeframe signal
        await this.executeTrade(pair, finalSignal, prices[pair]);
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      notificationService.addNotification({
        title: 'Analysis Error',
        message: 'Failed to analyze market data. Will retry soon.',
        type: 'error'
      });
    }
  }
  
  private async analyzePairWithTimeframe(pair: string, currentPrice: string, timeframe: string): Promise<TradingSignal> {
    try {
      console.log(`Analyzing ${pair} at price $${currentPrice} on ${timeframe} timeframe...`);
      
      const klines = await binanceService.getKlines(pair, timeframe, 100);
      
      const signals: TradingSignal[] = [];
      const strategyResults: Record<string, TradingSignal> = {};
      
      for (const strategy of this.strategies) {
        const signal = await strategy.analyze(klines);
        signals.push(signal);
        strategyResults[strategy.name] = signal;
        console.log(`${strategy.name} signal for ${pair} (${timeframe}): ${signal}`);
      }
      
      // Log complete strategy analysis for debugging
      console.log(`Strategy results for ${pair} (${timeframe}):`, strategyResults);
      
      const finalSignal = this.determineFinalSignal(signals);
      console.log(`Final signal for ${pair} (${timeframe}): ${finalSignal}`);
      return finalSignal;
    } catch (error) {
      console.error(`Error analyzing ${pair} (${timeframe}):`, error);
      return 'HOLD';
    }
  }
  
  private determineMultiTimeframeSignal(signals: TradingSignal[]): TradingSignal {
    let buyCount = 0;
    let sellCount = 0;
    let holdCount = 0;
    
    for (const signal of signals) {
      if (signal === 'BUY') buyCount++;
      else if (signal === 'SELL') sellCount++;
      else holdCount++;
    }
    
    // Adjust signal thresholds based on risk level
    const isAggressive = this.botSettings.riskLevel > 65;
    const isConservative = this.botSettings.riskLevel < 35;
    
    // For aggressive settings - trade on fewer confirmations
    if (isAggressive) {
      if (buyCount >= 1 && sellCount === 0) {
        return 'BUY';
      }
      
      if (sellCount >= 1 && buyCount === 0) {
        return 'SELL';
      }
    } 
    // For moderate settings - need at least 2 timeframes to agree
    else if (!isConservative) {
      if (buyCount >= 2 && sellCount === 0) {
        return 'BUY';
      }
      
      if (sellCount >= 2 && buyCount === 0) {
        return 'SELL';
      }
    }
    // For conservative settings - need strong agreement
    else {
      if (buyCount >= 2 && sellCount === 0 && signals.length >= 3) {
        return 'BUY';
      }
      
      if (sellCount >= 2 && buyCount === 0 && signals.length >= 3) {
        return 'SELL';
      }
    }
    
    // If conflicting signals, go with the majority
    if (buyCount > sellCount && buyCount > holdCount) {
      return 'BUY';
    }
    
    if (sellCount > buyCount && sellCount > holdCount) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
  
  private determineFinalSignal(signals: TradingSignal[]): TradingSignal {
    let buyCount = 0;
    let sellCount = 0;
    let holdCount = 0;
    
    for (const signal of signals) {
      if (signal === 'BUY') buyCount++;
      else if (signal === 'SELL') sellCount++;
      else holdCount++;
    }
    
    // Adjust signal thresholds based on risk level
    const requiredConfirmations = this.botSettings.riskLevel > 65 ? 1 : 
                                this.botSettings.riskLevel > 35 ? 2 : 3;
    
    if (buyCount >= requiredConfirmations && sellCount === 0) {
      return 'BUY';
    }
    
    if (sellCount >= requiredConfirmations && buyCount === 0) {
      return 'SELL';
    }
    
    // For more aggressive trading with mixed signals
    if (this.botSettings.riskLevel > 75) {
      if (buyCount > sellCount && buyCount >= 2) {
        return 'BUY';
      }
      
      if (sellCount > buyCount && sellCount >= 2) {
        return 'SELL';
      }
    }
    
    return 'HOLD';
  }
  
  private async executeTrade(pair: string, signal: TradingSignal, price: string): Promise<void> {
    const position = this.positions[pair];
    
    // Skip if signal is HOLD
    if (signal === 'HOLD') {
      console.log(`Holding current position for ${pair}`);
      return;
    }
    
    // Check if we're already in position for a BUY signal
    if (signal === 'BUY' && position.inPosition) {
      console.log(`Already in a long position for ${pair}`);
      return;
    }
    
    // Check if we're not in position for a SELL signal
    if (signal === 'SELL' && !position.inPosition) {
      console.log(`Not in a position to sell ${pair}`);
      return;
    }

    // Mode enforcement: only place real orders in 'live' mode.
    const isLive = this.tradingMode === 'live';
    const modeLabel = isLive ? '' : ` [${this.tradingMode.toUpperCase()} – simulated]`;
    
    try {
      if (signal === 'BUY') {
        console.log(`Executing BUY order for ${pair} at $${price}${modeLabel}`);
        
        // Calculate position size based on risk level and whether dynamic sizing is enabled
        let quantity = '0.0015'; // Default size
        
        if (this.botSettings.useDynamicPositionSizing) {
          // Scale position size based on risk level (0.001 to 0.003)
          const baseSize = 0.001;
          const riskMultiplier = this.botSettings.riskLevel / 50; // 1.0 at 50% risk
          quantity = (baseSize * riskMultiplier * 1.5).toFixed(4);
          console.log(`Dynamic position sizing: ${quantity} based on risk level ${this.botSettings.riskLevel}%`);
        }

        if (isLive) {
          await binanceService.placeMarketOrder(pair, 'BUY', quantity);
        } else {
          // Simulate: log the intended order but do not call the exchange.
          console.info(`[SIMULATED] BUY ${quantity} ${pair} @ $${price} (mode: ${this.tradingMode})`);
        }
        
        position.inPosition = true;
        position.entryPrice = parseFloat(price);
        
        // Set stop loss and take profit levels
        if (position.entryPrice) {
          // Calculate stop loss (1-5% below entry depending on risk level)
          const stopLossPercent = 5 - (this.botSettings.riskLevel / 25); // Lower risk = larger stop (safer)
          position.stopLoss = position.entryPrice * (1 - stopLossPercent/100);
          
          // Calculate take profit (2-8% above entry depending on risk level)
          const takeProfitPercent = 2 + (this.botSettings.riskLevel / 20); // Higher risk = larger target
          position.takeProfit = position.entryPrice * (1 + takeProfitPercent/100);
          
          console.log(`Set stop loss at $${position.stopLoss.toFixed(2)} (${stopLossPercent.toFixed(1)}% below entry)`);
          console.log(`Set take profit at $${position.takeProfit.toFixed(2)} (${takeProfitPercent.toFixed(1)}% above entry)`);
        }
        
        // Update UI statistics - increment trades count
        this.updateTradeStatistics(true);
        
        await notificationService.notifyTrade(pair, signal, price);
        
        toast.success(`Bought ${pair} at $${parseFloat(price).toLocaleString()}${modeLabel}`);
      } else if (signal === 'SELL') {
        console.log(`Executing SELL order for ${pair} at $${price}${modeLabel}`);
        
        // Use the same quantity from the buy
        const quantity = '0.0015';
        
        if (this.botSettings.useDynamicPositionSizing) {
          // Use the same quantity calculation logic as BUY
          const baseSize = 0.001;
          const riskMultiplier = this.botSettings.riskLevel / 50;
          const dynamicQuantity = (baseSize * riskMultiplier * 1.5).toFixed(4);
          console.log(`Dynamic position sizing for sell: ${dynamicQuantity}`);
        }

        if (isLive) {
          await binanceService.placeMarketOrder(pair, 'SELL', quantity);
        } else {
          console.info(`[SIMULATED] SELL ${quantity} ${pair} @ $${price} (mode: ${this.tradingMode})`);
        }
        
        if (position.entryPrice) {
          const priceDiff = parseFloat(price) - position.entryPrice;
          const percentChange = (priceDiff / position.entryPrice) * 100;
          console.log(`Closed position with ${percentChange.toFixed(2)}% ${priceDiff >= 0 ? 'profit' : 'loss'}${modeLabel}`);
          
          // Update profit/loss statistics
          this.updateTradeStatistics(false, priceDiff >= 0, percentChange);
          
          if (priceDiff >= 0) {
            toast.success(`Sold ${pair} for ${percentChange.toFixed(2)}% profit${modeLabel}`);
          } else {
            toast.info(`Sold ${pair} with ${Math.abs(percentChange).toFixed(2)}% loss${modeLabel}`);
          }
        }
        
        position.inPosition = false;
        position.entryPrice = null;
        position.stopLoss = null;
        position.takeProfit = null;
        
        await notificationService.notifyTrade(pair, signal, price);
      }
    } catch (error) {
      console.error(`Error executing trade for ${pair}:`, error);
      notificationService.addNotification({
        title: 'Trade Execution Error',
        message: `Failed to execute ${signal} order for ${pair}. ${error instanceof Error ? error.message : ''}`,
        type: 'error'
      });
    }
  }
  
  private updateTradeStatistics(isNewTrade: boolean, isWin: boolean = false, percentChange: number = 0) {
    try {
      // Get current statistics
      const statsStr = localStorage.getItem('botStatistics');
      let stats = statsStr ? JSON.parse(statsStr) : { totalTrades: 0, winRate: "0%", profitLoss: "$0.00" };
      
      // Update total trades count
      if (isNewTrade) {
        stats.totalTrades += 1;
      }
      
      // Update win rate if this is a completed trade
      if (!isNewTrade) {
        const totalCompletedTrades = stats.totalTrades;
        let winCount = Math.round((parseInt(stats.winRate) / 100) * (totalCompletedTrades - 1)) || 0;
        winCount = isWin ? winCount + 1 : winCount;
        
        // Calculate new win rate
        const newWinRate = totalCompletedTrades > 0 ? 
          ((winCount / totalCompletedTrades) * 100).toFixed(0) + "%" : "0%";
        stats.winRate = newWinRate;
        
        // Update profit/loss (convert existing value from string to number)
        const currentPL = parseFloat(stats.profitLoss.replace('$', ''));
        // Use actual percentage change and a position size multiplier
        const positionSize = 100; // For demonstration purposes - $100 position size
        const tradePL = (percentChange / 100) * positionSize;
        const newPL = (currentPL + tradePL).toFixed(2);
        stats.profitLoss = `$${newPL}`;
        
        console.log(`Updated statistics - Win rate: ${stats.winRate}, P/L: ${stats.profitLoss}`);
      }
      
      // Add performance recording when a trade is completed
      if (!isNewTrade) {
        // For demonstration, assume a fixed position size of $100
        const positionSize = 100;
        const tradePL = (percentChange / 100) * positionSize;
        
        this.recordPerformance({
          symbol: 'UNKNOWN', // In a real implementation, we'd track the symbol
          profit: tradePL,
          isWin
        });
      }
      
      // Save updated statistics
      localStorage.setItem('botStatistics', JSON.stringify(stats));
      
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('bot-statistics-updated'));
    } catch (error) {
      console.error('Error updating trade statistics:', error);
    }
  }
  
  private async checkPositions(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      // Get current prices
      const prices = await binanceService.getPrices();
      
      for (const pair of this.tradingPairs) {
        const position = this.positions[pair];
        
        // Skip if not in a position
        if (!position.inPosition || !position.entryPrice) continue;
        
        const currentPrice = parseFloat(prices[pair]);
        
        // Check take profit
        if (this.botSettings.useTakeProfit && position.takeProfit && currentPrice >= position.takeProfit) {
          console.log(`Take profit triggered for ${pair} at $${currentPrice}`);
          await this.executeTrade(pair, 'SELL', currentPrice.toString());
          continue;
        }
        
        // Check stop loss
        if (position.stopLoss) {
          // For trailing stop loss
          if (this.botSettings.useTrailingStopLoss) {
            // Update stop loss if price moves in favorable direction
            if (currentPrice > position.entryPrice * 1.01) { // 1% profit buffer before trailing
              // Calculate new stop loss (at X% below current price)
              const trailingPercent = 3 - (this.botSettings.riskLevel / 50); // Tighter for higher risk
              const newStopLoss = currentPrice * (1 - trailingPercent/100);
              
              // Only update if new stop loss is higher than current one
              if (newStopLoss > position.stopLoss) {
                console.log(`Updating trailing stop loss for ${pair} from $${position.stopLoss.toFixed(2)} to $${newStopLoss.toFixed(2)}`);
                position.stopLoss = newStopLoss;
              }
            }
          }
          
          // Check if stop loss is hit
          if (currentPrice <= position.stopLoss) {
            console.log(`Stop loss triggered for ${pair} at $${currentPrice}`);
            await this.executeTrade(pair, 'SELL', currentPrice.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error checking positions:', error);
    }
  }
  
  public getPerformanceHistory(timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): PerformanceData[] {
    // Try to load from localStorage first
    const savedHistory = localStorage.getItem(`botPerformance_${timeframe}`);
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (error) {
        console.error(`Error parsing ${timeframe} performance history:`, error);
      }
    }
    
    // Return empty array instead of mock data
    return [];
  }
  
  private recordPerformance(trade: { symbol: string, profit: number, isWin: boolean }): void {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthStr = dateStr.substring(0, 7); // YYYY-MM
    const weekNum = Math.ceil((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7);
    const weekStr = `${monthStr}-W${weekNum}`;
    
    // Update daily performance
    if (!this.dailyPerformance[dateStr]) {
      this.dailyPerformance[dateStr] = {
        time: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: 0,
        cumulativeProfit: 0,
        trades: 0,
        winRate: 0
      };
    }
    
    this.dailyPerformance[dateStr].profit += trade.profit;
    this.dailyPerformance[dateStr].trades += 1;
    
    const winCount = Object.values(this.dailyPerformance)
      .reduce((count, day) => count + (day.winRate / 100 * day.trades), 0);
    const totalTrades = Object.values(this.dailyPerformance)
      .reduce((count, day) => count + day.trades, 0);
    
    this.dailyPerformance[dateStr].winRate = totalTrades > 0 ? 
      ((winCount + (trade.isWin ? 1 : 0)) / (totalTrades + 1)) * 100 : 0;
    
    // Recalculate cumulative profits
    let cumulative = 0;
    const dailyHistory = Object.keys(this.dailyPerformance)
      .sort()
      .map(date => {
        cumulative += this.dailyPerformance[date].profit;
        return {
          ...this.dailyPerformance[date],
          cumulativeProfit: cumulative
        };
      });
    
    // Store in localStorage
    localStorage.setItem('botPerformance_daily', JSON.stringify(dailyHistory));
  }
}

const tradingService = new TradingService();
export default tradingService;
