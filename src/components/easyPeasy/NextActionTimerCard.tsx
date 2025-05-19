
import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NextActionTimer from "@/components/easyPeasy/NextActionTimer";
import { TradeAdvice } from "@/hooks/useTradeAdvice";

interface NextActionTimerCardProps {
  actionableAdvice: TradeAdvice[];
}

const NextActionTimerCard: React.FC<NextActionTimerCardProps> = ({ actionableAdvice }) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
          Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NextActionTimer actionableAdvice={actionableAdvice} />
      </CardContent>
    </Card>
  );
};

export default NextActionTimerCard;
