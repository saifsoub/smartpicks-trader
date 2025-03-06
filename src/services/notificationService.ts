
import { toast } from "sonner";

export interface NotificationSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  tradeNotificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
  marketAlertEnabled: boolean;
  priceAlertThreshold: number;
}

class NotificationService {
  private settings: NotificationSettings = {
    telegramEnabled: false,
    telegramChatId: '',
    tradeNotificationsEnabled: true,
    dailySummaryEnabled: true,
    marketAlertEnabled: true,
    priceAlertThreshold: 5 // Default 5% price movement alert
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
      toast.success("Notification settings saved");
      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error("Failed to save notification settings");
      return false;
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public async testTelegramSetup(): Promise<boolean> {
    if (!this.settings.telegramEnabled) {
      toast.info("To enable Telegram notifications, please follow these steps:");
      toast.info("1. Create a Telegram bot using BotFather (@BotFather)");
      toast.info("2. Get your Chat ID by messaging @userinfobot");
      toast.info("3. Enter the bot token and chat ID in Settings");
      return false;
    }
    
    return await this.testTelegramConnection();
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
      
      // For now just show a toast
      toast.success(`Would send message to Telegram: "${message}"`, {
        description: "To actually send Telegram messages, set up a Supabase Edge Function",
        duration: 5000
      });
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

  // Send market analysis notification
  public sendMarketAnalysisAlert(symbol: string, analysis: string, confidence: number): void {
    if (!this.settings.marketAlertEnabled) {
      return;
    }
    
    const emoji = confidence > 80 ? "🔥" : confidence > 60 ? "👍" : "ℹ️";
    const message = `${emoji} AI Market Analysis for ${symbol}:\n${analysis}\nConfidence: ${confidence}%`;
    this.sendTelegramMessage(message);
  }
  
  // Send price alert notification
  public sendPriceAlert(symbol: string, currentPrice: string, percentChange: number, timeframe: string): void {
    if (!this.settings.marketAlertEnabled || Math.abs(percentChange) < this.settings.priceAlertThreshold) {
      return;
    }
    
    const direction = percentChange > 0 ? "increased" : "decreased";
    const emoji = percentChange > 0 ? "🚀" : "📉";
    
    const message = `${emoji} Price Alert: ${symbol} has ${direction} by ${Math.abs(percentChange).toFixed(2)}% in the last ${timeframe} to ${currentPrice}`;
    this.sendTelegramMessage(message);
  }
  
  // Send AI strategy recommendation
  public sendStrategyRecommendation(strategy: string, symbol: string, reason: string): void {
    if (!this.settings.marketAlertEnabled) {
      return;
    }
    
    const message = `💡 AI Strategy Recommendation:\nApply "${strategy}" strategy to ${symbol}\nReason: ${reason}`;
    this.sendTelegramMessage(message);
  }
}

// Create a singleton instance
const notificationService = new NotificationService();
export default notificationService;
