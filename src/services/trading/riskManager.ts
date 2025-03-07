
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
  }
  
  private getDefaultRiskSettings(): RiskManagementSettings {
    return {
      maxPositionSize: 5, // 5% max per position
      stopLossPercentage: 2.5,
      takeProfitPercentage: 5,
      maxDailyLoss: 10,
      maxOpenPositions: 3,
      trailingStopEnabled: false
    };
  }
  
  private saveRiskSettings(): void {
    persistenceManager.saveRiskSettings(this.riskSettings);
  }
  
  public getRiskSettings(): RiskManagementSettings {
    return {...this.riskSettings};
  }
  
  public updateRiskSettings(settings: RiskManagementSettings): void {
    this.riskSettings = settings;
    this.saveRiskSettings();
    this.eventEmitter.emit({
      event: 'risk_settings_updated'
    });
  }
}

export default RiskManager;
