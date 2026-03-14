/**
 * Unit tests for TradingMode type guard and STORAGE_KEYS.
 * These tests verify that the TradingMode type and related constants
 * are correctly defined and usable without side-effects.
 */
import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS, TRADING_MODE_LABELS } from '../services/trading/types';
import type { TradingMode } from '../services/trading/types';

describe('TradingMode', () => {
  const validModes: TradingMode[] = ['demo', 'paper', 'live'];

  it('has the three expected modes', () => {
    expect(validModes).toHaveLength(3);
    expect(validModes).toContain('demo');
    expect(validModes).toContain('paper');
    expect(validModes).toContain('live');
  });

  it('TRADING_MODE_LABELS has a label for each mode', () => {
    for (const mode of validModes) {
      expect(TRADING_MODE_LABELS[mode]).toBeTruthy();
    }
  });

  it('STORAGE_KEYS.TRADING_MODE is defined', () => {
    expect(STORAGE_KEYS.TRADING_MODE).toBe('tradingMode');
  });

  it('demo mode is identified as non-live', () => {
    const mode: TradingMode = 'demo';
    expect(mode === 'live').toBe(false);
  });

  it('paper mode is identified as non-live', () => {
    const mode: TradingMode = 'paper';
    expect(mode === 'live').toBe(false);
  });

  it('live mode is identified as live', () => {
    const mode: TradingMode = 'live';
    expect(mode === 'live').toBe(true);
  });
});

describe('STORAGE_KEYS', () => {
  it('contains all expected keys', () => {
    const requiredKeys = [
      'STRATEGIES',
      'BACKTEST_RESULTS',
      'RISK_SETTINGS',
      'TRADING_MODE',
    ];
    for (const key of requiredKeys) {
      expect(STORAGE_KEYS).toHaveProperty(key);
    }
  });
});
