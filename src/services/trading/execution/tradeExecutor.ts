
import binanceService from '../../binanceService';
import { calculateATR } from '../indicators/technicalIndicators';
import { TradingEventEmitter } from '../tradingEventEmitter';
import notificationService from '../../notificationService';
import { toast } from 'sonner';

// Position interface for tracking active trades
interface Position {
  symbol: string;
  entryPrice: number;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStop: number | null;
  entryTime: number;
  side: 'long' | 'short';
}

interface RiskParameters {
  maxPositionSize: number; // As percentage of portfolio
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxDailyLoss: number; // As percentage of portfolio
  maxOpenPositions: number;
  trailingStopEnabled: boolean;
  trailingStopPercentage?: number;
  dynamicPositionSizing: boolean;
  riskPerTrade: number; // Percentage of portfolio to risk per trade
}

export class TradeExecutor {
  private positions: Map<string, Position> = new Map();
  private eventEmitter: TradingEventEmitter;
  private dailyPnL: number = 0;
  private dailyStartBalance: number = 0;
  private lastBalanceCheck: number = 0;
  private isTestMode: boolean = false;
  private riskParameters: RiskParameters;
  
  constructor(eventEmitter: TradingEventEmitter, isTestMode: boolean = false) {
    this.eventEmitter = eventEmitter;
    this.isTestMode = isTestMode;
    
    // Default risk parameters
    this.riskParameters = {
      maxPositionSize: 5, // 5% max per position
      stopLossPercentage: 2, 
      takeProfitPercentage: 4,
      maxDailyLoss: 5, // Stop trading if 5% daily loss
      maxOpenPositions: 3,
      trailingStopEnabled: true,
      trailingStopPercentage: 1.5,
      dynamicPositionSizing: true,
      riskPerTrade: 1 // Risk 1% of portfolio per trade
    };
    
    // Initialize daily P&L tracking
    this.resetDailyMetrics();
    
    // Set up a daily reset for P&L tracking
    setInterval(() => this.resetDailyMetrics(), 24 * 60 * 60 * 1000);
  }
  
  // Reset daily metrics (called daily or on startup)
  private async resetDailyMetrics(): Promise<void> {
    try {
      this.dailyPnL = 0;
      this.lastBalanceCheck = Date.now();
      
      // Get current portfolio value for daily tracking
      const account = await binanceService.getAccountBalance();
      this.dailyStartBalance = Object.values(account).reduce(
        (total, asset) => total + (asset.usdValue || 0), 
        0
      );
      
      console.log(`Daily metrics reset. Starting balance: $${this.dailyStartBalance.toFixed(2)}`);
    } catch (error) {
      console.error('Error resetting daily metrics:', error);
    }
  }
  
  // Set custom risk parameters
  public setRiskParameters(params: Partial<RiskParameters>): void {
    this.riskParameters = { ...this.riskParameters, ...params };
    console.log('Risk parameters updated:', this.riskParameters);
  }
  
  // Get current risk parameters
  public getRiskParameters(): RiskParameters {
    return { ...this.riskParameters };
  }
  
  // Get all active positions
  public getPositions(): Position[] {
    return Array.from(this.positions.values());
  }
  
  // Check if we have reached daily loss limit
  private async checkDailyLossLimit(): Promise<boolean> {
    try {
      const account = await binanceService.getAccountBalance();
      const currentBalance = Object.values(account).reduce(
        (total, asset) => total + (asset.usdValue || 0), 
        0
      );
      
      const dailyChange = ((currentBalance - this.dailyStartBalance) / this.dailyStartBalance) * 100;
      this.dailyPnL = dailyChange;
      
      // Check if we've hit the daily loss limit
      if (dailyChange < -this.riskParameters.maxDailyLoss) {
        console.log(`Daily loss limit reached: ${dailyChange.toFixed(2)}% vs limit of -${this.riskParameters.maxDailyLoss}%`);
        
        this.eventEmitter.emit({
          event: 'daily_loss_limit_hit',
          time: Date.now()
        });
        
        toast.error(`Daily loss limit reached (${dailyChange.toFixed(2)}%). Trading paused.`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking daily loss limit:', error);
      return false;
    }
  }
  
  // Calculate optimal position size based on risk parameters and market volatility
  private async calculatePositionSize(
    symbol: string,
    entryPrice: number,
    stopLossPrice: number
  ): Promise<number> {
    try {
      // Get account balance
      const account = await binanceService.getAccountBalance();
      const totalUsdBalance = Object.values(account).reduce(
        (total, asset) => total + (asset.usdValue || 0), 
        0
      );
      
      // Calculate maximum position size based on maxPositionSize parameter
      const maxPositionUsd = totalUsdBalance * (this.riskParameters.maxPositionSize / 100);
      
      // If not using dynamic sizing, just use max position size
      if (!this.riskParameters.dynamicPositionSizing) {
        const quantity = maxPositionUsd / entryPrice;
        return quantity;
      }
      
      // Calculate risk amount based on riskPerTrade
      const riskAmount = totalUsdBalance * (this.riskParameters.riskPerTrade / 100);
      
      // Calculate risk per share
      const riskPerShare = Math.abs(entryPrice - stopLossPrice);
      
      if (riskPerShare === 0) {
        return maxPositionUsd / entryPrice; // Fallback if stop loss is same as entry
      }
      
      // Calculate position size based on risk
      const positionSize = riskAmount / riskPerShare;
      const positionUsd = positionSize * entryPrice;
      
      // Ensure position size doesn't exceed maximum
      if (positionUsd > maxPositionUsd) {
        return maxPositionUsd / entryPrice;
      }
      
      return positionSize;
    } catch (error) {
      console.error('Error calculating position size:', error);
      // Return a very small default size on error
      return 0.0001;
    }
  }
  
  // Execute a buy/long order
  public async executeBuy(
    symbol: string, 
    currentPrice: number,
    high?: number,
    low?: number,
    close?: number
  ): Promise<boolean> {
    try {
      // Check if we've reached daily loss limit
      const hitLossLimit = await this.checkDailyLossLimit();
      if (hitLossLimit) {
        console.log(`Skipping buy for ${symbol} due to daily loss limit`);
        return false;
      }
      
      // Check if we already have a position on this symbol
      if (this.positions.has(symbol)) {
        console.log(`Already have a position for ${symbol}`);
        return false;
      }
      
      // Check if we've reached max positions limit
      if (this.positions.size >= this.riskParameters.maxOpenPositions) {
        console.log(`Max positions limit reached (${this.riskParameters.maxOpenPositions})`);
        return false;
      }
      
      // Calculate stop loss price
      const volatilityAdjustedStop = this.calculateVolatilityAdjustedStopLoss(
        symbol, currentPrice, 'long', high, low, close
      );
      
      // Calculate position size based on risk
      const quantity = await this.calculatePositionSize(
        symbol, 
        currentPrice, 
        volatilityAdjustedStop || currentPrice * (1 - (this.riskParameters.stopLossPercentage / 100))
      );
      
      // Ensure quantity is at least the minimum allowed
      const adjustedQuantity = Math.max(quantity, 0.001); // Example minimum, adjust as needed
      const formattedQuantity = adjustedQuantity.toFixed(6);
      
      console.log(`Executing BUY order for ${symbol} at ${currentPrice}, quantity: ${formattedQuantity}`);
      
      if (!this.isTestMode) {
        await binanceService.placeMarketOrder(symbol, 'BUY', formattedQuantity);
      }
      
      // Calculate take profit level
      const takeProfit = currentPrice * (1 + (this.riskParameters.takeProfitPercentage / 100));
      
      // Create position object
      const position: Position = {
        symbol,
        entryPrice: currentPrice,
        quantity: parseFloat(formattedQuantity),
        stopLoss: volatilityAdjustedStop || currentPrice * (1 - (this.riskParameters.stopLossPercentage / 100)),
        takeProfit: takeProfit,
        trailingStop: this.riskParameters.trailingStopEnabled ? currentPrice * (1 - (this.riskParameters.trailingStopPercentage! / 100)) : null,
        entryTime: Date.now(),
        side: 'long'
      };
      
      // Store position
      this.positions.set(symbol, position);
      
      // Emit event
      this.eventEmitter.emit({
        event: 'trade_executed',
        strategy: 'advanced',
        symbol,
        price: currentPrice.toString(),
        time: Date.now()
      });
      
      // Notify user
      toast.success(`Bought ${symbol} at $${currentPrice.toLocaleString()}`);
      notificationService.addNotification({
        title: 'Trade Executed',
        message: `Bought ${symbol} at $${currentPrice.toLocaleString()}`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error(`Error executing buy for ${symbol}:`, error);
      
      notificationService.addNotification({
        title: 'Trade Execution Error',
        message: `Failed to execute buy order for ${symbol}. ${error instanceof Error ? error.message : ''}`,
        type: 'error'
      });
      
      return false;
    }
  }
  
  // Execute a sell/short order
  public async executeSell(
    symbol: string, 
    currentPrice: number
  ): Promise<boolean> {
    try {
      // Check if we have a position to sell
      const position = this.positions.get(symbol);
      if (!position) {
        console.log(`No position to sell for ${symbol}`);
        return false;
      }
      
      const quantity = position.quantity.toFixed(6);
      console.log(`Executing SELL order for ${symbol} at ${currentPrice}, quantity: ${quantity}`);
      
      if (!this.isTestMode) {
        await binanceService.placeMarketOrder(symbol, 'SELL', quantity);
      }
      
      // Calculate profit/loss
      const priceDiff = currentPrice - position.entryPrice;
      const percentChange = (priceDiff / position.entryPrice) * 100;
      console.log(`Closed position with ${percentChange.toFixed(2)}% ${priceDiff >= 0 ? 'profit' : 'loss'}`);
      
      // Emit event
      this.eventEmitter.emit({
        event: 'trade_executed',
        strategy: 'advanced',
        symbol,
        price: currentPrice.toString(),
        time: Date.now()
      });
      
      // Notify user
      if (priceDiff >= 0) {
        toast.success(`Sold ${symbol} for ${percentChange.toFixed(2)}% profit`);
      } else {
        toast.info(`Sold ${symbol} with ${Math.abs(percentChange).toFixed(2)}% loss`);
      }
      
      // Remove position
      this.positions.delete(symbol);
      
      return true;
    } catch (error) {
      console.error(`Error executing sell for ${symbol}:`, error);
      
      notificationService.addNotification({
        title: 'Trade Execution Error',
        message: `Failed to execute sell order for ${symbol}. ${error instanceof Error ? error.message : ''}`,
        type: 'error'
      });
      
      return false;
    }
  }
  
  // Calculate a stop loss based on market volatility using ATR
  private calculateVolatilityAdjustedStopLoss(
    symbol: string,
    currentPrice: number,
    side: 'long' | 'short',
    high?: number,
    low?: number,
    close?: number
  ): number | null {
    // If we don't have high, low, close data for ATR calculation, use fixed percentage
    if (!high || !low || !close) {
      return side === 'long' 
        ? currentPrice * (1 - (this.riskParameters.stopLossPercentage / 100))
        : currentPrice * (1 + (this.riskParameters.stopLossPercentage / 100));
    }
    
    try {
      // We need historical data for proper ATR, but for simplicity we'll use a placeholder
      // In a real implementation, you'd store and pass historical high/low/close arrays
      const highsArray = Array(14).fill(high);
      const lowsArray = Array(14).fill(low);
      const closesArray = Array(14).fill(close);
      
      // Calculate ATR with just the current candle (simplified)
      const atr = calculateATR(highsArray, lowsArray, closesArray, 14);
      
      if (atr.length === 0) {
        return null;
      }
      
      const latestATR = atr[atr.length - 1];
      
      // Use ATR multiplier for stop loss calculation (common values: 2-3)
      const atrMultiplier = 2.5;
      
      return side === 'long'
        ? currentPrice - (latestATR * atrMultiplier)
        : currentPrice + (latestATR * atrMultiplier);
    } catch (error) {
      console.error('Error calculating volatility-adjusted stop loss:', error);
      return null;
    }
  }
  
  // Update existing positions (check stops, update trailing stops)
  public async updatePositions(latestPrices: Record<string, string>): Promise<void> {
    for (const [symbol, position] of this.positions.entries()) {
      const currentPrice = parseFloat(latestPrices[symbol] || '0');
      
      // Skip if price is not available
      if (currentPrice === 0) continue;
      
      // For long positions
      if (position.side === 'long') {
        // Check take profit
        if (position.takeProfit && currentPrice >= position.takeProfit) {
          console.log(`Take profit triggered for ${symbol} at ${currentPrice}`);
          await this.executeSell(symbol, currentPrice);
          continue;
        }
        
        // Check stop loss
        if (position.stopLoss && currentPrice <= position.stopLoss) {
          console.log(`Stop loss triggered for ${symbol} at ${currentPrice}`);
          await this.executeSell(symbol, currentPrice);
          continue;
        }
        
        // Update trailing stop if enabled and price has moved in our favor
        if (
          this.riskParameters.trailingStopEnabled && 
          position.trailingStop && 
          currentPrice > position.entryPrice
        ) {
          // Calculate new potential trailing stop
          const newTrailingStop = currentPrice * (1 - (this.riskParameters.trailingStopPercentage! / 100));
          
          // Only update if new stop is higher than current stop
          if (newTrailingStop > position.trailingStop) {
            console.log(`Updating trailing stop for ${symbol} from ${position.trailingStop} to ${newTrailingStop}`);
            position.trailingStop = newTrailingStop;
            
            // If trailing stop is now higher than original stop loss, use it instead
            if (!position.stopLoss || newTrailingStop > position.stopLoss) {
              position.stopLoss = newTrailingStop;
            }
          }
        }
      }
      
      // Add handling for short positions if needed
    }
  }
}

export default TradeExecutor;
