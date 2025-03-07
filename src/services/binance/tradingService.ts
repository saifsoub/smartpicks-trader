
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';

export class TradingService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    if (!this.apiClient.hasCredentials()) {
      throw new Error('API credentials not configured');
    }

    try {
      const params = {
        symbol,
        side,
        type: 'MARKET',
        quantity
      };
      
      console.log(`Placing ${side} market order for ${quantity} ${symbol} via proxy`);
      this.logManager.addTradingLog(`${side} ${quantity} ${symbol} at market price`, 'info');
      
      const result = await this.apiClient.fetchWithProxy('order', params, 'POST');
      this.logManager.addTradingLog(`Order ${result.orderId || 'unknown'} ${result.status || 'PENDING'}`, 'success');
      return result;
    } catch (error) {
      console.error('Error placing market order:', error);
      this.logManager.addTradingLog(`Failed to place ${side} order for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }
}
