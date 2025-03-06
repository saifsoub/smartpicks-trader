
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Star, TrendingUp, BarChart, Award, 
  MessageSquare, Share2, ThumbsUp, User, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const topTraders = [
  {
    id: "1",
    name: "Alex Chen",
    username: "cryptoalex",
    avatar: "AC",
    winRate: 76,
    monthlyReturn: 32.5,
    followers: 1204,
    description: "Full-time crypto trader specializing in breakout patterns and momentum strategies.",
    verified: true,
    strategies: ["Momentum", "Breakout", "Swing"]
  },
  {
    id: "2",
    name: "Sophia Rodriguez",
    username: "sophiatrades",
    avatar: "SR",
    winRate: 81,
    monthlyReturn: 28.9,
    followers: 956,
    description: "Technical analyst with 5+ years experience. Expert in Elliott Wave Theory.",
    verified: true,
    strategies: ["Wave Theory", "Technical"]
  },
  {
    id: "3",
    name: "Marcus Johnson",
    username: "mjtrader",
    avatar: "MJ",
    winRate: 68,
    monthlyReturn: 21.2,
    followers: 743,
    description: "Risk-averse trader focusing on consistent gains through volatility strategies.",
    verified: false,
    strategies: ["Risk-Averse", "Volatility"]
  },
];

const trendingStrategies = [
  {
    id: "strat1",
    name: "BTC Volatility Rider",
    creator: "cryptoalex",
    return: 42.8,
    followers: 872,
    tags: ["Volatility", "BTC", "Momentum"]
  },
  {
    id: "strat2",
    name: "ETH Breakout Master",
    creator: "sophiatrades",
    return: 35.3,
    followers: 645,
    tags: ["Breakout", "ETH", "Swing"]
  },
  {
    id: "strat3",
    name: "MACD Cross Hunter",
    creator: "tradermark",
    return: 28.1,
    followers: 529,
    tags: ["MACD", "Technical", "Multiple"]
  },
];

const SocialTradingFeatures: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null);
  
  const toggleTraderExpand = (id: string) => {
    if (expandedTrader === id) {
      setExpandedTrader(null);
    } else {
      setExpandedTrader(id);
    }
  };
  
  const followTrader = (traderId: string) => {
    toast.success("You are now following this trader. You'll receive notifications about their new strategies.");
  };
  
  const copyStrategy = (strategyId: string, strategyName: string) => {
    toast.success(`You've copied "${strategyName}" to your strategies.`);
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-indigo-400 mr-2" />
            <CardTitle className="text-white">Social Trading</CardTitle>
          </div>
          <Badge className="bg-indigo-600">New Feature</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="relative">
          <Input 
            className="bg-slate-800 border-slate-700 text-white pr-10"
            placeholder="Search traders or strategies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Users className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
        
        <Tabs defaultValue="traders">
          <TabsList className="bg-slate-800 w-full">
            <TabsTrigger value="traders" className="flex-1">Top Traders</TabsTrigger>
            <TabsTrigger value="strategies" className="flex-1">Trending Strategies</TabsTrigger>
            <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="traders" className="space-y-4 mt-4">
            {topTraders.map((trader) => (
              <div 
                key={trader.id} 
                className="bg-slate-800/70 rounded-lg border border-slate-700 overflow-hidden"
              >
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTraderExpand(trader.id)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={`/avatars/${trader.id}.png`} alt={trader.name} />
                      <AvatarFallback className="bg-indigo-900 text-indigo-200">{trader.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <div className="font-medium text-white mr-1">{trader.name}</div>
                        {trader.verified && (
                          <Badge className="h-5 bg-blue-500/20 text-blue-300 border-blue-500/30">
                            <Star className="h-3 w-3 mr-1" fill="currentColor" /> Pro
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">@{trader.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <div className="text-xs text-slate-400">Monthly Return</div>
                      <div className="text-green-400 font-medium">+{trader.monthlyReturn}%</div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${expandedTrader === trader.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {expandedTrader === trader.id && (
                  <div className="px-3 pb-3">
                    <div className="p-3 bg-slate-800 border border-slate-700 rounded text-sm">
                      <p className="text-slate-300 mb-3">{trader.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <div className="text-xs text-slate-400">Win Rate</div>
                          <div className="text-green-400 font-medium">{trader.winRate}%</div>
                        </div>
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <div className="text-xs text-slate-400">Followers</div>
                          <div className="text-blue-400 font-medium">{trader.followers}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <div className="text-xs text-slate-400">Strategies</div>
                          <div className="text-purple-400 font-medium">{trader.strategies.length}</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">Specialties</div>
                        <div className="flex flex-wrap gap-1">
                          {trader.strategies.map((strat, index) => (
                            <Badge key={index} className="bg-indigo-900/30 text-indigo-300 border-indigo-800">
                              {strat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => followTrader(trader.id)}
                        >
                          <User className="mr-1 h-4 w-4" /> Follow
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-slate-600">
                          <MessageSquare className="mr-1 h-4 w-4" /> Message
                        </Button>
                        <Button size="sm" variant="ghost" className="w-9 h-9 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="strategies" className="space-y-4 mt-4">
            {trendingStrategies.map((strategy) => (
              <div 
                key={strategy.id} 
                className="p-4 bg-slate-800/70 rounded-lg border border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-white flex items-center">
                      {strategy.name}
                      <Badge className="ml-2 bg-green-900/30 text-green-300 border-green-800">
                        +{strategy.return}%
                      </Badge>
                    </h3>
                    <div className="text-sm text-slate-400">by @{strategy.creator}</div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${strategy.id}.png`} alt={strategy.creator} />
                    <AvatarFallback className="bg-indigo-900 text-indigo-200">{strategy.creator.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex items-center text-sm text-slate-400 mb-3">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{strategy.followers} traders using this strategy</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {strategy.tags.map((tag, index) => (
                    <Badge key={index} className="bg-slate-900/50 text-slate-300 border-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => copyStrategy(strategy.id, strategy.name)}
                  >
                    <TrendingUp className="mr-1 h-4 w-4" /> Copy Strategy
                  </Button>
                  <Button size="sm" variant="outline" className="w-9 h-9 p-0 border-slate-600">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="w-9 h-9 p-0 border-slate-600">
                    <BarChart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">Start Following Top Traders</h3>
              <p className="text-slate-400 mb-4">Follow professional traders to access their strategies and get notified about their trades</p>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Users className="mr-2 h-4 w-4" />
                Explore Top Traders
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SocialTradingFeatures;
