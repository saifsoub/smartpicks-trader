
import { TradingLog, LogType } from './types';

export class LogManager {
  private tradingLogs: TradingLog[] = [];
  
  public getTradingLogs(): TradingLog[] {
    return [...this.tradingLogs];
  }

  public clearTradingLogs(): void {
    this.tradingLogs = [];
  }

  public addTradingLog(message: string, type: LogType = 'info'): void {
    this.tradingLogs.unshift({ timestamp: new Date(), message, type });
    if (this.tradingLogs.length > 100) {
      this.tradingLogs.pop();
    }
  }
}
