/**
 * Utility functions for exporting trading activity logs.
 *
 * Kept as pure functions (no DOM/browser side-effects) so they can be
 * unit-tested in a Node.js / Vitest environment without a browser.
 */
import type { TradingLog } from '@/services/binance/types';

/**
 * Convert an array of TradingLog entries into a CSV string.
 *
 * Columns: Timestamp, Type, Message
 * Values that contain commas or double-quotes are properly escaped per RFC 4180.
 */
export function logsToCSV(logs: TradingLog[]): string {
  const header = 'Timestamp,Type,Message';
  const rows = logs.map(log => {
    const ts = log.timestamp instanceof Date
      ? log.timestamp.toISOString()
      : String(log.timestamp);
    return [ts, log.type, log.message].map(escapeCsvField).join(',');
  });
  return [header, ...rows].join('\r\n');
}

/**
 * Escape a single CSV field value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Trigger a browser file download for the given text content.
 * This function is intentionally separated from `logsToCSV` so tests can
 * cover the CSV generation without needing a DOM.
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
