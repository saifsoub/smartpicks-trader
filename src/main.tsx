
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import heartbeatService from './services/heartbeatService';
import automatedTradingService from './services/automatedTradingService';

// Initialize the heartbeat service
heartbeatService;

// Initialize the automated trading service
automatedTradingService;

createRoot(document.getElementById("root")!).render(<App />);
