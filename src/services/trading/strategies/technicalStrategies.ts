/**
 * Technical trading strategy implementations.
 *
 * Each class implements the internal TradingStrategy interface used by
 * TradingService.  They are deliberately kept pure (no side-effects) so they
 * can be unit-tested in isolation without a live Binance connection.
 */

type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

interface TradingStrategy {
  name: string;
  description: string;
  analyze(data: any[]): Promise<TradingSignal>;
}

// ---------------------------------------------------------------------------
// SMA Crossover Strategy
// ---------------------------------------------------------------------------
export class SMAStrategy implements TradingStrategy {
  name = 'SMA Crossover';
  description = 'Simple Moving Average crossover strategy (3/10)';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      const sma3 = this.calculateSMA(data, 3);
      const sma10 = this.calculateSMA(data, 10);

      const currentSMA3 = sma3[sma3.length - 1];
      const previousSMA3 = sma3[sma3.length - 2];
      const currentSMA10 = sma10[sma10.length - 1];
      const previousSMA10 = sma10[sma10.length - 2];

      if (previousSMA3 <= previousSMA10 && currentSMA3 > currentSMA10) return 'BUY';
      if (previousSMA3 >= previousSMA10 && currentSMA3 < currentSMA10) return 'SELL';
      if (currentSMA3 > currentSMA10 && currentSMA3 > previousSMA3) return 'BUY';
      if (currentSMA3 < currentSMA10 && currentSMA3 < previousSMA3) return 'SELL';

      return 'HOLD';
    } catch (error) {
      console.error('Error in SMA strategy analysis:', error);
      return 'HOLD';
    }
  }

  calculateSMA(data: any[], period: number): number[] {
    const sma: number[] = [];
    if (data.length < period) return sma;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += parseFloat(data[i][4]);
    sma.push(sum / period);

    for (let i = period; i < data.length; i++) {
      sum = sum - parseFloat(data[i - period][4]) + parseFloat(data[i][4]);
      sma.push(sum / period);
    }
    return sma;
  }
}

// ---------------------------------------------------------------------------
// RSI Strategy
// ---------------------------------------------------------------------------
export class RSIStrategy implements TradingStrategy {
  name = 'RSI';
  description = 'Relative Strength Index strategy (8-period)';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      const rsi = this.calculateRSI(data, 8);
      const currentRSI = rsi[rsi.length - 1];
      const previousRSI = rsi[rsi.length - 2] || 50;

      if (currentRSI < 40) return 'BUY';
      if (currentRSI > 60) return 'SELL';
      if (currentRSI > previousRSI && currentRSI > 45 && currentRSI < 55) return 'BUY';
      if (currentRSI < previousRSI && currentRSI > 45 && currentRSI < 55) return 'SELL';

      return 'HOLD';
    } catch (error) {
      console.error('Error in RSI strategy analysis:', error);
      return 'HOLD';
    }
  }

  calculateRSI(data: any[], period: number): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = parseFloat(data[i][4]) - parseFloat(data[i - 1][4]);
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    if (data.length <= period + 1) return rsi;

    let avgGain = gains.slice(0, period).reduce((s, g) => s + g, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((s, l) => s + l, 0) / period;

    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi.push(100 - (100 / (1 + rs)));

    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
  }
}

// ---------------------------------------------------------------------------
// MACD Strategy
// ---------------------------------------------------------------------------
export class MACDStrategy implements TradingStrategy {
  name = 'MACD';
  description = 'Moving Average Convergence Divergence strategy';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      const ema8 = this.calculateEMA(data, 8);
      const ema17 = this.calculateEMA(data, 17);

      const macdLine: number[] = [];
      for (let i = 0; i < ema8.length; i++) {
        if (i < ema17.length) macdLine.push(ema8[i] - ema17[i]);
      }

      const signalLine = this.calculateEMAFromArray(macdLine, 5);

      if (macdLine.length === 0 || signalLine.length === 0) return 'HOLD';

      const currentMACD = macdLine[macdLine.length - 1];
      const previousMACD = macdLine[macdLine.length - 2];
      const currentSignal = signalLine[signalLine.length - 1];
      const previousSignal = signalLine[signalLine.length - 2];

      if (previousMACD <= previousSignal && currentMACD > currentSignal) return 'BUY';
      if (previousMACD >= previousSignal && currentMACD < currentSignal) return 'SELL';
      if (previousMACD < 0 && currentMACD >= 0) return 'BUY';
      if (previousMACD > 0 && currentMACD <= 0) return 'SELL';
      if (previousMACD < currentMACD && currentMACD > 0) return 'BUY';
      if (previousMACD > currentMACD && currentMACD < 0) return 'SELL';

      return 'HOLD';
    } catch (error) {
      console.error('Error in MACD strategy analysis:', error);
      return 'HOLD';
    }
  }

  calculateEMA(data: any[], period: number): number[] {
    const ema: number[] = [];
    if (data.length < period) return ema;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += parseFloat(data[i][4]);
    ema.push(sum / period);

    const multiplier = 2 / (period + 1);
    for (let i = period; i < data.length; i++) {
      const currentEMA = (parseFloat(data[i][4]) - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    return ema;
  }

  calculateEMAFromArray(data: number[], period: number): number[] {
    const ema: number[] = [];
    if (data.length < period) return ema;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    ema.push(sum / period);

    const multiplier = 2 / (period + 1);
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    return ema;
  }
}

// ---------------------------------------------------------------------------
// Volume Strategy
// ---------------------------------------------------------------------------
export class VolumeStrategy implements TradingStrategy {
  name = 'Volume Analysis';
  description = 'Analyzes volume patterns for trading signals';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      if (data.length < 10) return 'HOLD';

      const volumes = data.slice(-10).map((c: any) => parseFloat(c[5]));
      const closes = data.slice(-10).map((c: any) => parseFloat(c[4]));

      const avgVolume = volumes.slice(0, 8).reduce((s, v) => s + v, 0) / 8;
      const latestVolume = volumes[volumes.length - 1];
      const previousVolume = volumes[volumes.length - 2];

      const latestClose = closes[closes.length - 1];
      const previousClose = closes[closes.length - 2];
      const priceChange = (latestClose - previousClose) / previousClose;

      if (latestVolume > avgVolume * 1.5 && priceChange > 0.002) return 'BUY';
      if (latestVolume > avgVolume * 1.5 && priceChange < -0.002) return 'SELL';

      if (latestVolume > previousVolume && latestVolume > avgVolume) {
        if (priceChange > 0.001) return 'BUY';
        if (priceChange < -0.001) return 'SELL';
      }

      return 'HOLD';
    } catch (error) {
      console.error('Error in Volume strategy analysis:', error);
      return 'HOLD';
    }
  }
}

// ---------------------------------------------------------------------------
// RSI Divergence Strategy
// ---------------------------------------------------------------------------
export class DivergenceStrategy implements TradingStrategy {
  name = 'RSI Divergence';
  description = 'Detects price/RSI divergences for potential reversals';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      const rsi = this.calculateRSI(data, 14);
      if (rsi.length < 10) return 'HOLD';

      const closePrices = data.slice(-rsi.length).map((c: any) => parseFloat(c[4]));

      const bullishDivergence =
        closePrices[closePrices.length - 1] < closePrices[closePrices.length - 3] &&
        rsi[rsi.length - 1] > rsi[rsi.length - 3];

      const bearishDivergence =
        closePrices[closePrices.length - 1] > closePrices[closePrices.length - 3] &&
        rsi[rsi.length - 1] < rsi[rsi.length - 3];

      if (bullishDivergence && rsi[rsi.length - 1] < 40) return 'BUY';
      if (bearishDivergence && rsi[rsi.length - 1] > 70) return 'SELL';

      return 'HOLD';
    } catch (error) {
      console.error('Error in Divergence strategy analysis:', error);
      return 'HOLD';
    }
  }

  private calculateRSI(data: any[], period: number): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = parseFloat(data[i][4]) - parseFloat(data[i - 1][4]);
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    if (data.length <= period + 1) return rsi;

    let avgGain = gains.slice(0, period).reduce((s, g) => s + g, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((s, l) => s + l, 0) / period;

    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi.push(100 - (100 / (1 + rs)));

    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
  }
}

// ---------------------------------------------------------------------------
// Support/Resistance Breakout Strategy
// ---------------------------------------------------------------------------
export class BreakoutStrategy implements TradingStrategy {
  name = 'Support/Resistance Breakout';
  description = 'Detects breakouts from key support/resistance levels';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      if (data.length < 30) return 'HOLD';

      const closes = data.map((c: any) => parseFloat(c[4]));
      const volumes = data.map((c: any) => parseFloat(c[5]));

      const recentData = data.slice(-20);
      const recentHighs = recentData.map((c: any) => parseFloat(c[2]));
      const recentLows = recentData.map((c: any) => parseFloat(c[3]));
      const maxHigh = Math.max(...recentHighs.slice(0, -1));
      const minLow = Math.min(...recentLows.slice(0, -1));

      const currentClose = closes[closes.length - 1];
      const previousClose = closes[closes.length - 2];

      const avgVolume = volumes.slice(-10, -1).reduce((s, v) => s + v, 0) / 9;
      const volumeIncrease = volumes[volumes.length - 1] > avgVolume * 1.3;

      if (previousClose < maxHigh && currentClose > maxHigh && volumeIncrease) return 'BUY';
      if (previousClose > minLow && currentClose < minLow && volumeIncrease) return 'SELL';

      return 'HOLD';
    } catch (error) {
      console.error('Error in Breakout strategy analysis:', error);
      return 'HOLD';
    }
  }
}

// ---------------------------------------------------------------------------
// Profit Taking Strategy
// ---------------------------------------------------------------------------
export class ProfitTakingStrategy implements TradingStrategy {
  name = 'Profit Taking';
  description = 'Implements profit-taking rules based on price movement';

  async analyze(data: any[]): Promise<TradingSignal> {
    try {
      if (data.length < 10) return 'HOLD';

      const closes = data.map((c: any) => parseFloat(c[4]));
      const currentClose = closes[closes.length - 1];

      const roc = ((currentClose / closes[closes.length - 4]) - 1) * 100;

      if (roc > 3 && roc < 5) {
        const previousRoc = ((closes[closes.length - 2] / closes[closes.length - 5]) - 1) * 100;
        if (roc < previousRoc) return 'SELL';
      }

      const lastThreeCloses = closes.slice(-3);
      if (lastThreeCloses[0] < lastThreeCloses[1] && lastThreeCloses[2] < lastThreeCloses[1]) {
        return 'SELL';
      }

      return 'HOLD';
    } catch (error) {
      console.error('Error in Profit Taking strategy analysis:', error);
      return 'HOLD';
    }
  }
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------
export function createDefaultStrategies(): TradingStrategy[] {
  return [
    new SMAStrategy(),
    new RSIStrategy(),
    new MACDStrategy(),
    new VolumeStrategy(),
    new DivergenceStrategy(),
    new BreakoutStrategy(),
    new ProfitTakingStrategy(),
  ];
}
