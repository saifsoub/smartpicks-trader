
import { BinanceApiClient } from './apiClient';
import { BinanceSymbol } from './types';
import { LogManager } from './logManager';

export class MarketDataService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
  }
  
  public async getSymbols(): Promise<BinanceSymbol[]> {
    try {
      console.log("Fetching 24hr ticker information");
      const response = await this.apiClient.fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      return data.map((item: any) => ({
        symbol: item.symbol,
        priceChangePercent: item.priceChangePercent
      }));
    } catch (error) {
      console.error('Error fetching symbols:', error);
      throw new Error('Could not fetch market symbols. Please try again later.');
    }
  }

  public async getRecentTrades(symbol: string): Promise<any[]> {
    try {
      console.log(`Fetching recent trades for ${symbol}`);
      const response = await this.apiClient.fetchWithRetry(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=10`);
      const trades = await response.json();
      
      return trades.map((trade: any) => ({
        ...trade,
        symbol: symbol
      }));
    } catch (error) {
      console.error(`Error fetching recent trades for ${symbol}:`, error);
      throw new Error(`Could not fetch recent trades for ${symbol}. Please try again later.`);
    }
  }

  public async getPrices(): Promise<Record<string, string>> {
    try {
      console.log("Fetching current prices");
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');
      
      if (!response.ok) {
        throw new Error(`Error fetching prices: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const priceMap: Record<string, string> = {};
      for (const item of data) {
        priceMap[item.symbol] = item.price;
      }
      
      console.log("Fetched prices for", Object.keys(priceMap).length, "symbols");
      return priceMap;
    } catch (error) {
      console.error('Error fetching prices:', error);
      this.logManager.addTradingLog("Failed to fetch current prices", 'error');
      throw new Error('Could not fetch current market prices. Please try again later.');
    }
  }

  public async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      console.log(`Fetching klines for ${symbol} (${interval})`);
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching klines:', error);
      this.logManager.addTradingLog(`Failed to fetch klines for ${symbol}`, 'error');
      throw new Error(`Could not fetch chart data for ${symbol}. Please try again later.`);
    }
  }
}
