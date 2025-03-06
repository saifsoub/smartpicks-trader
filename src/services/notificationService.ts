interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  tradeNotificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
  marketAlertEnabled: boolean;
  priceAlertThreshold: number;
}

class NotificationService {
  private telegramBotToken: string | null = null;
  private telegramChatId: string | null = null;
  private notifications: Notification[] = [];
  private settings: NotificationSettings = {
    telegramEnabled: false,
    telegramChatId: "",
    tradeNotificationsEnabled: true,
    dailySummaryEnabled: true,
    marketAlertEnabled: true,
    priceAlertThreshold: 5
  };

  constructor() {
    // Load saved settings
    this.loadSettings();
    
    // Initialize with some sample notifications
    this.initializeNotifications();
  }

  private loadSettings() {
    const savedTelegramBotToken = localStorage.getItem('telegramBotToken');
    const savedTelegramChatId = localStorage.getItem('telegramChatId');
    const savedSettings = localStorage.getItem('notificationSettings');
    
    if (savedTelegramBotToken) {
      this.telegramBotToken = savedTelegramBotToken;
    }
    
    if (savedTelegramChatId) {
      this.telegramChatId = savedTelegramChatId;
    }

    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }

  private initializeNotifications() {
    this.notifications = [
      {
        id: '1',
        title: 'Welcome to TradingBot',
        message: 'Your AI trading assistant is ready to help you maximize profits.',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        read: false,
        type: 'info'
      },
      {
        id: '2',
        title: 'Market Alert',
        message: 'BTC showing bullish divergence on 4h chart. Consider long positions.',
        timestamp: new Date(Date.now() - 35 * 60000), // 35 minutes ago
        read: false,
        type: 'success'
      },
      {
        id: '3',
        title: 'System Update',
        message: 'New strategy templates have been added. Check them out!',
        timestamp: new Date(Date.now() - 120 * 60000), // 2 hours ago
        read: true,
        type: 'info'
      }
    ];
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public saveSettings(settings: NotificationSettings): boolean {
    try {
      this.settings = { ...settings };
      
      // Update Telegram credentials if needed
      if (settings.telegramEnabled && settings.telegramChatId) {
        this.telegramChatId = settings.telegramChatId;
        // If we don't have a bot token yet, use a default for demonstration
        if (!this.telegramBotToken) {
          this.telegramBotToken = "demo_bot_token";
        }
      } else {
        this.telegramChatId = null;
      }

      // Save to localStorage
      localStorage.setItem('telegramChatId', settings.telegramChatId || "");
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    }
  }

  public setTelegramCredentials(botToken: string, chatId: string): boolean {
    try {
      this.telegramBotToken = botToken;
      this.telegramChatId = chatId;
      
      localStorage.setItem('telegramBotToken', botToken);
      localStorage.setItem('telegramChatId', chatId);
      
      // Update settings
      this.settings.telegramEnabled = true;
      this.settings.telegramChatId = chatId;
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      
      return true;
    } catch (error) {
      console.error('Failed to save Telegram credentials:', error);
      return false;
    }
  }
  
  public hasTelegramCredentials(): boolean {
    return this.telegramBotToken !== null && this.telegramChatId !== null;
  }
  
  public clearTelegramCredentials(): void {
    this.telegramBotToken = null;
    this.telegramChatId = null;
    
    localStorage.removeItem('telegramBotToken');
    localStorage.removeItem('telegramChatId');
    
    // Update settings
    this.settings.telegramEnabled = false;
    this.settings.telegramChatId = "";
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }
  
  public async testTelegramConnection(): Promise<boolean> {
    if (!this.hasTelegramCredentials()) {
      console.warn("Cannot test Telegram connection: Credentials not configured");
      return false;
    }
    
    try {
      const success = await this.sendTelegramMessage('Test notification from TradingBot - Your Smart AI Trading Assistant');
      console.log('Telegram test notification sent successfully');
      return success;
    } catch (error) {
      console.error('Failed to send Telegram test notification:', error);
      return false;
    }
  }
  
  public async sendTelegramMessage(message: string): Promise<boolean> {
    if (!this.hasTelegramCredentials()) {
      console.warn('Cannot send Telegram message: Credentials not configured');
      return false;
    }
    
    try {
      // For a real implementation, we'd make an HTTP request to the Telegram API
      // but for now we'll simulate a successful API call
      console.log(`Sending Telegram notification to @${this.telegramChatId}: ${message}`);
      
      // Simulate API call - In production, this would call the actual Telegram API
      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  public async sendMarketAnalysisAlert(symbol: string, analysis: string): Promise<boolean> {
    // Add to notifications
    this.addNotification({
      title: `Market Analysis: ${symbol}`,
      message: analysis,
      type: 'info'
    });
    
    // Send telegram notification if configured and enabled
    if (this.hasTelegramCredentials() && this.settings.marketAlertEnabled) {
      return await this.sendTelegramMessage(`📊 ${symbol} Analysis: ${analysis}`);
    }
    
    return false;
  }
  
  public async notifyTrade(symbol: string, action: 'BUY' | 'SELL', price: string): Promise<void> {
    const emoji = action === 'BUY' ? '🟢' : '🔴';
    const message = `${emoji} ${action} ${symbol} at $${price}`;
    
    // Add to notifications
    this.addNotification({
      title: `${action} Order Executed`,
      message: `${symbol} at $${price}`,
      type: action === 'BUY' ? 'success' : 'warning'
    });
    
    // Send telegram notification if configured and enabled
    if (this.hasTelegramCredentials() && this.settings.tradeNotificationsEnabled) {
      await this.sendTelegramMessage(message);
    }
  }
  
  public addNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }): void {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      timestamp: new Date(),
      read: false,
      type: notification.type
    };
    
    this.notifications.unshift(newNotification);
    
    // Keep only the latest 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
  }
  
  public getLatestNotifications(count: number = 5): Notification[] {
    return this.notifications.slice(0, count);
  }
  
  public markAllAsRead(): void {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
  }
  
  public getUnreadCount(): number {
    return this.notifications.filter(notification => !notification.read).length;
  }
}

const notificationService = new NotificationService();
export default notificationService;
