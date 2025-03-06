interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

class NotificationService {
  private telegramBotToken: string | null = null;
  private telegramChatId: string | null = null;
  private notifications: Notification[] = [];

  constructor() {
    // Load saved settings
    this.loadSettings();
    
    // Initialize with some sample notifications
    this.initializeNotifications();
  }

  private loadSettings() {
    const savedTelegramBotToken = localStorage.getItem('telegramBotToken');
    const savedTelegramChatId = localStorage.getItem('telegramChatId');
    
    if (savedTelegramBotToken) {
      this.telegramBotToken = savedTelegramBotToken;
    }
    
    if (savedTelegramChatId) {
      this.telegramChatId = savedTelegramChatId;
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

  public setTelegramCredentials(botToken: string, chatId: string): boolean {
    try {
      this.telegramBotToken = botToken;
      this.telegramChatId = chatId;
      
      localStorage.setItem('telegramBotToken', botToken);
      localStorage.setItem('telegramChatId', chatId);
      
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
  }
  
  public async testTelegramSetup(): Promise<void> {
    if (!this.hasTelegramCredentials()) {
      return;
    }
    
    try {
      await this.sendTelegramMessage('Test notification from TradingBot - Your Smart AI Trading Assistant');
      console.log('Telegram test notification sent successfully');
    } catch (error) {
      console.error('Failed to send Telegram test notification:', error);
    }
  }
  
  public async sendTelegramMessage(message: string): Promise<boolean> {
    if (!this.hasTelegramCredentials()) {
      console.warn('Cannot send Telegram message: Credentials not configured');
      return false;
    }
    
    try {
      // For demo purposes, we'll just log the message
      // In a real app, you would make an HTTP request to the Telegram API
      console.log(`Sending Telegram notification to @${this.telegramChatId}: ${message}`);
      
      // Simulate API call
      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
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
    
    // Send telegram notification if configured
    if (this.hasTelegramCredentials()) {
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
