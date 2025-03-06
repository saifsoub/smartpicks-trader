import binanceService from './binanceService';
import notificationService from './notificationService';
import { toast } from 'sonner';

// Trading signals
type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

// Trading strategy interface
interface TradingStrategy {
  name: string;
  description: string;
  analyze: (data: any) => Promise<TradingSignal>;
}

// Simple Moving Average Crossover Strategy
class SMAStrategy implements TradingStrategy {
  name = 'SMA Crossover';
  description = 'Simple Moving Average crossover strategy (5/20)';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate 5-period SMA
      const sma5 = this.calculateSMA(data, 5);
      
      // Calculate 20-period SMA
      const sma20 = this.calculateSMA(data, 20);
      
      // Get the last two values for both SMAs to determine crossover
      const currentSMA5 = sma5[sma5.length - 1];
      const previousSMA5 = sma5[sma5.length - 2];
      const currentSMA20 = sma20[sma20.length - 1];
      const previousSMA20 = sma20[sma20.length - 2];
      
      // Check for bullish crossover (5 SMA crosses above 20 SMA)
      if (previousSMA5 <= previousSMA20 && currentSMA5 > currentSMA20) {
        return 'BUY';
      }
      
      // Check for bearish crossover (5 SMA crosses below 20 SMA)
      if (previousSMA5 >= previousSMA20 && currentSMA5 < currentSMA20) {
        return 'SELL';
      }
      
      // No crossover
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

// RSI Strategy
class RSIStrategy implements TradingStrategy {
  name = 'RSI';
  description = 'Relative Strength Index strategy (14-period)';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate 14-period RSI
      const rsi = this.calculateRSI(data, 14);
      
      // Get the current RSI value
      const currentRSI = rsi[rsi.length - 1];
      
      // Oversold condition (RSI < 30)
      if (currentRSI < 30) {
        return 'BUY';
      }
      
      // Overbought condition (RSI > 70)
      if (currentRSI > 70) {
        return 'SELL';
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

// MACD Strategy
class MACDStrategy implements TradingStrategy {
  name = 'MACD';
  description = 'Moving Average Convergence Divergence strategy';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate MACD line (12-period EMA - 26-period EMA)
      const ema12 = this.calculateEMA(data, 12);
      const ema26 = this.calculateEMA(data, 26);
      
      const macdLine: number[] = [];
      for (let i = 0; i < ema12.length; i++) {
        if (i < ema26.length) {
          macdLine.push(ema12[i] - ema26[i]);
        }
      }
      
      // Calculate signal line (9-period EMA of MACD line)
      const signalLine = this.calculateEMAFromArray(macdLine, 9);
      
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

class TradingService {
  private isRunning: boolean = false;
  private strategies: TradingStrategy[] = [];
  private tradingInterval: ReturnType<typeof setInterval> | null = null;
  private tradingPairs: string[] = ['BTCUSDT', 'ETHUSDT'];
  private positions: Record<string, { inPosition: boolean, entryPrice: number | null }> = {};
  
  constructor() {
    // Initialize strategies
    this.strategies = [
      new SMAStrategy(),
      new RSIStrategy(),
      new MACDStrategy()
    ];
    
    // Initialize positions
    for (const pair of this.tradingPairs) {
      this.positions[pair] = { inPosition: false, entryPrice: null };
    }
    
    // Check if bot was running before page refresh
    const wasRunning = localStorage.getItem('botRunning') === 'true';
    if (wasRunning) {
      this.startTrading();
    }
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
      
      // Run initial analysis
      this.analyzeMarket();
      
      // Set interval for continuous analysis (every 5 minutes)
      this.tradingInterval = setInterval(() => {
        this.analyzeMarket();
      }, 5 * 60 * 1000);
      
      // Notify user
      toast.success('Trading bot started successfully');
      notificationService.addNotification({
        title: 'Trading Bot Started',
        message: 'The automated trading bot is now running and analyzing the market.',
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start trading bot:', error);
      this.isRunning = false;
      localStorage.removeItem('botRunning');
      
      // Notify user
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
    
    // Notify user
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
    
    console.log('Analyzing market...');
    
    try {
      // Get current prices
      const prices = await binanceService.getPrices();
      
      // Analyze each trading pair
      for (const pair of this.tradingPairs) {
        await this.analyzePair(pair, prices[pair]);
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      notificationService.addNotification({
        title: 'Analysis Error',
        message: 'Failed to analyze market data. Will retry on next interval.',
        type: 'error'
      });
    }
  }
  
  private async analyzePair(pair: string, currentPrice: string): Promise<void> {
    try {
      console.log(`Analyzing ${pair} at price $${currentPrice}...`);
      
      // Get historical data for analysis
      const klines = await binanceService.getKlines(pair, '1h', 100);
      
      // Run each strategy and collect signals
      const signals: TradingSignal[] = [];
      for (const strategy of this.strategies) {
        const signal = await strategy.analyze(klines);
        signals.push(signal);
        console.log(`${strategy.name} signal for ${pair}: ${signal}`);
      }
      
      // Determine final signal based on majority
      const finalSignal = this.determineFinalSignal(signals);
      console.log(`Final signal for ${pair}: ${finalSignal}`);
      
      // Execute trade based on signal
      await this.executeTrade(pair, finalSignal, currentPrice);
    } catch (error) {
      console.error(`Error analyzing ${pair}:`, error);
    }
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
    
    // If majority says buy
    if (buyCount > sellCount && buyCount > holdCount) {
      return 'BUY';
    }
    
    // If majority says sell
    if (sellCount > buyCount && sellCount > holdCount) {
      return 'SELL';
    }
    
    // Otherwise hold
    return 'HOLD';
  }
  
  private async executeTrade(pair: string, signal: TradingSignal, price: string): Promise<void> {
    const position = this.positions[pair];
    
    // Don't trade if we're already in the right position
    if (signal === 'BUY' && position.inPosition) {
      console.log(`Already in a long position for ${pair}`);
      return;
    }
    
    if (signal === 'SELL' && !position.inPosition) {
      console.log(`Not in a position to sell ${pair}`);
      return;
    }
    
    if (signal === 'HOLD') {
      console.log(`Holding current position for ${pair}`);
      return;
    }
    
    try {
      // Execute the trade
      if (signal === 'BUY') {
        console.log(`Executing BUY order for ${pair} at $${price}`);
        
        // In a real implementation, this would calculate position size based on account balance
        const quantity = '0.001'; // Example quantity
        
        // Place the order
        await binanceService.placeMarketOrder(pair, 'BUY', quantity);
        
        // Update position
        position.inPosition = true;
        position.entryPrice = parseFloat(price);
        
        // Notify about the trade
        if (signal !== "HOLD") {
          await notificationService.notifyTrade(pair, signal, price);
        } else {
          console.log(`HOLD signal for ${pair} at price ${price}`);
        }
      } else if (signal === 'SELL') {
        console.log(`Executing SELL order for ${pair} at $${price}`);
        
        // In a real implementation, this would sell the entire position
        const quantity = '0.001'; // Example quantity
        
        // Place the order
        await binanceService.placeMarketOrder(pair, 'SELL', quantity);
        
        // Calculate profit/loss
        if (position.entryPrice) {
          const priceDiff = parseFloat(price) - position.entryPrice;
          const percentChange = (priceDiff / position.entryPrice) * 100;
          console.log(`Closed position with ${percentChange.toFixed(2)}% ${priceDiff >= 0 ? 'profit' : 'loss'}`);
        }
        
        // Update position
        position.inPosition = false;
        position.entryPrice = null;
        
        // Notify about the trade
        if (signal !== "HOLD") {
          await notificationService.notifyTrade(pair, signal, price);
        } else {
          console.log(`HOLD signal for ${pair} at price ${price}`);
        }
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
}

const tradingService = new TradingService();
export default tradingService;
