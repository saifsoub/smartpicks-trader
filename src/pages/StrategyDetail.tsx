import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, ArrowUpDown, Edit, Trash } from "lucide-react";
import tradingService from "@/services/tradingService";
import { Strategy } from "@/services/tradingService";
import { toast } from "sonner";

const StrategyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load strategy details on component mount or id change
  useEffect(() => {
    if (id) {
      const foundStrategy = tradingService.getStrategyById(id);
      setStrategy(foundStrategy || null);
    }
  }, [id]);

  // Handle strategy deletion
  const handleDeleteStrategy = () => {
    if (id) {
      tradingService.deleteStrategy(id);
      toast.success("Strategy deleted successfully");
      navigate("/strategies");
    }
  };

  if (!strategy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Strategy Not Found</h1>
          <Button onClick={() => navigate("/strategies")}>Back to Strategies</Button>
        </div>
      </div>
    );
  }

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
            onClick={() => navigate("/strategies")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Strategies
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{strategy.name}</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-slate-700 bg-slate-800 hover:bg-slate-700"
              onClick={() => toast.info("Strategy editing coming soon")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Strategy
            </Button>
            
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800">
                <DialogHeader>
                  <DialogTitle>Delete Strategy</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this strategy? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteDialog(false)}
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteStrategy}
                  >
                    Delete Strategy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Strategy Info */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Strategy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm text-slate-400">Description</h3>
                <p className="mt-1">{strategy.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <h3 className="text-sm text-slate-400">Status</h3>
                  <p className="mt-1">{strategy.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Symbol</h3>
                  <p className="mt-1">{strategy.symbol}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Timeframe</h3>
                  <p className="mt-1">{strategy.interval}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Total Trades</h3>
                  <p className="mt-1">{strategy.trades}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Win Rate</h3>
                  <p className="mt-1">{strategy.winRate}</p>
                </div>
                <div>
                  <h3 className="text-sm text-slate-400">Performance</h3>
                  <p className="mt-1 text-green-400">{strategy.performance}</p>
                </div>
                {strategy.lastExecuted && (
                  <>
                    <div>
                      <h3 className="text-sm text-slate-400">Last Executed</h3>
                      <p className="mt-1">
                        {new Date(strategy.lastExecuted).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strategy Parameters */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle>Strategy Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-800">
                {Object.entries(strategy.parameters).map(([name, value], index) => (
                  <div key={index} className="flex justify-between py-3">
                    <span className="text-slate-400">{name}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StrategyDetail;
