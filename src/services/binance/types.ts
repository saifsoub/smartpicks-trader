
export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface BalanceInfo {
  available: string;
  total: string;
  usdValue: number;
  rawAsset?: string; // The original asset name from Binance
  isDefault?: boolean; // Flag to indicate if this is default/demo data
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceSymbol {
  symbol: string;
  priceChangePercent: string;
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

export interface AccountInfoResponse {
  balances: BinanceBalance[];
  accountType?: string;
  canTrade?: boolean;
  canDeposit?: boolean;
  canWithdraw?: boolean;
  updateTime?: number;
  isDefault?: boolean; // Flag to indicate if this is default/demo data
  isLimitedAccess?: boolean; // Flag to indicate limited API access permissions
}
