
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Book, Medal, Gift, ChevronRight, CheckCircle, Sparkles, Rocket, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface NewbieGuideStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  reward: string;
  xp: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  reward: string;
  icon: React.ReactNode;
}

const NewbieGuideDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('guide');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(120);
  const [nextLevelXp, setNextLevelXp] = useState(200);
  
  const [guideSteps, setGuideSteps] = useState<NewbieGuideStep[]>([
    {
      id: '1',
      title: 'Connect to Binance',
      description: 'Link your Binance account to enable automated trading with real funds.',
      isCompleted: true,
      reward: '50 XP',
      xp: 50
    },
    {
      id: '2',
      title: 'Set Up Your First Bot',
      description: 'Configure your first automated trading bot with AI-optimized settings.',
      isCompleted: true,
      reward: '70 XP',
      xp: 70
    },
    {
      id: '3',
      title: 'Complete Risk Profile',
      description: 'Define your risk tolerance to customize AI trading strategies.',
      isCompleted: false,
      reward: '60 XP',
      xp: 60
    },
    {
      id: '4',
      title: 'First Profitable Trade',
      description: 'Let the AI execute your first profitable trade automatically.',
      isCompleted: false,
      reward: '100 XP',
      xp: 100
    },
    {
      id: '5',
      title: 'Enable Advanced Features',
      description: 'Unlock advanced trading features like trailing stops and dynamic position sizing.',
      isCompleted: false,
      reward: '80 XP',
      xp: 80
    }
  ]);
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Trading Apprentice',
      description: 'Complete 10 automated trades',
      progress: 4,
      maxProgress: 10,
      isUnlocked: false,
      reward: '200 XP',
      icon: <Medal className="h-8 w-8 text-yellow-400" />
    },
    {
      id: '2',
      title: 'Portfolio Builder',
      description: 'Reach $1,000 in managed assets',
      progress: 500,
      maxProgress: 1000,
      isUnlocked: false,
      reward: '250 XP',
      icon: <TrendingUp className="h-8 w-8 text-green-400" />
    },
    {
      id: '3',
      title: 'Profit Master',
      description: 'Achieve 5% profit on your portfolio',
      progress: 2.3,
      maxProgress: 5,
      isUnlocked: false,
      reward: '300 XP',
      icon: <Sparkles className="h-8 w-8 text-purple-400" />
    },
    {
      id: '4',
      title: 'Strategy Expert',
      description: 'Test 3 different trading strategies',
      progress: 1,
      maxProgress: 3,
      isUnlocked: false,
      reward: '150 XP',
      icon: <Rocket className="h-8 w-8 text-blue-400" />
    }
  ]);
  
  const markStepCompleted = (stepId: string) => {
    setGuideSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    );
    
    // Find the step to award XP
    const step = guideSteps.find(s => s.id === stepId);
    if (step && !step.isCompleted) {
      addXp(step.xp);
      toast.success(`Completed: ${step.title}! Earned ${step.xp} XP`, {
        duration: 3000
      });
    }
  };
  
  const addXp = (amount: number) => {
    const newXp = xp + amount;
    if (newXp >= nextLevelXp) {
      // Level up!
      setLevel(level + 1);
      setXp(newXp - nextLevelXp);
      setNextLevelXp(Math.floor(nextLevelXp * 1.5));
      toast.success(`🎉 Level Up! You've reached Level ${level + 1}!`, {
        duration: 5000
      });
    } else {
      setXp(newXp);
    }
  };
  
  const getCompletedStepsCount = () => {
    return guideSteps.filter(step => step.isCompleted).length;
  };
  
  const getXpProgress = () => {
    return (xp / nextLevelXp) * 100;
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Book className="h-5 w-5 text-blue-400 mr-2" />
            <span>Trading Journey</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 rounded-full px-3 py-1 text-xs flex items-center">
              <Medal className="h-3.5 w-3.5 text-yellow-400 mr-1" />
              <span className="text-white">Level {level}</span>
            </div>
            <div className="bg-slate-800 rounded-full px-3 py-1 text-xs flex items-center">
              <Zap className="h-3.5 w-3.5 text-purple-400 mr-1" />
              <span className="text-white">{xp} XP</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Progress to Level {level + 1}</span>
            <span>{xp}/{nextLevelXp} XP</span>
          </div>
          <Progress 
            value={getXpProgress()} 
            className="h-2" 
            indicatorClassName="bg-gradient-to-r from-blue-600 to-purple-600" 
          />
        </div>
        
        <Tabs 
          defaultValue="guide" 
          value={selectedTab} 
          onValueChange={setSelectedTab}
        >
          <TabsList className="bg-slate-800 mb-4">
            <TabsTrigger value="guide" className="data-[state=active]:bg-blue-800/70">
              <Book className="h-4 w-4 mr-1.5" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-800/70">
              <Medal className="h-4 w-4 mr-1.5" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-blue-800/70">
              <Gift className="h-4 w-4 mr-1.5" />
              Rewards
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800 mb-3">
              <div>
                <h3 className="text-white font-medium">Getting Started Guide</h3>
                <p className="text-sm text-blue-200">
                  {getCompletedStepsCount()}/{guideSteps.length} steps completed
                </p>
              </div>
              <div>
                <Progress 
                  value={(getCompletedStepsCount() / guideSteps.length) * 100} 
                  className="h-2 w-24" 
                  indicatorClassName="bg-blue-500" 
                />
              </div>
            </div>
            
            {guideSteps.map((step) => (
              <div 
                key={step.id}
                className={`p-3 rounded-lg border ${
                  step.isCompleted 
                    ? 'bg-green-900/10 border-green-800' 
                    : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex items-start">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-3 ${
                    step.isCompleted ? 'bg-green-700' : 'bg-slate-700'
                  }`}>
                    {step.isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-white text-xs">{step.id}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className={`font-medium ${step.isCompleted ? 'text-green-300' : 'text-white'}`}>
                        {step.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-200">
                        {step.reward}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {step.description}
                    </p>
                    
                    {!step.isCompleted && (
                      <Button 
                        className="mt-2 bg-blue-700 hover:bg-blue-800 text-xs h-8"
                        onClick={() => markStepCompleted(step.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.isUnlocked 
                    ? 'bg-yellow-900/10 border-yellow-800' 
                    : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mr-3 border border-slate-700">
                    {achievement.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-white">
                        {achievement.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-200">
                        {achievement.reward}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {achievement.description}
                    </p>
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-1.5" 
                        indicatorClassName={achievement.isUnlocked ? "bg-yellow-500" : "bg-blue-500"} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="rewards" className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
              <h3 className="text-white font-medium flex items-center">
                <Gift className="h-5 w-5 text-purple-400 mr-2" />
                Available Rewards
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Complete achievements and level up to unlock special rewards for your trading journey
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800 cursor-pointer hover:bg-purple-900/40 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-900/60 flex items-center justify-center mr-3">
                      <Sparkles className="h-5 w-5 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="text-purple-200 font-medium">Premium Strategy</h4>
                      <p className="text-xs text-purple-300">Unlock at Level 5</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800 cursor-pointer hover:bg-green-900/40 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-900/60 flex items-center justify-center mr-3">
                      <Zap className="h-5 w-5 text-green-300" />
                    </div>
                    <div>
                      <h4 className="text-green-200 font-medium">Zero Fee Trading</h4>
                      <p className="text-xs text-green-300">Complete 5 achievements</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800 cursor-pointer hover:bg-blue-900/40 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-900/60 flex items-center justify-center mr-3">
                      <TrendingUp className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <h4 className="text-blue-200 font-medium">Advanced Analytics</h4>
                      <p className="text-xs text-blue-300">Reach Level 3</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800 cursor-pointer hover:bg-orange-900/40 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-900/60 flex items-center justify-center mr-3">
                      <Rocket className="h-5 w-5 text-orange-300" />
                    </div>
                    <div>
                      <h4 className="text-orange-200 font-medium">Priority AI Support</h4>
                      <p className="text-xs text-orange-300">Complete all guide steps</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full mt-4 bg-indigo-700 hover:bg-indigo-800"
                onClick={() => toast.success("When you unlock rewards, they'll appear here for redemption!")}
              >
                <Gift className="mr-2 h-4 w-4" />
                View All Rewards
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NewbieGuideDashboard;
