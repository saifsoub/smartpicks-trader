
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import heartbeatService from './services/heartbeatService';
import automatedTradingService from './services/automatedTradingService';
import binanceService from './services/binanceService';
import tradingService from './services/tradingService';

// Initialize the heartbeat service
heartbeatService;

// Initialize the automated trading service
automatedTradingService;

// Load user portfolio for trading with all available coins
binanceService.getAccountInfo()
  .then(account => {
    if (account && account.balances) {
      // Filter balances to only include assets with non-zero balances
      const activeBalances = account.balances.filter(
        balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
      );
      
      // Convert each asset to a trading pair with USDT
      const portfolioPairs = activeBalances
        .map(balance => `${balance.asset}USDT`)
        .filter(pair => pair !== 'USDTUSDT'); // Exclude USDT itself
      
      console.log('Initialized trading with portfolio pairs:', portfolioPairs);
      
      // Update trading service with portfolio pairs
      if (portfolioPairs.length > 0) {
        tradingService.updateBotSettings({
          tradingPairs: portfolioPairs
        });
      }
    }
  })
  .catch(error => {
    console.error('Error loading portfolio for trading service:', error);
  });

// Set default proxy mode (true = use proxy, false = direct API)
// This helps overcome CORS issues in browser environments
if (localStorage.getItem('useLocalProxy') === null) {
  binanceService.setProxyMode(true);
}

createRoot(document.getElementById("root")!).render(<App />);
