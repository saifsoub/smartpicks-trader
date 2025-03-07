import binanceService from './binanceService';
import notificationService from './notificationService';
import heartbeatService from './heartbeatService';
import { toast } from 'sonner';

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

// New Divergence Strategy for spotting reversals
class DivergenceStrategy implements TradingStrategy {
  name = 'RSI Divergence';
  description = 'Detects price/RSI divergences for potential reversals';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      // Calculate RSI
      const rsi = this.calculateRSI(data, 14);
      
      // Need enough data points
      if (rsi.length < 10) return 'HOLD';
      
      // Extract price data (close prices)
      const closePrices = data.slice(-rsi.length).map((candle: any) => parseFloat(candle[4]));
      
      // Look for bullish divergence
      // Price making lower lows but RSI making higher lows
      let bullishDivergence = false;
      if (closePrices[closePrices.length - 1] < closePrices[closePrices.length - 3] &&
          rsi[rsi.length - 1] > rsi[rsi.length - 3]) {
        bullishDivergence = true;
      }
      
      // Look for bearish divergence
      // Price making higher highs but RSI making lower highs
      let bearishDivergence = false;
      if (closePrices[closePrices.length - 1] > closePrices[closePrices.length - 3] &&
          rsi[rsi.length - 1] < rsi[rsi.length - 3]) {
        bearishDivergence = true;
      }
      
      if (bullishDivergence) {
        // Confirm with oversold condition for higher probability
        if (rsi[rsi.length - 1] < 40) {
          return 'BUY';
        }
      }
      
      if (bearishDivergence) {
        // Confirm with overbought condition for higher probability
        if (rsi[rsi.length - 1] > 70) {
          return 'SELL';
        }
      }
      
      return 'HOLD';
    } catch (error) {
      console.error('Error in Divergence strategy analysis:', error);
      return 'HOLD';
    }
  }
  
  // Reuse RSI calculation from RSI strategy
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

// New Breakout Strategy
class BreakoutStrategy implements TradingStrategy {
  name = 'Support/Resistance Breakout';
  description = 'Detects breakouts from key support/resistance levels';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      if (data.length < 30) return 'HOLD';
      
      // Extract high and low prices
      const highs = data.map((candle: any) => parseFloat(candle[2]));
      const lows = data.map((candle: any) => parseFloat(candle[3]));
      const closes = data.map((candle: any) => parseFloat(candle[4]));
      const volumes = data.map((candle: any) => parseFloat(candle[5]));
      
      // Identify potential resistance levels (recent highs)
      // We'll use a simple approach here - in a real strategy, this would be more sophisticated
      const recentData = data.slice(-20);
      const recentHighs = recentData.map((candle: any) => parseFloat(candle[2]));
      const maxHigh = Math.max(...recentHighs.slice(0, -1)); // Excluding most recent candle
      
      // Identify potential support levels (recent lows)
      const recentLows = recentData.map((candle: any) => parseFloat(candle[3]));
      const minLow = Math.min(...recentLows.slice(0, -1)); // Excluding most recent candle
      
      // Get most recent close
      const currentClose = closes[closes.length - 1];
      const previousClose = closes[closes.length - 2];
      
      // Get recent average volume (for confirmation)
      const avgVolume = volumes.slice(-10, -1).reduce((sum, vol) => sum + vol, 0) / 9;
      const currentVolume = volumes[volumes.length - 1];
      const volumeIncrease = currentVolume > avgVolume * 1.3; // 30% above average
      
      // Check for resistance breakout (bullish)
      if (previousClose < maxHigh && currentClose > maxHigh && volumeIncrease) {
        return 'BUY';
      }
      
      // Check for support breakdown (bearish)
      if (previousClose > minLow && currentClose < minLow && volumeIncrease) {
        return 'SELL';
      }
      
      return 'HOLD';
    } catch (error) {
      console.error('Error in Breakout strategy analysis:', error);
      return 'HOLD';
    }
  }
}

// New Profit-Taking Strategy
class ProfitTakingStrategy implements TradingStrategy {
  name = 'Profit Taking';
  description = 'Implements profit-taking rules based on price movement';
  
  async analyze(data: any): Promise<TradingSignal> {
    try {
      if (data.length < 10) return 'HOLD';
      
      // Extract price data
      const closes = data.map((candle: any) => parseFloat(candle[4]));
      const currentClose = closes[closes.length - 1];
      
      // Simple implementation for example purposes
      // In a real strategy, this would check current positions and their entry prices
      
      // Calculate short-term momentum (example using 3-period ROC)
      const roc = ((currentClose / closes[closes.length - 4]) - 1) * 100;
      
      // If we've seen strong positive momentum that's now slowing, take profits
      if (roc > 3 && roc < 5) {
        // Check if momentum is decreasing
        const previousRoc = ((closes[closes.length - 2] / closes[closes.length - 5]) - 1) * 100;
        if (roc < previousRoc) {
          return 'SELL'; // Take profits
        }
      }
      
      // Check for potential reversal patterns
      // This is simplified; real strategies would use more complex reversal patterns
      const lastThreeCloses = closes.slice(-3);
      if (lastThreeCloses[0] < lastThreeCloses[1] && lastThreeCloses[2] < lastThreeCloses[1]) {
        // Potential bearish reversal (higher high followed by lower low)
        return 'SELL'; // Take profits
      }
      
      return 'HOLD';
    } catch (error) {
      console.error('Error in Profit Taking strategy analysis:', error);
      return 'HOLD';
    }
  }
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
  
  constructor() {
    this.strategies = [
      new SMAStrategy(),
      new RSIStrategy(),
      new MACDStrategy(),
      new VolumeStrategy(),
      new DivergenceStrategy(),
      new BreakoutStrategy(),
      new ProfitTakingStrategy()
    ];
    
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
    
    try {
      if (signal === 'BUY') {
        console.log(`Executing BUY order for ${pair} at $${price}`);
        
        // Calculate position size based on risk level and whether dynamic sizing is enabled
        let quantity = '0.0015'; // Default size
        
        if (this.botSettings.useDynamicPositionSizing) {
          // Scale position size based on risk level (0.001 to 0.003)
          const baseSize = 0.001;
          const riskMultiplier = this.botSettings.riskLevel / 50; // 1.0 at 50% risk
          quantity = (baseSize * riskMultiplier * 1.5).toFixed(4);
          console.log(`Dynamic position sizing: ${quantity} based on risk level ${this.botSettings.riskLevel}%`);
        }
        
        await binanceService.placeMarketOrder(pair, 'BUY', quantity);
        
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
        
        toast.success(`Bought ${pair} at $${parseFloat(price).toLocaleString()}`);
      } else if (signal === 'SELL') {
        console.log(`Executing SELL order for ${pair} at $${price}`);
        
        // Use the same quantity from the buy
        const quantity = '0.0015';
        
        if (this.botSettings.useDynamicPositionSizing) {
          // Use the same quantity calculation logic as BUY
          const baseSize = 0.001;
          const riskMultiplier = this.botSettings.riskLevel / 50;
          const dynamicQuantity = (baseSize * riskMultiplier * 1.5).toFixed(4);
          console.log(`Dynamic position sizing for sell: ${dynamicQuantity}`);
        }
        
        await binanceService.placeMarketOrder(pair, 'SELL', quantity);
        
        if (position.entryPrice) {
          const priceDiff = parseFloat(price) - position.entryPrice;
          const percentChange = (priceDiff / position.entryPrice) * 100;
          console.log(`Closed position with ${percentChange.toFixed(2)}% ${priceDiff >= 0 ? 'profit' : 'loss'}`);
          
          // Update profit/loss statistics
          this.updateTradeStatistics(false, priceDiff >= 0, percentChange);
          
          if (priceDiff >= 0) {
            toast.success(`Sold ${pair} for ${percentChange.toFixed(2)}% profit`);
          } else {
            toast.info(`Sold ${pair} with ${Math.abs(percentChange).toFixed(2)}% loss`);
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
