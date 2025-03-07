
/**
 * Advanced technical indicators for market analysis
 */

// Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  
  ema.push(sum / period);
  
  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

// Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Need at least 'period + 1' data points to calculate first RSI
  if (prices.length <= period + 1) {
    return rsi;
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Calculate first RSI
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
  rsi.push(100 - (100 / (1 + rs)));
  
  // Calculate remaining RSIs using Wilder's smoothing method
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macdLine: number[],
  signalLine: number[],
  histogram: number[]
} {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // MACD Line = Fast EMA - Slow EMA
  const macdLine: number[] = [];
  for (let i = 0; i < fastEMA.length; i++) {
    if (i >= slowEMA.length - fastEMA.length) {
      const slowIndex = slowEMA.length - fastEMA.length + i;
      macdLine.push(fastEMA[i] - slowEMA[slowIndex]);
    }
  }
  
  // Signal Line = 9-day EMA of MACD Line
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // MACD Histogram = MACD Line - Signal Line
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = macdLine.length - signalLine.length + i;
    histogram.push(macdLine[macdIndex] - signalLine[i]);
  }
  
  return { macdLine, signalLine, histogram };
}

// Bollinger Bands
export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): {
  upper: number[],
  middle: number[],
  lower: number[]
} {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - (period - 1), i + 1);
    
    // Calculate SMA (middle band)
    const sma = slice.reduce((sum, price) => sum + price, 0) / period;
    middle.push(sma);
    
    // Calculate standard deviation
    const squaredDifferences = slice.map(price => Math.pow(price - sma, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    // Calculate upper and lower bands
    upper.push(sma + (multiplier * stdDev));
    lower.push(sma - (multiplier * stdDev));
  }
  
  return { upper, middle, lower };
}

// Average True Range (ATR) - Volatility indicator
export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const trueRanges: number[] = [];
  const atr: number[] = [];
  
  // Calculate True Ranges
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i]; // Current high - current low
    const tr2 = Math.abs(highs[i] - closes[i - 1]); // Current high - previous close
    const tr3 = Math.abs(lows[i] - closes[i - 1]); // Current low - previous close
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // First ATR is simple average of first 'period' true ranges
  if (trueRanges.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += trueRanges[i];
    }
    atr.push(sum / period);
    
    // Remaining ATRs use smoothing formula
    for (let i = period; i < trueRanges.length; i++) {
      const currentATR = ((atr[atr.length - 1] * (period - 1)) + trueRanges[i]) / period;
      atr.push(currentATR);
    }
  }
  
  return atr;
}

// Stochastic Oscillator
export function calculateStochastic(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  kPeriod = 14, 
  dPeriod = 3
): { k: number[], d: number[] } {
  const k: number[] = [];
  
  // Calculate %K values
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highsSlice = highs.slice(i - (kPeriod - 1), i + 1);
    const lowsSlice = lows.slice(i - (kPeriod - 1), i + 1);
    const highestHigh = Math.max(...highsSlice);
    const lowestLow = Math.min(...lowsSlice);
    
    if (highestHigh === lowestLow) {
      k.push(100); // If range is zero, use 100
    } else {
      const kValue = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      k.push(kValue);
    }
  }
  
  // Calculate %D values (3-period SMA of %K)
  const d: number[] = [];
  for (let i = dPeriod - 1; i < k.length; i++) {
    const sum = k.slice(i - (dPeriod - 1), i + 1).reduce((total, val) => total + val, 0);
    d.push(sum / dPeriod);
  }
  
  return { k, d };
}

// Ichimoku Cloud components
export function calculateIchimokuCloud(
  highs: number[],
  lows: number[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
  displacement = 26
): {
  tenkanSen: number[],
  kijunSen: number[],
  senkouSpanA: number[],
  senkouSpanB: number[],
  chikouSpan: number[]
} {
  const tenkanSen: number[] = [];
  const kijunSen: number[] = [];
  const senkouSpanA: number[] = [];
  const senkouSpanB: number[] = [];
  const chikouSpan: number[] = [...Array(displacement).fill(NaN), ...highs]; // Displaced highs
  
  // Calculate Tenkan-sen (Conversion Line): (highest high + lowest low) / 2 for tenkanPeriod
  for (let i = tenkanPeriod - 1; i < highs.length; i++) {
    const highsSlice = highs.slice(i - (tenkanPeriod - 1), i + 1);
    const lowsSlice = lows.slice(i - (tenkanPeriod - 1), i + 1);
    tenkanSen.push((Math.max(...highsSlice) + Math.min(...lowsSlice)) / 2);
  }
  
  // Calculate Kijun-sen (Base Line): (highest high + lowest low) / 2 for kijunPeriod
  for (let i = kijunPeriod - 1; i < highs.length; i++) {
    const highsSlice = highs.slice(i - (kijunPeriod - 1), i + 1);
    const lowsSlice = lows.slice(i - (kijunPeriod - 1), i + 1);
    kijunSen.push((Math.max(...highsSlice) + Math.min(...lowsSlice)) / 2);
  }
  
  // Calculate Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2 displaced forward
  for (let i = 0; i < tenkanSen.length && i < kijunSen.length; i++) {
    senkouSpanA.push((tenkanSen[i] + kijunSen[i]) / 2);
  }
  
  // Calculate Senkou Span B (Leading Span B): (highest high + lowest low) / 2 for senkouBPeriod displaced forward
  for (let i = senkouBPeriod - 1; i < highs.length; i++) {
    const highsSlice = highs.slice(i - (senkouBPeriod - 1), i + 1);
    const lowsSlice = lows.slice(i - (senkouBPeriod - 1), i + 1);
    senkouSpanB.push((Math.max(...highsSlice) + Math.min(...lowsSlice)) / 2);
  }
  
  return {
    tenkanSen,
    kijunSen,
    senkouSpanA,
    senkouSpanB,
    chikouSpan
  };
}

// Detect significant support and resistance levels
export function findSupportResistanceLevels(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
  threshold = 0.02
): { supports: number[], resistances: number[] } {
  const supports: number[] = [];
  const resistances: number[] = [];
  
  // Detect local minima (potential supports)
  for (let i = period; i < lows.length - period; i++) {
    const leftSlice = lows.slice(i - period, i);
    const rightSlice = lows.slice(i + 1, i + period + 1);
    const currentLow = lows[i];
    
    if (leftSlice.every(val => val > currentLow) && rightSlice.every(val => val > currentLow)) {
      // Found a local minimum
      supports.push(currentLow);
    }
  }
  
  // Detect local maxima (potential resistances)
  for (let i = period; i < highs.length - period; i++) {
    const leftSlice = highs.slice(i - period, i);
    const rightSlice = highs.slice(i + 1, i + period + 1);
    const currentHigh = highs[i];
    
    if (leftSlice.every(val => val < currentHigh) && rightSlice.every(val => val < currentHigh)) {
      // Found a local maximum
      resistances.push(currentHigh);
    }
  }
  
  // Cluster similar levels
  const clusteredSupports = clusterPriceLevels(supports, threshold);
  const clusteredResistances = clusterPriceLevels(resistances, threshold);
  
  return { 
    supports: clusteredSupports, 
    resistances: clusteredResistances 
  };
}

// Helper function to cluster similar price levels
function clusterPriceLevels(levels: number[], threshold: number): number[] {
  if (levels.length === 0) return [];
  
  // Sort levels
  levels.sort((a, b) => a - b);
  
  const clusters: number[][] = [];
  let currentCluster: number[] = [levels[0]];
  
  for (let i = 1; i < levels.length; i++) {
    const prevLevel = levels[i - 1];
    const currentLevel = levels[i];
    
    // If current level is within threshold of previous level, add to current cluster
    if ((currentLevel - prevLevel) / prevLevel <= threshold) {
      currentCluster.push(currentLevel);
    } else {
      // Start a new cluster
      clusters.push(currentCluster);
      currentCluster = [currentLevel];
    }
  }
  
  // Add the last cluster
  clusters.push(currentCluster);
  
  // Calculate average level for each cluster
  return clusters.map(cluster => 
    cluster.reduce((sum, level) => sum + level, 0) / cluster.length
  );
}

// Detect market trend using multiple indicators
export function detectMarketTrend(
  closes: number[],
  shortTermPeriod = 10,
  mediumTermPeriod = 20,
  longTermPeriod = 50
): 'strong_uptrend' | 'uptrend' | 'neutral' | 'downtrend' | 'strong_downtrend' {
  if (closes.length < longTermPeriod) {
    return 'neutral'; // Not enough data
  }
  
  // Calculate EMAs for different timeframes
  const shortTermEMA = calculateEMA(closes, shortTermPeriod);
  const mediumTermEMA = calculateEMA(closes, mediumTermPeriod);
  const longTermEMA = calculateEMA(closes, longTermPeriod);
  
  // Get most recent values
  const lastShortEMA = shortTermEMA[shortTermEMA.length - 1];
  const lastMediumEMA = mediumTermEMA[mediumTermEMA.length - 1];
  const lastLongEMA = longTermEMA[longTermEMA.length - 1];
  
  // Calculate RSI to confirm trend
  const rsi = calculateRSI(closes, 14);
  const lastRSI = rsi[rsi.length - 1];
  
  // Check EMA alignment for trend determination
  if (lastShortEMA > lastMediumEMA && lastMediumEMA > lastLongEMA) {
    // Possible uptrend - confirm with RSI
    return lastRSI > 50 ? 'strong_uptrend' : 'uptrend';
  } else if (lastShortEMA < lastMediumEMA && lastMediumEMA < lastLongEMA) {
    // Possible downtrend - confirm with RSI
    return lastRSI < 50 ? 'strong_downtrend' : 'downtrend';
  } else {
    // EMAs are mixed - likely ranging/neutral market
    return 'neutral';
  }
}
