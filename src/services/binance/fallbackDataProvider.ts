
import { BinanceBalance, MockAccountInfo } from './types';

export class FallbackDataProvider {
  private static readonly DEFAULT_ASSETS = [
    { asset: 'BTC', free: '0.01', locked: '0' },
    { asset: 'ETH', free: '0.5', locked: '0' },
    { asset: 'USDT', free: '1000', locked: '0' },
    { asset: 'BNB', free: '5', locked: '0' },
    { asset: 'ADA', free: '500', locked: '0' },
    { asset: 'DOT', free: '50', locked: '0' },
    { asset: 'SOL', free: '20', locked: '0' },
  ];
  
  /**
   * Provides mock account data when the API fails to return real data
   */
  public static getMockAccountInfo(): MockAccountInfo {
    return {
      isDefault: true,
      balances: this.DEFAULT_ASSETS.map(asset => ({
        asset: asset.asset,
        free: asset.free,
        locked: asset.locked
      }))
    };
  }
  
  /**
   * Returns formatted balances to display when there's an error fetching real data
   */
  public static getSafeBalances(): BinanceBalance[] {
    return this.DEFAULT_ASSETS;
  }
  
  /**
   * Checks if an array of balances appears to be valid
   */
  public static isValidBalanceArray(balances: any[]): boolean {
    if (!Array.isArray(balances) || balances.length === 0) {
      return false;
    }
    
    // Check if first few items have the expected structure
    for (let i = 0; i < Math.min(balances.length, 3); i++) {
      const balance = balances[i];
      if (!balance || typeof balance !== 'object') return false;
      if (!('asset' in balance) || !('free' in balance) || !('locked' in balance)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Returns mockprices for common trading pairs when the API fails
   */
  public static getMockPrices(): Record<string, string> {
    return {
      'BTCUSDT': '56000.00',
      'ETHUSDT': '3200.00',
      'BNBUSDT': '500.00',
      'ADAUSDT': '1.20',
      'DOTUSDT': '20.00',
      'SOLUSDT': '150.00',
      'XRPUSDT': '0.75',
      'DOGEUSDT': '0.12',
      'LTCUSDT': '120.00',
      'UNIUSDT': '10.00'
    };
  }
  
  /**
   * Returns default trading pairs to use when user's actual pairs cannot be determined
   */
  public static getDefaultTradingPairs(): string[] {
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
  }
}
