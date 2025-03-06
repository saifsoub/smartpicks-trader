import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, Send, Bot, User, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import tradingService from "@/services/tradingService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  icon?: React.ReactNode;
  isAction?: boolean;
}

const predefinedQuestions = [
  "How is my portfolio performing today?",
  "What trading strategy do you recommend?",
  "Set a stop loss for BTC at $65,000",
  "Explain what's happening with BTC price"
];

const generateBotResponse = (message: string): Promise<ChatMessage> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let response: string;
      let icon = <Bot className="h-6 w-6 text-blue-400" />;
      let isAction = false;
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        response = "Hello! I'm your AI trading assistant. I can help you with market analysis, trading strategies, or managing your portfolio. What would you like to know today?";
      }
      else if (lowerMessage.includes('portfolio') && lowerMessage.includes('perform')) {
        icon = <TrendingUp className="h-6 w-6 text-green-400" />;
        response = "Your portfolio is up 2.3% today. BTC (+3.1%) and ETH (+1.8%) are performing well, while SOL is down slightly (-0.4%). Overall, your balance has increased by $127.45 in the last 24 hours.";
      }
      else if (lowerMessage.includes('strategy') && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest'))) {
        response = "Based on current market conditions, I recommend a momentum-based strategy. Bitcoin is showing strong upward momentum with increasing volume. Consider increasing your BTC allocation by 5-10% while maintaining stop losses at key support levels.";
      }
      else if ((lowerMessage.includes('stop loss') || lowerMessage.includes('stoploss')) && lowerMessage.includes('btc')) {
        icon = <CheckCircle2 className="h-6 w-6 text-green-400" />;
        isAction = true;
        response = "✅ Stop loss for BTC has been set at $65,000. I'll automatically adjust this if the price continues to rise to protect your profits.";
      }
      else if (lowerMessage.includes('explain') && lowerMessage.includes('btc')) {
        response = "Bitcoin is currently experiencing a bullish trend driven by institutional buying and positive sentiment following recent regulatory clarity. The 4-hour chart shows a golden cross pattern with strong support at the $64,500 level. Volume has been increasing on up-moves, confirming the trend strength.";
      }
      else if (lowerMessage.includes('market') && lowerMessage.includes('analysis')) {
        response = "Current market analysis shows bullish sentiment across major cryptocurrencies. Bitcoin's dominance is at 52%, with decreasing volatility. Key resistance levels to watch are $68,500 for BTC and $3,800 for ETH. Overall liquidity has improved by 8% in the last week.";
      }
      else if (lowerMessage.includes('risk') && (lowerMessage.includes('reduce') || lowerMessage.includes('lower'))) {
        icon = <AlertTriangle className="h-6 w-6 text-yellow-400" />;
        isAction = true;
        response = "I've adjusted your risk settings to a more conservative profile. Position sizes will be reduced by 20% and stop losses will be tightened. This should reduce your portfolio volatility while still capturing upside potential.";
      }
      else {
        response = "I understand you're interested in " + message.toLowerCase().split(' ').slice(0, 3).join(' ') + "... Based on current market conditions, I'd recommend focusing on strong technical setups with clear risk management. Would you like me to suggest specific trading opportunities?";
      }
      
      resolve({
        id: Date.now(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        icon: icon,
        isAction: isAction
      });
    }, 1000);
  });
};

const AIChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI trading assistant. How can I help you with your automated trading today?",
      timestamp: new Date(),
      icon: <Brain className="h-6 w-6 text-purple-400" />
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      icon: <User className="h-6 w-6 text-slate-400" />
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      const botResponse = await generateBotResponse(input);
      setMessages(prev => [...prev, botResponse]);
      
      if (botResponse.isAction) {
        if (botResponse.content.includes('Stop loss')) {
          toast.success("Stop loss updated successfully");
        } else if (botResponse.content.includes('risk settings')) {
          tradingService.updateBotSettings({ riskLevel: 35 });
          toast.success("Risk settings updated");
        }
      }
    } catch (error) {
      console.error('Error getting bot response:', error);
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg flex flex-col h-full">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 text-indigo-400 mr-2" />
          AI Trading Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[85%] ${
                  message.type === 'user'
                    ? 'flex-row-reverse'
                    : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                    message.type === 'user' ? 'ml-2 mr-0' : ''
                  }`}
                >
                  {message.icon}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-800 text-white'
                      : message.isAction
                      ? 'bg-green-900/30 border border-green-800 text-green-100'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-right mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex">
              <div className="bg-slate-800 rounded-lg p-3 flex items-center">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {predefinedQuestions.map((question, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question.length > 20 ? `${question.substring(0, 20)}...` : question}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-slate-200 border-slate-700">
                    <p>{question}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trading, markets, or portfolio..."
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <style>
            {`
            .typing-indicator {
              display: flex;
              align-items: center;
            }
            
            .typing-indicator span {
              height: 8px;
              width: 8px;
              margin-right: 4px;
              border-radius: 50%;
              background-color: #94a3b8;
              display: inline-block;
              animation: typing 1.4s infinite ease-in-out both;
            }
            
            .typing-indicator span:nth-child(1) {
              animation-delay: 0s;
            }
            
            .typing-indicator span:nth-child(2) {
              animation-delay: 0.2s;
            }
            
            .typing-indicator span:nth-child(3) {
              animation-delay: 0.4s;
            }
            
            @keyframes typing {
              0%, 100% {
                transform: scale(0.6);
                opacity: 0.6;
              }
              50% {
                transform: scale(1);
                opacity: 1;
              }
            }
            `}
          </style>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatAssistant;
