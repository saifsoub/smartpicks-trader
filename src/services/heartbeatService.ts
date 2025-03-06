
import { toast } from 'sonner';

interface HeartbeatInfo {
  lastActive: number;
  startTime: number;
  botRunning: boolean;
  uptime: number;
  heartbeats: number;
  restarts: number;
}

class HeartbeatService {
  private storageKey = 'botHeartbeat';
  private heartbeatInterval: number | null = null;
  private checkInterval: number | null = null;
  private heartbeatInfo: HeartbeatInfo;
  private readonly HEARTBEAT_FREQUENCY = 60000; // 1 minute
  private readonly MAX_INACTIVE_TIME = 180000; // 3 minutes before considering inactive
  
  constructor() {
    // Initialize heartbeat info from localStorage or with defaults
    const savedInfo = localStorage.getItem(this.storageKey);
    
    if (savedInfo) {
      this.heartbeatInfo = JSON.parse(savedInfo);
      
      // Check if the bot was running but the page was closed/refreshed
      if (this.heartbeatInfo.botRunning) {
        const now = Date.now();
        const inactiveTime = now - this.heartbeatInfo.lastActive;
        
        if (inactiveTime > this.MAX_INACTIVE_TIME) {
          // Bot was inactive for too long, increment restart counter
          this.heartbeatInfo.restarts++;
          console.log(`Bot was inactive for ${Math.round(inactiveTime / 60000)} minutes. Restarting...`);
          toast.warning(`Trading bot was inactive for ${Math.round(inactiveTime / 60000)} minutes. Restarting...`);
        }
        
        // Update the last active time
        this.heartbeatInfo.lastActive = now;
      }
    } else {
      this.heartbeatInfo = {
        lastActive: Date.now(),
        startTime: Date.now(),
        botRunning: false,
        uptime: 0,
        heartbeats: 0,
        restarts: 0
      };
    }
    
    // Always save the heartbeat info on initialization
    this.saveHeartbeatInfo();
    
    // Add beforeunload event to record when the user closes the page
    window.addEventListener('beforeunload', () => {
      if (this.heartbeatInfo.botRunning) {
        this.recordHeartbeat();
      }
    });
    
    // Start the check interval to monitor bot status
    this.startMonitoring();
  }
  
  public startBot(): void {
    this.heartbeatInfo.botRunning = true;
    this.heartbeatInfo.lastActive = Date.now();
    if (!this.heartbeatInfo.startTime) {
      this.heartbeatInfo.startTime = Date.now();
    }
    this.saveHeartbeatInfo();
    this.startHeartbeat();
  }
  
  public stopBot(): void {
    this.heartbeatInfo.botRunning = false;
    this.saveHeartbeatInfo();
    this.stopHeartbeat();
  }
  
  public getHeartbeatInfo(): HeartbeatInfo {
    // Calculate real-time uptime
    if (this.heartbeatInfo.botRunning) {
      const now = Date.now();
      this.heartbeatInfo.uptime = now - this.heartbeatInfo.startTime;
    }
    return {...this.heartbeatInfo};
  }
  
  public getFormattedUptime(): string {
    // Calculate real-time uptime
    let uptime = this.heartbeatInfo.uptime;
    if (this.heartbeatInfo.botRunning) {
      const now = Date.now();
      uptime = now - this.heartbeatInfo.startTime;
    }
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  private startHeartbeat(): void {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Start a new heartbeat interval
    this.heartbeatInterval = window.setInterval(() => {
      this.recordHeartbeat();
    }, this.HEARTBEAT_FREQUENCY);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private recordHeartbeat(): void {
    this.heartbeatInfo.lastActive = Date.now();
    this.heartbeatInfo.heartbeats++;
    this.saveHeartbeatInfo();
  }
  
  private saveHeartbeatInfo(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.heartbeatInfo));
  }
  
  private startMonitoring(): void {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Check the heartbeat every minute to ensure the bot is still running
    this.checkInterval = window.setInterval(() => {
      // If bot is supposed to be running, check last activity
      if (this.heartbeatInfo.botRunning) {
        const now = Date.now();
        const timeSinceLastActive = now - this.heartbeatInfo.lastActive;
        
        // If bot has been inactive too long, consider it as a failure and update stats
        if (timeSinceLastActive > this.MAX_INACTIVE_TIME) {
          console.warn(`Bot heartbeat missed! Last active ${Math.round(timeSinceLastActive / 60000)} minutes ago.`);
          this.heartbeatInfo.restarts++;
          this.heartbeatInfo.lastActive = now;
          this.saveHeartbeatInfo();
          
          // Show a toast notification
          toast.warning("Bot heartbeat missed! The bot might have experienced an issue.");
        }
      }
    }, this.HEARTBEAT_FREQUENCY);
  }
}

const heartbeatService = new HeartbeatService();
export default heartbeatService;
