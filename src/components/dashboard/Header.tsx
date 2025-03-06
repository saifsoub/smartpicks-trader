
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Settings, Menu, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import notificationService from "@/services/notificationService";

const Header = () => {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = notificationService.getLatestNotifications();
  const unreadCount = notificationService.getUnreadCount();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const markAllNotificationsRead = () => {
    notificationService.markAllAsRead();
    setNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900 shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left - Logo & Title */}
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-slate-900 text-white border-slate-800">
              <div className="px-2 py-6">
                <h2 className="mb-6 text-xl font-semibold">Navigation</h2>
                <nav className="flex flex-col space-y-4">
                  <Button
                    variant="ghost"
                    className="justify-start hover:bg-slate-800"
                    onClick={() => navigate("/")}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start hover:bg-slate-800"
                    onClick={() => navigate("/strategies")}
                  >
                    Strategies
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start hover:bg-slate-800"
                    onClick={() => navigate("/settings")}
                  >
                    Settings
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <h1 className="text-xl font-bold text-white">TradingBot</h1>
          </div>
          <div className="hidden md:flex space-x-1">
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => navigate("/")}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => navigate("/strategies")}
            >
              Strategies
            </Button>
          </div>
        </div>

        {/* Right - Notifications, Settings, Profile */}
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-300" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-blue-600 p-0 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800 text-white">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllNotificationsRead}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-800 ${
                        !notification.read ? "bg-slate-800/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-2 w-2 mt-1.5 rounded-full ${
                          notification.type === 'success' ? 'bg-green-500' : 
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-slate-400">{notification.message}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(notification.timestamp).toLocaleTimeString()} · {
                              new Date(notification.timestamp).toLocaleDateString()
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-slate-800"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
              <DropdownMenuItem 
                className="hover:bg-slate-800 cursor-pointer"
                onClick={() => handleThemeChange("light")}
              >
                <span className={theme === 'light' ? 'text-blue-400' : ''}>Light Theme</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-slate-800 cursor-pointer"
                onClick={() => handleThemeChange("dark")}
              >
                <span className={theme === 'dark' ? 'text-blue-400' : ''}>Dark Theme</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-slate-800 cursor-pointer"
                onClick={() => handleThemeChange("system")}
              >
                <span className={theme === 'system' ? 'text-blue-400' : ''}>System Theme</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
