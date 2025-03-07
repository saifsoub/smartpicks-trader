
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import heartbeatService from './services/heartbeatService';
import automatedTradingService from './services/automatedTradingService';
import binanceService from './services/binanceService';

// Initialize the heartbeat service
heartbeatService;

// Initialize the automated trading service
automatedTradingService;

// Set default proxy mode (true = use proxy, false = direct API)
// This helps overcome CORS issues in browser environments
if (localStorage.getItem('useLocalProxy') === null) {
  binanceService.setProxyMode(true);
}

createRoot(document.getElementById("root")!).render(<App />);
