
import { RiskManagementSettings } from './types';
import persistenceManager from './persistenceManager';
import { TradingEventEmitter } from './tradingEventEmitter';

class RiskManager {
  private riskSettings: RiskManagementSettings;
  private eventEmitter: TradingEventEmitter;
  
  constructor(eventEmitter: TradingEventEmitter) {
    this.eventEmitter = eventEmitter;
    
    // Load risk settings or use defaults
    const savedSettings = persistenceManager.loadRiskSettings();
    if (savedSettings) {
      this.riskSettings = savedSettings;
    } else {
      this.riskSettings = this.getDefaultRiskSettings();
      this.saveRiskSettings();
    }
    
    // Add extended settings
    this.riskSettings.dynamicPositionSizing = this.riskSettings.dynamicPositionSizing ?? true;
    this.riskSettings.riskPerTrade = this.riskSettings.riskPerTrade ?? 1;
  }
  
  private getDefaultRiskSettings(): RiskManagementSettings {
    return {
      maxPositionSize: 5, // 5% max per position
      stopLossPercentage: 2.5,
      takeProfitPercentage: 5,
      maxDailyLoss: 10,
      maxOpenPositions: 3,
      trailingStopEnabled: true,
      trailingStopPercentage: 1.5,
      dynamicPositionSizing: true,
      riskPerTrade: 1 // 1% of portfolio per trade
    };
  }
  
  private saveRiskSettings(): void {
    persistenceManager.saveRiskSettings(this.riskSettings);
  }
  
  public getRiskSettings(): RiskManagementSettings {
    return {...this.riskSettings};
  }
  
  public updateRiskSettings(settings: Partial<RiskManagementSettings>): void {
    this.riskSettings = { ...this.riskSettings, ...settings };
    this.saveRiskSettings();
    this.eventEmitter.emit({
      event: 'risk_settings_updated'
    });
  }
  
  // Calculate current risk exposure based on open positions
  public calculateCurrentRiskExposure(positionValues: number[], portfolioValue: number): number {
    if (portfolioValue === 0) return 0;
    
    const totalExposure = positionValues.reduce((sum, value) => sum + value, 0);
    return (totalExposure / portfolioValue) * 100;
  }
  
  // Check if a new position would exceed risk limits
  public canOpenNewPosition(existingPositions: number, existingExposure: number): boolean {
    if (existingPositions >= this.riskSettings.maxOpenPositions) {
      return false;
    }
    
    if (existingExposure >= this.riskSettings.maxPositionSize * this.riskSettings.maxOpenPositions) {
      return false;
    }
    
    return true;
  }
}

export default RiskManager;
