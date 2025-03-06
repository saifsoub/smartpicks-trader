
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ChartHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ loading, onRefresh }) => {
  return (
    <CardHeader className="border-b border-slate-800 pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-white">Market Chart</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default ChartHeader;
