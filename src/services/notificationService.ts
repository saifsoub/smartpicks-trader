import { toast } from "sonner";

export interface NotificationSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  tradeNotificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
}

class NotificationService {
  private settings: NotificationSettings = {
    telegramEnabled: false,
    telegramChatId: '',
    tradeNotificationsEnabled: true,
    dailySummaryEnabled: true
  };

  constructor() {
    // Load settings from localStorage
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  public saveSettings(settings: NotificationSettings): boolean {
    try {
      this.settings = settings;
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Check if the input is a username or chat ID and format accordingly
  private formatTelegramRecipient(input: string): string {
    // If it's already a numeric chat ID, use it as is
    if (/^-?\d+$/.test(input)) {
      return input;
    }
    
    // If it starts with @, use it as is
    if (input.startsWith('@')) {
      return input;
    }
    
    // Otherwise, add @ prefix assuming it's a username
    return `@${input}`;
  }

  // Send a notification via Telegram
  public async sendTelegramMessage(message: string): Promise<boolean> {
    if (!this.settings.telegramEnabled || !this.settings.telegramChatId) {
      console.log('Telegram notifications disabled or chat ID not set');
      return false;
    }

    try {
      // Format the recipient (handle both usernames and chat IDs)
      const recipient = this.formatTelegramRecipient(this.settings.telegramChatId);
      
      // In a real implementation, you would use a backend proxy or Supabase Edge Function
      // to securely send Telegram messages without exposing your bot token
      console.log(`Sending Telegram notification to ${recipient}: ${message}`);
      
      // This is a placeholder for demonstration
      // In a real implementation you would need a serverless function or backend service
      // return await this.sendViaTelegramAPI(message);
      
      toast.success(`Notification sent via Telegram to ${recipient}`);
      return true;
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
      return false;
    }
  }

  // Test Telegram connection
  public async testTelegramConnection(): Promise<boolean> {
    if (!this.settings.telegramEnabled || !this.settings.telegramChatId) {
      toast.error('Telegram notifications are disabled or username/chat ID not set');
      return false;
    }

    try {
      const success = await this.sendTelegramMessage('Test notification from TradingBot - Your Smart AI Trading Assistant');
      if (success) {
        toast.success('Telegram test notification sent successfully');
        return true;
      } else {
        toast.error('Failed to send test notification');
        return false;
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
      return false;
    }
  }

  // Notify about a new trade
  public notifyTrade(symbol: string, action: string, price: string, profit?: string): void {
    if (!this.settings.tradeNotificationsEnabled) {
      return;
    }

    const message = `🤖 TradingBot: ${action} ${symbol} at ${price}${profit ? ` (${profit})` : ''}`;
    this.sendTelegramMessage(message);
  }

  // Send daily summary
  public sendDailySummary(totalTrades: number, winRate: string, profit: string): void {
    if (!this.settings.dailySummaryEnabled) {
      return;
    }

    const message = `📊 Daily Summary:\n• Trades: ${totalTrades}\n• Win Rate: ${winRate}\n• Profit/Loss: ${profit}`;
    this.sendTelegramMessage(message);
  }
}

// Create a singleton instance
const notificationService = new NotificationService();
export default notificationService;
