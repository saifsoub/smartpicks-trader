
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowUpDown, Save } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">TradingBot</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* API Configuration */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Binance API Configuration</CardTitle>
              <CardDescription>Connect your Binance account to enable trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input 
                  id="apiKey" 
                  placeholder="Enter your Binance API key" 
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input 
                  id="secretKey" 
                  type="password" 
                  placeholder="Enter your Binance secret key" 
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save API Keys
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive trading alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telegram Notifications</Label>
                  <p className="text-xs text-slate-400">Receive alerts via Telegram</p>
                </div>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegramId">Telegram Chat ID</Label>
                <Input 
                  id="telegramId" 
                  placeholder="Enter your Telegram chat ID" 
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trade Notifications</Label>
                  <p className="text-xs text-slate-400">Get notified for each trade</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-slate-400">Receive daily performance reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Button className="w-full">Save Notification Settings</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
