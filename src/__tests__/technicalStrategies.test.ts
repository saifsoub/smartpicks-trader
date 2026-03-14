/**
 * Unit tests for technical trading strategies.
 * These tests validate that each strategy returns a valid signal
 * ('BUY' | 'SELL' | 'HOLD') and behaves correctly under known conditions.
 */
import { describe, it, expect } from 'vitest';
import {
  SMAStrategy,
  RSIStrategy,
  MACDStrategy,
  VolumeStrategy,
  BreakoutStrategy,
  ProfitTakingStrategy,
} from '../services/trading/strategies/technicalStrategies';

// ---------------------------------------------------------------------------
// Helpers to generate synthetic candle data
// Each candle is [timestamp, open, high, low, close, volume]
// ---------------------------------------------------------------------------
function makeCandle(close: number, high?: number, low?: number, volume?: number): string[] {
  return [
    '0',
    String(close),
    String(high ?? close * 1.01),
    String(low ?? close * 0.99),
    String(close),
    String(volume ?? 1000),
  ];
}

/** Create n candles with a linearly increasing close price */
function trendingUp(n: number, start = 100, step = 1): string[][] {
  return Array.from({ length: n }, (_, i) => makeCandle(start + i * step));
}

/** Create n candles with a linearly decreasing close price */
function trendingDown(n: number, start = 200, step = 1): string[][] {
  return Array.from({ length: n }, (_, i) => makeCandle(start - i * step));
}

/** Create n flat candles */
function flat(n: number, price = 100): string[][] {
  return Array.from({ length: n }, () => makeCandle(price));
}

// ---------------------------------------------------------------------------
// SMAStrategy
// ---------------------------------------------------------------------------
describe('SMAStrategy', () => {
  const strategy = new SMAStrategy();

  it('returns HOLD with insufficient data', async () => {
    const signal = await strategy.analyze(flat(2));
    expect(signal).toBe('HOLD');
  });

  it('returns BUY on a strong uptrend', async () => {
    const signal = await strategy.analyze(trendingUp(20));
    expect(signal).toBe('BUY');
  });

  it('returns SELL on a strong downtrend', async () => {
    const signal = await strategy.analyze(trendingDown(20));
    expect(signal).toBe('SELL');
  });

  it('calculateSMA returns correct values', () => {
    const data = [10, 20, 30, 40, 50].map(n => makeCandle(n));
    const sma = strategy.calculateSMA(data, 3);
    expect(sma[0]).toBeCloseTo(20); // (10+20+30)/3
    expect(sma[1]).toBeCloseTo(30); // (20+30+40)/3
    expect(sma[2]).toBeCloseTo(40); // (30+40+50)/3
  });
});

// ---------------------------------------------------------------------------
// RSIStrategy
// ---------------------------------------------------------------------------
describe('RSIStrategy', () => {
  const strategy = new RSIStrategy();

  it('returns HOLD with insufficient data', async () => {
    const signal = await strategy.analyze(flat(5));
    expect(signal).toBe('HOLD');
  });

  it('returns a valid signal on sufficient data', async () => {
    const signal = await strategy.analyze(trendingUp(30));
    expect(['BUY', 'SELL', 'HOLD']).toContain(signal);
  });

  it('calculateRSI with all gains produces RSI near 100', () => {
    const data = trendingUp(20, 100, 5);
    const rsi = strategy.calculateRSI(data, 8);
    const last = rsi[rsi.length - 1];
    expect(last).toBeGreaterThan(70); // strong uptrend → overbought
  });

  it('calculateRSI with all losses produces RSI near 0', () => {
    const data = trendingDown(20, 200, 5);
    const rsi = strategy.calculateRSI(data, 8);
    const last = rsi[rsi.length - 1];
    expect(last).toBeLessThan(30); // strong downtrend → oversold
  });
});

// ---------------------------------------------------------------------------
// MACDStrategy
// ---------------------------------------------------------------------------
describe('MACDStrategy', () => {
  const strategy = new MACDStrategy();

  it('returns HOLD with insufficient data', async () => {
    const signal = await strategy.analyze(flat(5));
    expect(signal).toBe('HOLD');
  });

  it('returns a valid signal on a long uptrend', async () => {
    const signal = await strategy.analyze(trendingUp(50));
    expect(['BUY', 'SELL', 'HOLD']).toContain(signal);
  });
});

// ---------------------------------------------------------------------------
// VolumeStrategy
// ---------------------------------------------------------------------------
describe('VolumeStrategy', () => {
  const strategy = new VolumeStrategy();

  it('returns HOLD with fewer than 10 candles', async () => {
    const signal = await strategy.analyze(flat(5));
    expect(signal).toBe('HOLD');
  });

  it('returns BUY on volume spike with price up', async () => {
    // 10 candles: 8 normal then 1 huge-volume bullish candle
    const data: string[][] = Array.from({ length: 9 }, () => makeCandle(100, 101, 99, 100));
    // Last candle: price jumps 1%, volume 3x
    data.push(['0', '100', '101.5', '99', '101', '300']);
    const signal = await strategy.analyze(data);
    expect(signal).toBe('BUY');
  });
});

// ---------------------------------------------------------------------------
// BreakoutStrategy
// ---------------------------------------------------------------------------
describe('BreakoutStrategy', () => {
  const strategy = new BreakoutStrategy();

  it('returns HOLD with insufficient data', async () => {
    const signal = await strategy.analyze(flat(10));
    expect(signal).toBe('HOLD');
  });

  it('returns a valid signal on 35 candles', async () => {
    const signal = await strategy.analyze(trendingUp(35));
    expect(['BUY', 'SELL', 'HOLD']).toContain(signal);
  });
});

// ---------------------------------------------------------------------------
// ProfitTakingStrategy
// ---------------------------------------------------------------------------
describe('ProfitTakingStrategy', () => {
  const strategy = new ProfitTakingStrategy();

  it('returns HOLD with insufficient data', async () => {
    const signal = await strategy.analyze(flat(5));
    expect(signal).toBe('HOLD');
  });

  it('returns a valid signal on 15 candles', async () => {
    const signal = await strategy.analyze(trendingUp(15));
    expect(['BUY', 'SELL', 'HOLD']).toContain(signal);
  });
});
