
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import heartbeatService from './services/heartbeatService';

// Initialize the heartbeat service
heartbeatService;

createRoot(document.getElementById("root")!).render(<App />);
