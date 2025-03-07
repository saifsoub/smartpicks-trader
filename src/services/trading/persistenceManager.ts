
import { TradingStrategy, BacktestResult, RiskManagementSettings, STORAGE_KEYS } from './types';
import { toast } from 'sonner';

class PersistenceManager {
  public loadStrategies(): TradingStrategy[] {
    try {
      const strategiesJson = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
      if (strategiesJson) {
        return JSON.parse(strategiesJson);
      }
    } catch (error) {
      console.error('Error loading strategies from storage:', error);
      toast.error('Failed to load trading strategies');
    }
    return [];
  }
  
  public saveStrategies(strategies: TradingStrategy[]): void {
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
  }
  
  public loadBacktestResults(): BacktestResult[] {
    try {
      const backtestResultsJson = localStorage.getItem(STORAGE_KEYS.BACKTEST_RESULTS);
      if (backtestResultsJson) {
        return JSON.parse(backtestResultsJson);
      }
    } catch (error) {
      console.error('Error loading backtest results from storage:', error);
      toast.error('Failed to load backtest results');
    }
    return [];
  }
  
  public saveBacktestResults(results: BacktestResult[]): void {
    localStorage.setItem(STORAGE_KEYS.BACKTEST_RESULTS, JSON.stringify(results));
  }
  
  public loadRiskSettings(): RiskManagementSettings | null {
    try {
      const riskSettingsJson = localStorage.getItem(STORAGE_KEYS.RISK_SETTINGS);
      if (riskSettingsJson) {
        return JSON.parse(riskSettingsJson);
      }
    } catch (error) {
      console.error('Error loading risk settings from storage:', error);
      toast.error('Failed to load risk management settings');
    }
    return null;
  }
  
  public saveRiskSettings(settings: RiskManagementSettings): void {
    localStorage.setItem(STORAGE_KEYS.RISK_SETTINGS, JSON.stringify(settings));
  }
}

export default new PersistenceManager();
