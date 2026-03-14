/**
 * Unit tests for the trading-log CSV export helpers.
 * These are pure-function tests and require no DOM or browser APIs.
 */
import { describe, it, expect } from 'vitest';
import { logsToCSV, escapeCsvField } from '../lib/exportLogs';
import type { TradingLog } from '../services/binance/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeLog(message: string, type: TradingLog['type'] = 'info', offsetMs = 0): TradingLog {
  return {
    timestamp: new Date(1_700_000_000_000 + offsetMs),
    message,
    type,
  };
}

// ---------------------------------------------------------------------------
// escapeCsvField
// ---------------------------------------------------------------------------
describe('escapeCsvField', () => {
  it('returns plain strings unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('BUY BTCUSDT')).toBe('BUY BTCUSDT');
  });

  it('wraps strings that contain a comma in double-quotes', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('wraps strings that contain a double-quote and escapes it', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps strings that contain newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles an empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// logsToCSV
// ---------------------------------------------------------------------------
describe('logsToCSV', () => {
  it('returns only the header row for an empty log array', () => {
    const csv = logsToCSV([]);
    expect(csv).toBe('Timestamp,Type,Message');
  });

  it('produces the correct number of lines (header + one per log)', () => {
    const logs = [makeLog('trade A'), makeLog('trade B'), makeLog('trade C')];
    const lines = logsToCSV(logs).split('\r\n');
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
  });

  it('includes the correct header columns', () => {
    const [header] = logsToCSV([]).split('\r\n');
    expect(header).toBe('Timestamp,Type,Message');
  });

  it('formats timestamp as ISO 8601', () => {
    const log = makeLog('test');
    const [, dataRow] = logsToCSV([log]).split('\r\n');
    expect(dataRow.startsWith(log.timestamp.toISOString())).toBe(true);
  });

  it('includes the log type in the second column', () => {
    const log = makeLog('test', 'success');
    const [, dataRow] = logsToCSV([log]).split('\r\n');
    const parts = dataRow.split(',');
    expect(parts[1]).toBe('success');
  });

  it('includes the message in the third column', () => {
    const log = makeLog('simple message');
    const [, dataRow] = logsToCSV([log]).split('\r\n');
    const parts = dataRow.split(',');
    expect(parts[2]).toBe('simple message');
  });

  it('quotes messages that contain commas', () => {
    const log = makeLog('bought BTC, ETH');
    const [, dataRow] = logsToCSV([log]).split('\r\n');
    expect(dataRow).toContain('"bought BTC, ETH"');
  });

  it('handles all log types', () => {
    const types: TradingLog['type'][] = ['info', 'success', 'warning', 'error'];
    const logs = types.map(t => makeLog(`msg-${t}`, t));
    const lines = logsToCSV(logs).split('\r\n');
    // Verify each type appears in the output
    types.forEach((t, i) => {
      expect(lines[i + 1]).toContain(t);
    });
  });

  it('handles multiple logs correctly preserving order', () => {
    const logs = [
      makeLog('first', 'info', 0),
      makeLog('second', 'success', 1000),
      makeLog('third', 'error', 2000),
    ];
    const lines = logsToCSV(logs).split('\r\n');
    expect(lines[1]).toContain('first');
    expect(lines[2]).toContain('second');
    expect(lines[3]).toContain('third');
  });
});
