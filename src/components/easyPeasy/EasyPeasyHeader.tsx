
import React from "react";
import { Button } from "@/components/ui/button";

interface EasyPeasyHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

const EasyPeasyHeader: React.FC<EasyPeasyHeaderProps> = ({ loading, onRefresh }) => {
  return (
    <div className="mb-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 rounded-xl p-6 border border-indigo-800/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Easy Peasy</h1>
          <p className="text-purple-300">Simple, actionable trading advice for beginners</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={onRefresh} 
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Updating..." : "Refresh Advice"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EasyPeasyHeader;
