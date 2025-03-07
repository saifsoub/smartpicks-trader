
export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface BalanceInfo {
  available: string;
  total: string;
  usdValue?: number;
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';
export type LogType = 'info' | 'success' | 'error' | 'warning';

export interface TradingLog {
  timestamp: Date;
  message: string;
  type: LogType;
}

export interface ApiPermissions {
  read: boolean;
  trading: boolean;
}
