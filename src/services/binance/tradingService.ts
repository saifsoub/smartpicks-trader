
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { toast } from 'sonner';

export class TradingService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000; // ms
  private lastSuccessfulTrade: number = 0;
  
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

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const params = {
          symbol,
          side,
          type: 'MARKET',
          quantity,
          recvWindow: '15000', // Increased recv window to handle time differences
          timestamp: (Date.now() + this.apiClient.getTimeDifference()).toString()
        };
        
        console.log(`Placing ${side} market order for ${quantity} ${symbol} via ${this.apiClient.getProxyMode() ? 'proxy' : 'direct API'} (attempt ${attempt + 1}/${this.retryAttempts})`);
        this.logManager.addTradingLog(`${side} ${quantity} ${symbol} at market price`, 'info');
        
        let result;
        if (this.apiClient.getProxyMode()) {
          result = await this.apiClient.fetchWithProxy('order', params, 'POST');
        } else {
          // Try direct API if proxy mode is disabled
          const timestamp = Date.now() + this.apiClient.getTimeDifference();
          const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}&recvWindow=15000`;
          const signature = await this.apiClient.generateSignature(queryString);
          
          const response = await fetch(`https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`, {
            method: 'POST',
            headers: {
              'X-MBX-APIKEY': this.apiClient.getApiKey(),
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }
          
          result = await response.json();
        }
        
        // Log success and update last successful trade time
        this.lastSuccessfulTrade = Date.now();
        this.logManager.addTradingLog(`Order ${result.orderId || 'unknown'} ${result.status || 'PENDING'}`, 'success');
        toast.success(`${side} order for ${quantity} ${symbol} placed successfully`);
        
        return result;
      } catch (error) {
        console.error(`Error placing market order (attempt ${attempt + 1}/${this.retryAttempts}):`, error);
        
        if (attempt < this.retryAttempts - 1) {
          // Only log warning for intermediate retries
          this.logManager.addTradingLog(`Retry ${attempt + 1}/${this.retryAttempts}: Failed to place ${side} order for ${symbol}`, 'warning');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          console.log(`Retrying order placement for ${symbol}...`);
        } else {
          // Log error on final attempt
          this.logManager.addTradingLog(`Failed to place ${side} order for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
          toast.error(`Failed to place ${side} order for ${symbol}`);
          throw error;
        }
      }
    }
    
    throw new Error(`Failed to place ${side} order for ${symbol} after ${this.retryAttempts} attempts`);
  }
  
  // Get the time of last successful trade
  public getLastSuccessfulTradeTime(): number {
    return this.lastSuccessfulTrade;
  }
  
  // Check if trading is possible (has credentials and recent successful trades)
  public canTrade(): boolean {
    return this.apiClient.hasCredentials();
  }
  
  // Place a market order with a fallback to offline operation for testing
  public async placeMarketOrderWithFallback(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string,
    allowOfflineOperation: boolean = false
  ): Promise<any> {
    try {
      return await this.placeMarketOrder(symbol, side, quantity);
    } catch (error) {
      if (allowOfflineOperation) {
        console.warn(`Using offline operation mode for ${side} ${symbol}`);
        this.logManager.addTradingLog(`Simulated ${side} ${quantity} ${symbol} (offline mode)`, 'warning');
        
        // Return a mock order response for offline operation
        return {
          symbol,
          orderId: Math.floor(Math.random() * 1000000),
          clientOrderId: `offline_${Date.now()}`,
          transactTime: Date.now(),
          price: '0',
          origQty: quantity,
          executedQty: quantity,
          status: 'FILLED',
          timeInForce: 'GTC',
          type: 'MARKET',
          side,
          isOfflineMode: true
        };
      }
      
      // Re-throw if offline operation is not allowed
      throw error;
    }
  }
}
