
import binanceService from '../binanceService';
import StrategyManager from './strategyManager';
import RiskManager from './riskManager';
import { TradingEventEmitter } from './tradingEventEmitter';
import TradeExecutor from './execution/tradeExecutor';
import { 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands,
  detectMarketTrend
} from './indicators/technicalIndicators';
import { toast } from 'sonner';

class StrategyExecutor {
  private isRunning: boolean = false;
  private interval: number | null = null;
  private strategyManager: StrategyManager;
  private riskManager: RiskManager;
  private eventEmitter: TradingEventEmitter;
  private tradeExecutor: TradeExecutor;
  private lastMarketAnalysis: Record<string, any> = {};
  private marketTrends: Record<string, string> = {};
  private tradingPairs: string[] = [];
  
  constructor(
    strategyManager: StrategyManager, 
    riskManager: RiskManager,
    eventEmitter: TradingEventEmitter
  ) {
    this.strategyManager = strategyManager;
    this.riskManager = riskManager;
    this.eventEmitter = eventEmitter;
    this.tradeExecutor = new TradeExecutor(eventEmitter);
    
    // Apply risk settings from risk manager
    this.tradeExecutor.setRiskParameters(this.riskManager.getRiskSettings());
    
    // Listen for risk setting changes
    this.eventEmitter.subscribe((event) => {
      if (event.event === 'risk_settings_updated') {
        this.tradeExecutor.setRiskParameters(this.riskManager.getRiskSettings());
      }
    });
  }
  
  public async startTrading(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting automated trading system');
    
    // Initialize trading pairs
    await this.initializeTradingPairs();
    
    // Check for strategy triggers every minute
    this.interval = window.setInterval(() => this.analyzeMarket(), 60000);
    
    // Run immediately upon start
    this.analyzeMarket();
    
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
  
  private async initializeTradingPairs(): Promise<void> {
    try {
      console.log('Initializing trading pairs');
      
      // Get account balances
      const account = await binanceService.getAccountInfo();
      
      if (account && account.balances) {
        // Filter balances to only include assets with non-zero balances
        const activeBalances = account.balances.filter(
          balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        );
        
        // Convert each asset to a trading pair with USDT
        const portfolioPairs = activeBalances
          .map(balance => `${balance.asset}USDT`)
          .filter(pair => pair !== 'USDTUSDT'); // Exclude USDT itself
        
        console.log('Initialized trading pairs from portfolio:', portfolioPairs);
        
        if (portfolioPairs.length > 0) {
          this.tradingPairs = portfolioPairs;
        } else {
          // Fallback to default trading pairs
          this.tradingPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
          console.log('Using default trading pairs:', this.tradingPairs);
        }
      } else {
        // Fallback to default trading pairs
        this.tradingPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
        console.log('Using default trading pairs:', this.tradingPairs);
      }
      
      console.log('Initialized trading with portfolio pairs:', this.tradingPairs);
    } catch (error) {
      console.error('Error initializing trading pairs:', error);
      // Fallback to default pairs if initialization fails
      this.tradingPairs = ['BTCUSDT', 'ETHUSDT'];
    }
  }
  
  private async analyzeMarket(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('Analyzing market for profit opportunities...');
    
    try {
      // Get current prices for all trading pairs
      const prices = await binanceService.getPrices();
      
      // Update existing positions with latest prices
      await this.tradeExecutor.updatePositions(prices);
      
      // Get enabled strategies for analysis
      const enabledStrategies = this.strategyManager.getStrategies().filter(s => s.enabled);
      
      if (enabledStrategies.length === 0) {
        console.log('No enabled strategies found.');
        return;
      }
      
      console.log(`Analyzing market with ${enabledStrategies.length} active strategies.`);
      
      // Analyze each trading pair with multiple timeframes
      for (const pair of this.tradingPairs) {
        await this.analyzePair(pair, prices[pair]);
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      toast.error('Error analyzing market. Check console for details.');
    }
  }
  
  private async analyzePair(pair: string, currentPrice: string): Promise<void> {
    try {
      if (!currentPrice) {
        console.log(`No price available for ${pair}, skipping analysis.`);
        return;
      }
      
      console.log(`Analyzing ${pair} at price $${currentPrice}`);
      
      // Define multiple timeframes for analysis
      const timeframes = ['15m', '1h', '4h'];
      const signals: Record<string, string> = {};
      const indicatorData: Record<string, any> = {};
      
      // Analyze all timeframes
      for (const timeframe of timeframes) {
        try {
          const klines = await binanceService.getKlines(pair, timeframe, 100);
          
          // Extract close prices
          const closes = klines.map(k => parseFloat(k[4]));
          const highs = klines.map(k => parseFloat(k[2]));
          const lows = klines.map(k => parseFloat(k[3]));
          
          // Calculate various indicators
          const rsi = calculateRSI(closes, 14);
          const macd = calculateMACD(closes);
          const bollinger = calculateBollingerBands(closes, 20, 2);
          const trend = detectMarketTrend(closes);
          
          // Store indicator values for this timeframe
          indicatorData[timeframe] = {
            rsi: rsi[rsi.length - 1],
            macd: {
              line: macd.macdLine[macd.macdLine.length - 1],
              signal: macd.signalLine[macd.signalLine.length - 1],
              histogram: macd.histogram[macd.histogram.length - 1]
            },
            bollinger: {
              upper: bollinger.upper[bollinger.upper.length - 1],
              middle: bollinger.middle[bollinger.middle.length - 1],
              lower: bollinger.lower[bollinger.lower.length - 1]
            },
            currentPrice: parseFloat(currentPrice),
            trend
          };
          
          // Apply trading rules for this timeframe
          const signal = this.applyTradingRules(indicatorData[timeframe]);
          signals[timeframe] = signal;
          
          console.log(`${pair} ${timeframe} analysis:`, 
            `RSI: ${rsi[rsi.length - 1].toFixed(2)},`,
            `MACD Hist: ${macd.histogram[macd.histogram.length - 1]?.toFixed(5) || 'N/A'},`,
            `Trend: ${trend},`,
            `Signal: ${signal}`
          );
        } catch (error) {
          console.error(`Error analyzing ${pair} on ${timeframe}:`, error);
          signals[timeframe] = 'ERROR';
        }
      }
      
      // Store the analysis results
      this.lastMarketAnalysis[pair] = indicatorData;
      
      // Determine final signal based on multiple timeframes
      const finalSignal = this.determineMultiTimeframeSignal(signals, indicatorData);
      console.log(`${pair} final signal: ${finalSignal}`);
      
      // Store market trend
      if (indicatorData['1h'] && indicatorData['1h'].trend) {
        this.marketTrends[pair] = indicatorData['1h'].trend;
      }
      
      // Execute the trade based on the final signal
      await this.executeSignal(pair, finalSignal, parseFloat(currentPrice), indicatorData);
      
    } catch (error) {
      console.error(`Error analyzing ${pair}:`, error);
    }
  }
  
  private applyTradingRules(data: any): string {
    if (!data) return 'HOLD';
    
    // RSI rules
    const isOversold = data.rsi < 30;
    const isOverbought = data.rsi > 70;
    
    // MACD rules
    const macdCrossingUp = data.macd.line > data.macd.signal && data.macd.histogram > 0;
    const macdCrossingDown = data.macd.line < data.macd.signal && data.macd.histogram < 0;
    
    // Bollinger Band rules
    const priceNearLowerBand = data.currentPrice < data.bollinger.lower * 1.01; // Within 1% of lower band
    const priceNearUpperBand = data.currentPrice > data.bollinger.upper * 0.99; // Within 1% of upper band
    
    // Trend direction
    const isUptrend = data.trend === 'uptrend' || data.trend === 'strong_uptrend';
    const isDowntrend = data.trend === 'downtrend' || data.trend === 'strong_downtrend';
    
    // Combined rules for buy signal
    if ((isOversold && macdCrossingUp) || 
        (priceNearLowerBand && macdCrossingUp) || 
        (isUptrend && data.rsi > 30 && data.rsi < 50 && macdCrossingUp)) {
      return 'BUY';
    }
    
    // Combined rules for sell signal
    if ((isOverbought && macdCrossingDown) || 
        (priceNearUpperBand && macdCrossingDown) || 
        (isDowntrend && data.rsi > 50 && macdCrossingDown)) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
  
  private determineMultiTimeframeSignal(
    signals: Record<string, string>,
    data: Record<string, any>
  ): string {
    // Count signals
    let buyCount = 0;
    let sellCount = 0;
    let holdCount = 0;
    
    for (const timeframe in signals) {
      if (signals[timeframe] === 'BUY') buyCount++;
      else if (signals[timeframe] === 'SELL') sellCount++;
      else if (signals[timeframe] === 'HOLD') holdCount++;
    }
    
    // Check for strong trend alignment across timeframes
    const hourlyTrend = data['1h']?.trend || 'neutral';
    const fourHourTrend = data['4h']?.trend || 'neutral';
    
    const trendAligned = 
      (hourlyTrend.includes('uptrend') && fourHourTrend.includes('uptrend')) ||
      (hourlyTrend.includes('downtrend') && fourHourTrend.includes('downtrend'));
    
    // More aggressive in aligned trends
    if (trendAligned) {
      if (buyCount >= 1 && hourlyTrend.includes('uptrend') && signals['1h'] === 'BUY') {
        return 'BUY';
      }
      
      if (sellCount >= 1 && hourlyTrend.includes('downtrend') && signals['1h'] === 'SELL') {
        return 'SELL';
      }
    }
    
    // Conservative approach for conflicting trends
    if (buyCount >= 2 && sellCount === 0) {
      return 'BUY';
    }
    
    if (sellCount >= 2 && buyCount === 0) {
      return 'SELL';
    }
    
    return 'HOLD';
  }
  
  private async executeSignal(
    pair: string, 
    signal: string, 
    currentPrice: number,
    indicatorData: Record<string, any>
  ): Promise<void> {
    // Skip if no signal
    if (signal === 'HOLD') {
      return;
    }
    
    // Get current hour data for high/low (for stop loss calculation)
    const hourData = indicatorData['1h'];
    
    if (signal === 'BUY') {
      // Try to extract high, low, close prices for better stop loss calculation
      const high = hourData?.currentPrice || currentPrice;
      const low = hourData?.bollinger?.lower || currentPrice * 0.95;
      const close = currentPrice;
      
      // Execute buy order with volatility-adjusted stop loss
      await this.tradeExecutor.executeBuy(pair, currentPrice, high, low, close);
    } else if (signal === 'SELL') {
      // Execute sell order
      await this.tradeExecutor.executeSell(pair, currentPrice);
    }
  }
  
  // Get active positions
  public getActivePositions(): any[] {
    return this.tradeExecutor.getPositions();
  }
  
  // Get market analysis
  public getMarketAnalysis(): Record<string, any> {
    return { ...this.lastMarketAnalysis };
  }
  
  // Get market trends
  public getMarketTrends(): Record<string, string> {
    return { ...this.marketTrends };
  }
}

export default StrategyExecutor;
