
import heartbeatService from "./heartbeatService";
import tradingEventEmitter from "./trading/tradingEventEmitter";
import StrategyManager from "./trading/strategyManager";
import RiskManager from "./trading/riskManager";
import BacktestingService from "./trading/backtestingService";
import StrategyExecutor from "./trading/strategyExecutor";
import { TradingEventListener } from "./trading/types";

// Re-export types from the trading module
export * from "./trading/types";

class AutomatedTradingService {
  private strategyManager: StrategyManager;
  private riskManager: RiskManager;
  private backtestingService: BacktestingService;
  private strategyExecutor: StrategyExecutor;
  
  constructor() {
    // Initialize components
    this.strategyManager = new StrategyManager(tradingEventEmitter);
    this.riskManager = new RiskManager(tradingEventEmitter);
    this.backtestingService = new BacktestingService(this.strategyManager, tradingEventEmitter);
    this.strategyExecutor = new StrategyExecutor(this.strategyManager, tradingEventEmitter);
    
    // Start the automated trading system if the bot is running
    const heartbeatInfo = heartbeatService.getHeartbeatInfo();
    if (heartbeatInfo.botRunning) {
      this.startAutomatedTrading();
    }
    
    // Listen for bot start/stop events
    window.addEventListener('storage', (event) => {
      if (event.key === 'botHeartbeat') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.botRunning && !this.strategyExecutor.isActive()) {
            this.startAutomatedTrading();
          } else if (!data.botRunning && this.strategyExecutor.isActive()) {
            this.stopAutomatedTrading();
          }
        } catch (error) {
          console.error('Error parsing heartbeat data:', error);
        }
      }
    });
  }
  
  // Strategy management methods
  public getStrategies() {
    return this.strategyManager.getStrategies();
  }
  
  public getStrategy(id: string) {
    return this.strategyManager.getStrategy(id);
  }
  
  public addStrategy(strategy: any) {
    return this.strategyManager.addStrategy(strategy);
  }
  
  public updateStrategy(strategy: any) {
    this.strategyManager.updateStrategy(strategy);
  }
  
  public deleteStrategy(id: string) {
    this.strategyManager.deleteStrategy(id);
  }
  
  // Risk management methods
  public getRiskSettings() {
    return this.riskManager.getRiskSettings();
  }
  
  public updateRiskSettings(settings: any) {
    this.riskManager.updateRiskSettings(settings);
  }
  
  // Backtesting methods
  public getBacktestResults() {
    return this.backtestingService.getBacktestResults();
  }
  
  public getBacktestResultForStrategy(strategyId: string) {
    return this.backtestingService.getBacktestResultForStrategy(strategyId);
  }
  
  public runBacktest(strategyId: string, startDate: number, endDate: number, initialBalance: number) {
    return this.backtestingService.runBacktest(strategyId, startDate, endDate, initialBalance);
  }
  
  // Trading execution methods
  public startAutomatedTrading() {
    this.strategyExecutor.startTrading();
  }
  
  public stopAutomatedTrading() {
    this.strategyExecutor.stopTrading();
  }
  
  // Event subscription
  public subscribeToUpdates(listener: TradingEventListener) {
    return tradingEventEmitter.subscribe(listener);
  }
}

const automatedTradingService = new AutomatedTradingService();
export default automatedTradingService;
