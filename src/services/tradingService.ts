import binanceService from './binanceService';
import notificationService from './notificationService';
import { toast } from 'sonner';

// Trading signals
type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

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

// Trading strategy interface
interface TradingStrategy {
  name: string;
  description: string;
  analyze: (data: any) => Promise<TradingSignal>;
}

// Simple Moving Average Crossover Strategy - Enhanced for higher sensitivity
class SMAStrategy implements TradingStrategy {
  name = 'SMA Crossover';
  description = 'Simple Moving Average crossover strategy (3/10)';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate 3-period SMA (faster response to trends)
      const sma3 = this.calculateSMA(data, 3);
      
      // Calculate 10-period SMA (more sensitive than 20)
      const sma10 = this.calculateSMA(data, 10);
      
      // Get the last two values for both SMAs to determine crossover
      const currentSMA3 = sma3[sma3.length - 1];
      const previousSMA3 = sma3[sma3.length - 2];
      const currentSMA10 = sma10[sma10.length - 1];
      const previousSMA10 = sma10[sma10.length - 2];
      
      // Check for bullish crossover (3 SMA crosses above 10 SMA)
      if (previousSMA3 <= previousSMA10 && currentSMA3 > currentSMA10) {
        return 'BUY';
      }
      
      // Check for bearish crossover (3 SMA crosses below 10 SMA)
      if (previousSMA3 >= previousSMA10 && currentSMA3 < currentSMA10) {
        return 'SELL';
      }
      
      // Add trend-following logic for more trading opportunities
      if (currentSMA3 > currentSMA10 && currentSMA3 > previousSMA3) {
        return 'BUY'; // Strong uptrend
      }
      
      if (currentSMA3 < currentSMA10 && currentSMA3 < previousSMA3) {
        return 'SELL'; // Strong downtrend
      }
      
      // No clear signal
      return 'HOLD';
    } catch (error) {
      console.error('Error in SMA strategy analysis:', error);
      return 'HOLD';
    }
  }
  
  private calculateSMA(data: any[], period: number): number[] {
    const sma: number[] = [];
    
    // Need at least 'period' data points to calculate SMA
    if (data.length < period) {
      return sma;
    }
    
    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += parseFloat(data[i][4]); // Close price
    }
    sma.push(sum / period);
    
    // Calculate remaining SMAs
    for (let i = period; i < data.length; i++) {
      sum = sum - parseFloat(data[i - period][4]) + parseFloat(data[i][4]);
      sma.push(sum / period);
    }
    
    return sma;
  }
}

// RSI Strategy - Enhanced for faster trading
class RSIStrategy implements TradingStrategy {
  name = 'RSI';
  description = 'Relative Strength Index strategy (8-period)';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate 8-period RSI (more responsive than 14)
      const rsi = this.calculateRSI(data, 8);
      
      // Get the current RSI value
      const currentRSI = rsi[rsi.length - 1];
      const previousRSI = rsi[rsi.length - 2] || 50;
      
      // More aggressive oversold condition (RSI < 40)
      if (currentRSI < 40) {
        return 'BUY';
      }
      
      // More aggressive overbought condition (RSI > 60)
      if (currentRSI > 60) {
        return 'SELL';
      }
      
      // Add momentum-based signals for more trading opportunities
      if (currentRSI > previousRSI && currentRSI > 45 && currentRSI < 55) {
        return 'BUY'; // Catching upward momentum early
      }
      
      if (currentRSI < previousRSI && currentRSI > 45 && currentRSI < 55) {
        return 'SELL'; // Catching downward momentum early
      }
      
      // No signal
      return 'HOLD';
    } catch (error) {
      console.error('Error in RSI strategy analysis:', error);
      return 'HOLD';
    }
  }
  
  private calculateRSI(data: any[], period: number): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = parseFloat(data[i][4]) - parseFloat(data[i - 1][4]);
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Need at least 'period + 1' data points to calculate first RSI
    if (data.length <= period + 1) {
      return rsi;
    }
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    // Calculate first RSI
    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
    rsi.push(100 - (100 / (1 + rs)));
    
    // Calculate remaining RSIs
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }
}

// MACD Strategy - Enhanced for faster signals
class MACDStrategy implements TradingStrategy {
  name = 'MACD';
  description = 'Moving Average Convergence Divergence strategy';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate MACD line (8-period EMA - 17-period EMA for faster signals)
      const ema8 = this.calculateEMA(data, 8);
      const ema17 = this.calculateEMA(data, 17);
      
      const macdLine: number[] = [];
      for (let i = 0; i < ema8.length; i++) {
        if (i < ema17.length) {
          macdLine.push(ema8[i] - ema17[i]);
        }
      }
      
      // Calculate signal line (5-period EMA of MACD line for faster signals)
      const signalLine = this.calculateEMAFromArray(macdLine, 5);
      
      // Need at least one value for both MACD and signal line
      if (macdLine.length === 0 || signalLine.length === 0) {
        return 'HOLD';
      }
      
      // Get the last two values for both lines to determine crossover
      const currentMACD = macdLine[macdLine.length - 1];
      const previousMACD = macdLine[macdLine.length - 2];
      const currentSignal = signalLine[signalLine.length - 1];
      const previousSignal = signalLine[signalLine.length - 2];
      
      // Check for bullish crossover (MACD crosses above signal line)
      if (previousMACD <= previousSignal && currentMACD > currentSignal) {
        return 'BUY';
      }
      
      // Check for bearish crossover (MACD crosses below signal line)
      if (previousMACD >= previousSignal && currentMACD < currentSignal) {
        return 'SELL';
      }
      
      // Add zero-line crossover signals for more trading opportunities
      if (previousMACD < 0 && currentMACD >= 0) {
        return 'BUY'; // Bullish zero-line crossover
      }
      
      if (previousMACD > 0 && currentMACD <= 0) {
        return 'SELL'; // Bearish zero-line crossover
      }
      
      // Additional signal: MACD direction change
      if (previousMACD < currentMACD && currentMACD > 0) {
        return 'BUY'; // MACD turning up while positive
      }
      
      if (previousMACD > currentMACD && currentMACD < 0) {
        return 'SELL'; // MACD turning down while negative
      }
      
      // No crossover
      return 'HOLD';
    } catch (error) {
      console.error('Error in MACD strategy analysis:', error);
      return 'HOLD';
    }
  }
  
  private calculateEMA(data: any[], period: number): number[] {
    const ema: number[] = [];
    
    // Need at least 'period' data points to calculate EMA
    if (data.length < period) {
      return ema;
    }
    
    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += parseFloat(data[i][4]); // Close price
    }
    const sma = sum / period;
    ema.push(sma);
    
    // Calculate multiplier
    const multiplier = 2 / (period + 1);
    
    // Calculate remaining EMAs
    for (let i = period; i < data.length; i++) {
      const currentPrice = parseFloat(data[i][4]);
      const currentEMA = (currentPrice - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }
  
  private calculateEMAFromArray(data: number[], period: number): number[] {
    const ema: number[] = [];
    
    // Need at least 'period' data points to calculate EMA
    if (data.length < period) {
      return ema;
    }
    
    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    const sma = sum / period;
    ema.push(sma);
    
    // Calculate multiplier
    const multiplier = 2 / (period + 1);
    
    // Calculate remaining EMAs
    for (let i = period; i < data.length; i++) {
      const currentValue = data[i];
      const currentEMA = (currentValue - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }
}

// New Volume-based Strategy
class VolumeStrategy implements TradingStrategy {
  name = 'Volume Analysis';
  description = 'Analyzes volume patterns for trading signals';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Need at least 10 data points
      if (data.length < 10) {
        return 'HOLD';
      }
      
      // Extract volumes and prices
      const volumes = data.slice(-10).map((candle: any) => parseFloat(candle[5])); // Volume is at index 5
      const closes = data.slice(-10).map((candle: any) => parseFloat(candle[4])); // Close is at index 4
      
      // Calculate average volume
      const avgVolume = volumes.slice(0, 8).reduce((sum, vol) => sum + vol, 0) / 8;
      
      // Check most recent volume
      const latestVolume = volumes[volumes.length - 1];
      const previousVolume = volumes[volumes.length - 2];
      
      // Check price direction
      const latestClose = closes[closes.length - 1];
      const previousClose = closes[closes.length - 2];
      const priceChange = (latestClose - previousClose) / previousClose;
      
      // Volume spike with price up = strong buy signal
      if (latestVolume > avgVolume * 1.5 && priceChange > 0.002) {
        return 'BUY';
      }
      
      // Volume spike with price down = strong sell signal
      if (latestVolume > avgVolume * 1.5 && priceChange < -0.002) {
        return 'SELL';
      }
      
      // Volume increasing with price trend
      if (latestVolume > previousVolume && latestVolume > avgVolume) {
        if (priceChange > 0.001) {
          return 'BUY';
        } else if (priceChange < -0.001) {
          return 'SELL';
        }
      }
      
      return 'HOLD';
    } catch (error) {
      console.error('Error in Volume strategy analysis:', error);
      return 'HOLD';
    }
  }
}

class TradingService {
  private isRunning: boolean = false;
  private strategies: TradingStrategy[] = [];
  private tradingInterval: ReturnType<typeof setInterval> | null = null;
  private tradingPairs: string[] = ['BTCUSDT', 'ETHUSDT'];
  private positions: Record<string, { inPosition: boolean, entryPrice: number | null }> = {};
  
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
  
  constructor() {
    this.strategies = [
      new SMAStrategy(),
      new RSIStrategy(),
      new MACDStrategy(),
      new VolumeStrategy()
    ];
    
    for (const pair of this.tradingPairs) {
      this.positions[pair] = { inPosition: false, entryPrice: null };
    }
    
    const wasRunning = localStorage.getItem('botRunning') === 'true';
    if (wasRunning) {
      this.startTrading();
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
  
  public isBotRunning(): boolean {
    return this.isRunning;
  }
  
  public startTrading(): boolean {
    if (this.isRunning) {
      console.log('Trading bot is already running');
      return true;
    }
    
    try {
      console.log('Starting trading bot...');
      this.isRunning = true;
      localStorage.setItem('botRunning', 'true');
      
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
      for (const strategy of this.strategies) {
        const signal = await strategy.analyze(klines);
        signals.push(signal);
        console.log(`${strategy.name} signal for ${pair} (${timeframe}): ${signal}`);
      }
      
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
    
    // More aggressive trading - execute if even just one timeframe has a strong signal
    if (buyCount >= 1 && sellCount === 0) {
      return 'BUY';
    }
    
    if (sellCount >= 1 && buyCount === 0) {
      return 'SELL';
    }
    
    // If conflicting signals, go with the majority
    if (buyCount > sellCount) {
      return 'BUY';
    }
    
    if (sellCount > buyCount) {
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
    
    if (buyCount > sellCount && buyCount > holdCount) {
      return 'BUY';
    }
    
    if (sellCount > buyCount && sellCount > holdCount) {
      return 'SELL';
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
    
    try {
      if (signal === 'BUY') {
        console.log(`Executing BUY order for ${pair} at $${price}`);
        
        // Increase position size slightly for better profitability
        const quantity = '0.0015';
        
        await binanceService.placeMarketOrder(pair, 'BUY', quantity);
        
        position.inPosition = true;
        position.entryPrice = parseFloat(price);
        
        // Update UI statistics - increment trades count
        this.updateTradeStatistics(true);
        
        await notificationService.notifyTrade(pair, signal, price);
      } else if (signal === 'SELL') {
        console.log(`Executing SELL order for ${pair} at $${price}`);
        
        const quantity = '0.0015';
        
        await binanceService.placeMarketOrder(pair, 'SELL', quantity);
        
        if (position.entryPrice) {
          const priceDiff = parseFloat(price) - position.entryPrice;
          const percentChange = (priceDiff / position.entryPrice) * 100;
          console.log(`Closed position with ${percentChange.toFixed(2)}% ${priceDiff >= 0 ? 'profit' : 'loss'}`);
          
          // Update profit/loss statistics
          this.updateTradeStatistics(false, percentChange >= 0, percentChange);
        }
        
        position.inPosition = false;
        position.entryPrice = null;
        
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
        const wins = Math.round((parseInt(stats.winRate) / 100) * (stats.totalTrades - 1)) || 0;
        const newWins = isWin ? wins + 1 : wins;
        const newWinRate = ((newWins / stats.totalTrades) * 100).toFixed(0) + "%";
        stats.winRate = newWinRate;
        
        // Update profit/loss (convert existing value from string to number)
        const currentPL = parseFloat(stats.profitLoss.replace('$', ''));
        // Assuming a fixed dollar amount per percentage for demonstration
        const tradePL = percentChange * 2; // Each percentage point is worth $2
        const newPL = (currentPL + tradePL).toFixed(2);
        stats.profitLoss = `$${newPL}`;
      }
      
      // Save updated statistics
      localStorage.setItem('botStatistics', JSON.stringify(stats));
      
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('bot-statistics-updated'));
    } catch (error) {
      console.error('Error updating trade statistics:', error);
    }
  }
}

const tradingService = new TradingService();
export default tradingService;
