
import { TradingEventListener } from './types';

export class TradingEventEmitter {
  private eventListeners: TradingEventListener[] = [];
  
  public subscribe(listener: TradingEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }
  
  public emit(event: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

export default new TradingEventEmitter();
