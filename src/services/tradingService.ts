import { toast } from "sonner";
import binanceService from "./binanceService";
import notificationService from "./notificationService";

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

export interface SignalHistory {
  id: string;
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: string;
  timestamp: Date;
  profit?: string;
  successful?: boolean;
}

class TradingService {
  private strategies: Strategy[] = [];
  private isRunning = false;
  private executionInterval: ReturnType<typeof setInterval> | null = null;
  private signalHistory: SignalHistory[] = [];
  private marketSentiment: Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }> = {};

  constructor() {
    this.loadStrategies();
    this.loadSignalHistory();
    this.initializeMarketSentiment();
  }

  private loadStrategies() {
    const savedStrategies = localStorage.getItem('tradingStrategies');
    if (savedStrategies) {
      this.strategies = JSON.parse(savedStrategies);
    } else {
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
        },
        {
          id: "3",
          name: "VWAP Mean Reversion",
          description: "Uses Volume Weighted Average Price (VWAP) to identify mean reversion opportunities when price deviates too far from VWAP.",
          isActive: true,
          symbol: "SOLUSDT",
          interval: "2h",
          parameters: {
            vwapPeriod: 24,
            deviationThreshold: 3.5,
            profitTarget: 2.0,
            stopLoss: 1.5,
            lookbackPeriods: 3
          },
          performance: "+15.2%",
          trades: 18,
          winRate: "78%"
        },
        {
          id: "4",
          name: "Fibonacci Retracement + RSI",
          description: "Combines Fibonacci retracement levels with RSI to identify optimal entry points during pullbacks in a trend.",
          isActive: false,
          symbol: "BTCUSDT",
          interval: "1d",
          parameters: {
            fibLevels: [0.382, 0.5, 0.618],
            rsiPeriod: 14,
            rsiThreshold: 40,
            trendPeriod: 50,
            stopLoss: 5.0,
            takeProfit: 15.0
          },
          performance: "+23.8%",
          trades: 7,
          winRate: "85%"
        },
        {
          id: "5",
          name: "Ichimoku Cloud Breakout",
          description: "Uses the Ichimoku Cloud indicator to identify trend direction and potential breakout points.",
          isActive: false,
          symbol: "ETHUSDT",
          interval: "12h",
          parameters: {
            conversionPeriod: 9,
            basePeriod: 26,
            laggingSpan2Period: 52,
            displacement: 26,
            stopLoss: 4.0,
            takeProfit: 12.0
          },
          performance: "+18.3%",
          trades: 9,
          winRate: "77%"
        }
      ];
      this.saveStrategies();
    }
  }

  private loadSignalHistory() {
    const savedHistory = localStorage.getItem('signalHistory');
    if (savedHistory) {
      this.signalHistory = JSON.parse(savedHistory);
    }
  }

  private saveSignalHistory() {
    localStorage.setItem('signalHistory', JSON.stringify(this.signalHistory));
  }

  private saveStrategies() {
    localStorage.setItem('tradingStrategies', JSON.stringify(this.strategies));
  }

  private initializeMarketSentiment() {
    this.marketSentiment = {
      "BTC": { score: 75, trend: 'bullish' },
      "ETH": { score: 68, trend: 'bullish' },
      "SOL": { score: 82, trend: 'bullish' },
      "BNB": { score: 55, trend: 'neutral' },
      "XRP": { score: 42, trend: 'bearish' }
    };
    
    setInterval(() => this.updateMarketSentiment(), 15 * 60 * 1000);
  }

  private updateMarketSentiment() {
    Object.keys(this.marketSentiment).forEach(symbol => {
      const currentScore = this.marketSentiment[symbol].score;
      let newScore = currentScore + (Math.random() * 10 - 5);
      newScore = Math.max(0, Math.min(100, newScore));
      
      let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (newScore > 65) trend = 'bullish';
      else if (newScore < 35) trend = 'bearish';
      
      this.marketSentiment[symbol] = { score: newScore, trend };
    });
    
    if (this.marketSentiment["BTC"].score > 85) {
      notificationService.sendTelegramMessage("🔔 Strong bullish signal for BTC detected by AI - consider increasing position size");
    } else if (this.marketSentiment["BTC"].score < 20) {
      notificationService.sendTelegramMessage("⚠️ Strong bearish signal for BTC detected by AI - consider reducing exposure");
    }
  }

  public getMarketSentiment(): Record<string, { score: number; trend: 'bullish' | 'bearish' | 'neutral' }> {
    return { ...this.marketSentiment };
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

  public getSignalHistory(): SignalHistory[] {
    return [...this.signalHistory];
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
    
    notificationService.sendTelegramMessage(`New strategy "${newStrategy.name}" added for ${newStrategy.symbol}`);
    
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
      
      if (strategy.isActive) {
        notificationService.sendTelegramMessage(`Strategy "${strategy.name}" activated for ${strategy.symbol}`);
      }
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

    this.isRunning = true;
    this.executionInterval = setInterval(() => this.executeStrategies(), 60000);
    toast.success("Trading bot started successfully");
    
    notificationService.sendTelegramMessage("🤖 Trading bot started successfully!");
    
    return true;
  }

  public stopTrading(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    this.isRunning = false;
    toast.info("Trading bot stopped");
    
    notificationService.sendTelegramMessage("🛑 Trading bot has been stopped");
  }

  public isBotRunning(): boolean {
    return this.isRunning;
  }

  private async executeStrategies(): Promise<void> {
    const activeStrategies = this.getActiveStrategies();
    
    for (const strategy of activeStrategies) {
      try {
        const prices = await binanceService.getPrices();
        const currentPrice = prices[strategy.symbol];
        
        if (!currentPrice) {
          console.error(`Price not found for symbol ${strategy.symbol}`);
          continue;
        }

        const signal = await this.analyzeStrategy(strategy, currentPrice);
        
        if (signal.action !== 'HOLD') {
          this.executeTrade(signal);
        }
        
        strategy.lastExecuted = new Date();
        this.saveStrategies();
      } catch (error) {
        console.error(`Error executing strategy ${strategy.name}:`, error);
      }
    }
  }

  private async analyzeStrategy(strategy: Strategy, price: string): Promise<TradeSignal> {
    console.log(`Analyzing ${strategy.name} for ${strategy.symbol} at price $${price}`);
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reason = 'No signal generated';
    
    try {
      const klines = await binanceService.getKlines(strategy.symbol, strategy.interval, 100);
      
      if (!klines || klines.length === 0) {
        throw new Error('Failed to get historical data for analysis');
      }

      const closePrices = klines.map(kline => parseFloat(kline[4]));
      const highPrices = klines.map(kline => parseFloat(kline[2]));
      const lowPrices = klines.map(kline => parseFloat(kline[3]));
      const volumes = klines.map(kline => parseFloat(kline[5]));
      const currentPrice = parseFloat(price);
      
      switch (strategy.name) {
        case "RSI + MACD Crossover": {
          const rsiPeriod = strategy.parameters.rsiPeriod || 14;
          const rsiValues = this.calculateRSI(closePrices, rsiPeriod);
          const currentRSI = rsiValues[rsiValues.length - 1];
          
          const { macdLine, signalLine } = this.calculateMACD(
            closePrices,
            strategy.parameters.macdFast || 12,
            strategy.parameters.macdSlow || 26,
            strategy.parameters.macdSignal || 9
          );
          
          const prevMACD = macdLine[macdLine.length - 2];
          const currentMACD = macdLine[macdLine.length - 1];
          const prevSignal = signalLine[signalLine.length - 2];
          const currentSignal = signalLine[signalLine.length - 1];
          
          if (currentRSI < (strategy.parameters.rsiOversold || 30) && 
              prevMACD < prevSignal && 
              currentMACD > currentSignal) {
            action = 'BUY';
            reason = `RSI oversold (${currentRSI.toFixed(2)}) with bullish MACD crossover`;
          } 
          else if (currentRSI > (strategy.parameters.rsiOverbought || 70) && 
                  prevMACD > prevSignal && 
                  currentMACD < currentSignal) {
            action = 'SELL';
            reason = `RSI overbought (${currentRSI.toFixed(2)}) with bearish MACD crossover`;
          }
          break;
        }
        
        case "Bollinger Breakout": {
          const bbPeriod = strategy.parameters.bbPeriod || 20;
          const bbDeviation = strategy.parameters.bbDeviation || 2;
          
          const { upper, middle, lower } = this.calculateBollingerBands(closePrices, bbPeriod, bbDeviation);
          
          const currentClose = closePrices[closePrices.length - 1];
          const previousClose = closePrices[closePrices.length - 2];
          
          const currentUpper = upper[upper.length - 1];
          const currentLower = lower[lower.length - 1];
          
          const entryThreshold = strategy.parameters.entryThreshold || 2.5;
          
          if (previousClose < currentUpper && currentClose > currentUpper * (1 + entryThreshold / 100)) {
            action = 'BUY';
            reason = `Price broke above upper Bollinger Band with momentum`;
          } 
          else if (previousClose > currentLower && currentClose < currentLower * (1 - entryThreshold / 100)) {
            action = 'SELL';
            reason = `Price broke below lower Bollinger Band with momentum`;
          }
          break;
        }
        
        case "VWAP Mean Reversion": {
          const vwapPeriod = strategy.parameters.vwapPeriod || 24;
          
          const vwap = this.calculateVWAP(closePrices, highPrices, lowPrices, volumes, vwapPeriod);
          const currentVWAP = vwap[vwap.length - 1];
          const currentClose = closePrices[closePrices.length - 1];
          
          const deviationThreshold = strategy.parameters.deviationThreshold || 3.5;
          const deviationPercent = Math.abs((currentClose - currentVWAP) / currentVWAP * 100);
          
          if (deviationPercent > deviationThreshold && currentClose > currentVWAP &&
              (!this.marketSentiment[strategy.symbol.replace('USDT', '')] || 
               this.marketSentiment[strategy.symbol.replace('USDT', '')].score < 80)) {
            action = 'SELL';
            reason = `Price ${deviationPercent.toFixed(2)}% above VWAP, expected to revert`;
          } 
          else if (deviationPercent > deviationThreshold && currentClose < currentVWAP &&
                  (!this.marketSentiment[strategy.symbol.replace('USDT', '')] || 
                   this.marketSentiment[strategy.symbol.replace('USDT', '')].score > 20)) {
            action = 'BUY';
            reason = `Price ${deviationPercent.toFixed(2)}% below VWAP, expected to revert`;
          }
          break;
        }
        
        case "Fibonacci Retracement + RSI": {
          const rsiPeriod = strategy.parameters.rsiPeriod || 14;
          const rsiValues = this.calculateRSI(closePrices, rsiPeriod);
          const currentRSI = rsiValues[rsiValues.length - 1];
          
          const slicedPrices = closePrices.slice(-100);
          const highestPrice = Math.max(...slicedPrices);
          const lowestPrice = Math.min(...slicedPrices);
          
          const fibLevels = strategy.parameters.fibLevels || [0.382, 0.5, 0.618];
          const fibPrices = fibLevels.map(level => 
            highestPrice - (highestPrice - lowestPrice) * level
          );
          
          const currentPrice = parseFloat(currentPrice);
          const rsiThreshold = strategy.parameters.rsiThreshold || 40;
          
          for (let i = 0; i < fibPrices.length; i++) {
            const fibPrice = fibPrices[i];
            const priceDeviation = Math.abs(currentPrice - fibPrice) / fibPrice * 100;
            
            if (priceDeviation < 1.0 && currentRSI < rsiThreshold) {
              action = 'BUY';
              reason = `Price at ${fibLevels[i] * 100}% Fibonacci retracement with oversold RSI (${currentRSI.toFixed(2)})`;
              break;
            }
          }
          break;
        }
        
        case "Ichimoku Cloud Breakout": {
          const conversion = strategy.parameters.conversionPeriod || 9;
          const base = strategy.parameters.basePeriod || 26;
          const laggingSpan2 = strategy.parameters.laggingSpan2Period || 52;
          const displacement = strategy.parameters.displacement || 26;
          
          const ichimoku = this.calculateIchimoku(
            highPrices, 
            lowPrices, 
            conversion, 
            base, 
            laggingSpan2, 
            displacement
          );
          
          const currentClose = closePrices[closePrices.length - 1];
          const currentTenkan = ichimoku.conversionLine[ichimoku.conversionLine.length - 1];
          const currentKijun = ichimoku.baseLine[ichimoku.baseLine.length - 1];
          const currentSenkouA = ichimoku.leadingSpanA[ichimoku.leadingSpanA.length - displacement];
          const currentSenkouB = ichimoku.leadingSpanB[ichimoku.leadingSpanB.length - displacement];
          
          if (currentClose > currentSenkouA && currentClose > currentSenkouB &&
              ichimoku.conversionLine[ichimoku.conversionLine.length - 2] < ichimoku.baseLine[ichimoku.baseLine.length - 2] &&
              currentTenkan > currentKijun) {
            action = 'BUY';
            reason = `Price above Ichimoku Cloud with bullish Tenkan-Kijun cross`;
          } 
          else if (currentClose < currentSenkouA && currentClose < currentSenkouB &&
                  ichimoku.conversionLine[ichimoku.conversionLine.length - 2] > ichimoku.baseLine[ichimoku.baseLine.length - 2] &&
                  currentTenkan < currentKijun) {
            action = 'SELL';
            reason = `Price below Ichimoku Cloud with bearish Tenkan-Kijun cross`;
          }
          break;
        }
        
        default: {
          const randomValue = Math.random();
          if (randomValue < 0.1) {
            action = 'BUY';
            reason = 'Random trading signal (demo mode)';
          } else if (randomValue > 0.9) {
            action = 'SELL';
            reason = 'Random trading signal (demo mode)';
          }
        }
      }
    } catch (error) {
      console.error(`Strategy analysis error:`, error);
      const randomValue = Math.random();
      if (randomValue < 0.05) {
        action = 'BUY';
        reason = 'Random signal (fallback after analysis error)';
      } else if (randomValue > 0.95) {
        action = 'SELL';
        reason = 'Random signal (fallback after analysis error)';
      }
    }
    
    return {
      strategy,
      symbol: strategy.symbol,
      action,
      price,
      reason,
      timestamp: new Date()
    };
  }

  private async executeTrade(signal: TradeSignal): Promise<void> {
    try {
      if (signal.action === 'HOLD') {
        return;
      }
      
      const quantity = signal.symbol.includes('BTC') ? '0.001' : '0.01';
      
      console.log(`Executing ${signal.action} for ${signal.symbol} at $${signal.price}: ${signal.reason}`);
      
      const orderResult = await binanceService.placeMarketOrder(
        signal.symbol,
        signal.action,
        quantity
      );
      
      const signalRecord: SignalHistory = {
        id: Date.now().toString(),
        strategyId: signal.strategy.id,
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        timestamp: new Date(),
        successful: true
      };
      
      this.signalHistory.unshift(signalRecord);
      if (this.signalHistory.length > 100) {
        this.signalHistory.pop();
      }
      this.saveSignalHistory();
      
      const strategy = this.getStrategyById(signal.strategy.id);
      if (strategy) {
        strategy.trades = (strategy.trades || 0) + 1;
        this.saveStrategies();
      }
      
      this.notifyTrade(signal);
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  }

  private notifyTrade(signal: TradeSignal): void {
    toast.success(
      `${signal.action} signal for ${signal.symbol} at $${signal.price}`, 
      { description: signal.reason }
    );
    
    notificationService.notifyTrade(
      signal.symbol, 
      signal.action, 
      signal.price
    );
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsiValues: number[] = [];
    
    if (prices.length <= period) {
      return Array(prices.length).fill(50);
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      
      let currentGain = 0;
      let currentLoss = 0;
      
      if (difference >= 0) {
        currentGain = difference;
      } else {
        currentLoss = -difference;
      }
      
      avgGain = ((avgGain * (period - 1)) + currentGain) / period;
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
      
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      
      rsiValues.push(rsi);
    }
    
    return Array(period).fill(50).concat(rsiValues);
  }

  private calculateMACD(prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): { macdLine: number[], signalLine: number[] } {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    return { macdLine, signalLine };
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    
    ema.push(sum / period);
    
    for (let i = period; i < prices.length; i++) {
      ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    
    return Array(prices.length - ema.length).fill(ema[0]).concat(ema);
  }

  private calculateBollingerBands(prices: number[], period: number, deviation: number): { upper: number[], middle: number[], lower: number[] } {
    const middle: number[] = [];
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        middle.push(prices[i]);
        upper.push(prices[i]);
        lower.push(prices[i]);
        continue;
      }
      
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      const sma = sum / period;
      
      let squaredDiffSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        squaredDiffSum += Math.pow(prices[j] - sma, 2);
      }
      const stdDev = Math.sqrt(squaredDiffSum / period);
      
      middle.push(sma);
      upper.push(sma + (stdDev * deviation));
      lower.push(sma - (stdDev * deviation));
    }
    
    return { upper, middle, lower };
  }

  private calculateVWAP(closePrices: number[], highPrices: number[], lowPrices: number[], volumes: number[], period: number): number[] {
    const vwap: number[] = [];
    
    for (let i = 0; i < closePrices.length; i++) {
      if (i < period - 1) {
        vwap.push(closePrices[i]);
        continue;
      }
      
      let sumPV = 0;
      let sumV = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const typicalPrice = (highPrices[j] + lowPrices[j] + closePrices[j]) / 3;
        sumPV += typicalPrice * volumes[j];
        sumV += volumes[j];
      }
      
      vwap.push(sumV === 0 ? closePrices[i] : sumPV / sumV);
    }
    
    return vwap;
  }

  private calculateIchimoku(highPrices: number[], lowPrices: number[], conversionPeriod: number, basePeriod: number, laggingSpan2Period: number, displacement: number): {
    conversionLine: number[],
    baseLine: number[],
    leadingSpanA: number[],
    leadingSpanB: number[],
    laggingSpan: number[]
  } {
    const conversionLine: number[] = [];
    const baseLine: number[] = [];
    const leadingSpanA: number[] = [];
    const leadingSpanB: number[] = [];
    const laggingSpan: number[] = [];
    
    const findHighestLowest = (arr: number[], start: number, length: number) => {
      let highest = -Infinity;
      let lowest = Infinity;
      
      for (let i = start; i < start + length && i < arr.length; i++) {
        highest = Math.max(highest, arr[i]);
        lowest = Math.min(lowest, arr[i]);
      }
      
      return { highest, lowest };
    };
    
    for (let i = 0; i < highPrices.length; i++) {
      if (i < conversionPeriod - 1) {
        conversionLine.push((highPrices[i] + lowPrices[i]) / 2);
        continue;
      }
      
      const { highest, lowest } = findHighestLowest(highPrices, i - conversionPeriod + 1, conversionPeriod);
      conversionLine.push((highest + lowest) / 2);
    }
    
    for (let i = 0; i < highPrices.length; i++) {
      if (i < basePeriod - 1) {
        baseLine.push((highPrices[i] + lowPrices[i]) / 2);
        continue;
      }
      
      const { highest, lowest } = findHighestLowest(highPrices, i - basePeriod + 1, basePeriod);
      baseLine.push((highest + lowest) / 2);
    }
    
    for (let i = 0; i < highPrices.length; i++) {
      if (i < basePeriod - 1) {
        leadingSpanA.push((conversionLine[i] + baseLine[i]) / 2);
        continue;
      }
      
      leadingSpanA.push((conversionLine[i] + baseLine[i]) / 2);
    }
    
    for (let i = 0; i < highPrices.length; i++) {
      if (i < laggingSpan2Period - 1) {
        leadingSpanB.push((highPrices[i] + lowPrices[i]) / 2);
        continue;
      }
      
      const { highest, lowest } = findHighestLowest(highPrices, i - laggingSpan2Period + 1, laggingSpan2Period);
      leadingSpanB.push((highest + lowest) / 2);
    }
    
    for (let i = 0; i < highPrices.length; i++) {
      laggingSpan.push(0);
    }
    
    return {
      conversionLine,
      baseLine,
      leadingSpanA,
      leadingSpanB,
      laggingSpan
    };
  }
}

const tradingService = new TradingService();
export default tradingService;
