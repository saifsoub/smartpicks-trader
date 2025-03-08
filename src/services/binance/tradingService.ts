
import { BinanceApiClient } from './apiClient';
import { LogManager } from './logManager';
import { toast } from 'sonner';

export class TradingService {
  private apiClient: BinanceApiClient;
  private logManager: LogManager;
  private retryAttempts: number = 5; // Increased from 3 to 5
  private retryDelay: number = 2000; // ms
  private lastSuccessfulTrade: number = 0;
  private simulationMode: boolean = false;
  private maxConsecutiveErrors: number = 3;
  private consecutiveErrors: number = 0;
  
  constructor(apiClient: BinanceApiClient, logManager: LogManager) {
    this.apiClient = apiClient;
    this.logManager = logManager;
    
    // Listen for offline mode changes
    window.addEventListener('offline-mode-changed', (event: any) => {
      if (event.detail && typeof event.detail.enabled === 'boolean') {
        this.simulationMode = event.detail.enabled;
        console.log(`Trading service simulation mode set to: ${this.simulationMode}`);
        
        // Show user feedback when simulation mode changes
        if (this.simulationMode) {
          toast.info("Simulation mode enabled. Trades will be simulated, not real.");
        } else {
          toast.info("Simulation mode disabled. Trades will be executed on Binance.");
        }
      }
    });
    
    // Check if we're already in offline mode
    try {
      const offlineMode = localStorage.getItem('offlineMode') === 'true';
      this.simulationMode = offlineMode;
      if (offlineMode) {
        console.log('Trading service started in simulation mode');
      }
    } catch (e) {
      console.error('Error checking offline mode:', e);
    }
    
    // Check network status initially
    this.checkNetworkStatus();
  }
  
  // Method to check network status
  private async checkNetworkStatus(): Promise<void> {
    try {
      // Basic connectivity test to Binance
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log("Binance API is reachable");
        this.consecutiveErrors = 0;
        
        // If we were previously in simulation mode due to network issues,
        // inform the user that real trading is now possible
        if (this.simulationMode && localStorage.getItem('autoEnabledSimulation') === 'true') {
          toast.success("Binance API is now reachable. You can disable simulation mode in settings.");
        }
      }
    } catch (error) {
      console.warn("Binance API ping failed, might be network issues:", error);
      this.consecutiveErrors++;
      
      if (this.consecutiveErrors >= this.maxConsecutiveErrors && !this.simulationMode) {
        console.warn(`${this.consecutiveErrors} consecutive network errors. Auto-enabling simulation mode.`);
        this.setSimulationMode(true, true);
        toast.warning("Multiple network errors detected. Automatically enabling simulation mode.");
        this.logManager.addTradingLog("Automatically switched to simulation mode due to network issues", 'warning');
      }
    }
  }
  
  public async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string
  ): Promise<any> {
    if (!this.apiClient.hasCredentials() && !this.simulationMode) {
      throw new Error('API credentials not configured');
    }

    // If we're in simulation mode, return a simulated response immediately
    if (this.simulationMode) {
      return this.generateSimulatedTradeResponse(symbol, side, quantity);
    }

    // Always check network status before attempting real orders
    await this.checkNetworkStatus();

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
        
        // Reset consecutive errors on success
        this.consecutiveErrors = 0;
        
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
          
          // Increment consecutive errors
          this.consecutiveErrors++;
          
          // Check if it's a network error and suggest simulation mode
          if (this.isNetworkError(error)) {
            if (this.consecutiveErrors >= this.maxConsecutiveErrors && !this.simulationMode) {
              console.warn(`${this.consecutiveErrors} consecutive network errors. Auto-enabling simulation mode.`);
              this.setSimulationMode(true, true);
              toast.warning("Multiple network errors detected. Automatically enabling simulation mode.");
              
              // Return a simulated response instead
              return this.generateSimulatedTradeResponse(symbol, side, quantity);
            } else {
              toast.info("Network issues detected. Consider enabling offline simulation mode in settings.");
              this.logManager.addTradingLog("Network issues detected. You can enable offline simulation mode in settings.", 'info');
            }
          }
          
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
    return this.apiClient.hasCredentials() || this.simulationMode;
  }
  
  // Check if we're in simulation mode
  public isInSimulationMode(): boolean {
    return this.simulationMode;
  }
  
  // Set simulation mode
  public setSimulationMode(enabled: boolean, autoEnabled: boolean = false): void {
    this.simulationMode = enabled;
    
    // Mark if this was auto-enabled due to network issues
    if (autoEnabled) {
      localStorage.setItem('autoEnabledSimulation', 'true');
    } else if (!enabled) {
      // Clear the auto-enabled flag when manually disabled
      localStorage.removeItem('autoEnabledSimulation');
    }
    
    this.logManager.addTradingLog(`Trading simulation mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
    console.log(`Trading simulation mode set to: ${enabled}`);
  }
  
  // Check if an error is likely a network error
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('internet') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Load failed') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ERR_CONNECTION') ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('network is offline') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('AbortError')
    );
  }

  // Generate a simulated trade response for testing
  private generateSimulatedTradeResponse(symbol: string, side: 'BUY' | 'SELL', quantity: string): any {
    const now = Date.now();
    const simulatedPrice = Math.random() * 10000; // Random price for simulation
    
    this.logManager.addTradingLog(`Simulated ${side} ${quantity} ${symbol} at price ${simulatedPrice.toFixed(2)} (SIMULATION MODE)`, 'warning');
    toast.success(`Simulated ${side} order placed successfully`);
    
    this.lastSuccessfulTrade = now;
    
    return {
      symbol,
      orderId: Math.floor(Math.random() * 1000000),
      clientOrderId: `sim_${now}`,
      transactTime: now,
      price: simulatedPrice.toString(),
      origQty: quantity,
      executedQty: quantity,
      status: 'FILLED',
      timeInForce: 'GTC',
      type: 'MARKET',
      side,
      fills: [
        {
          price: simulatedPrice.toString(),
          qty: quantity,
          commission: (simulatedPrice * Number(quantity) * 0.001).toString(), // 0.1% commission
          commissionAsset: symbol.replace('USDT', ''),
          tradeId: Math.floor(Math.random() * 1000000)
        }
      ],
      isSimulated: true
    };
  }
  
  // Place a market order with a fallback to offline operation for testing
  public async placeMarketOrderWithFallback(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string,
    allowOfflineOperation: boolean = true // Changed default to true
  ): Promise<any> {
    try {
      // If we're already in simulation mode, use that
      if (this.simulationMode) {
        return this.generateSimulatedTradeResponse(symbol, side, quantity);
      }
      
      // Check network connectivity before trying real order
      await this.checkNetworkStatus();
      
      // Try to place a real order
      return await this.placeMarketOrder(symbol, side, quantity);
    } catch (error) {
      console.error("Order placement error:", error);
      
      // If offline operation is allowed or it's a network error, use simulation mode
      if (allowOfflineOperation || this.isNetworkError(error)) {
        console.warn(`Using offline operation mode for ${side} ${symbol}`);
        this.logManager.addTradingLog(`Simulated ${side} ${quantity} ${symbol} (offline mode)`, 'warning');
        toast.info("Network issue detected. Using simulation mode for this trade.");
        
        // Increment consecutive errors
        this.consecutiveErrors++;
        
        // Auto-enable simulation mode if we've had multiple consecutive errors
        if (this.consecutiveErrors >= this.maxConsecutiveErrors && !this.simulationMode) {
          this.setSimulationMode(true, true);
          toast.warning("Multiple network errors detected. Automatically enabling simulation mode for future trades.");
        }
        
        // Return a mock order response for offline operation
        return this.generateSimulatedTradeResponse(symbol, side, quantity);
      }
      
      // Re-throw if offline operation is not allowed
      throw error;
    }
  }
}

