
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";

interface ChartControlsProps {
  symbol: string;
  onSymbolChange: (value: string) => void;
  interval: string;
  onIntervalChange: (value: string) => void;
  currentPrice: string | null;
  priceChange: number | null;
  popularSymbols: { value: string; label: string }[];
  timeIntervals: { value: string; label: string }[];
  formatPrice: (price: number) => string;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  currentPrice,
  priceChange,
  popularSymbols,
  timeIntervals,
  formatPrice
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="flex-1 min-w-[150px]">
        <Select value={symbol} onValueChange={onSymbolChange}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            {popularSymbols.map((s) => (
              <SelectItem key={s.value} value={s.value} className="hover:bg-slate-700">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-32">
        <Select value={interval} onValueChange={onIntervalChange}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            {timeIntervals.map((t) => (
              <SelectItem key={t.value} value={t.value} className="hover:bg-slate-700">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 flex justify-end items-center">
        {currentPrice && (
          <div className="text-right">
            <div className="font-medium text-white">
              {formatPrice(parseFloat(currentPrice))} USDT
            </div>
            {priceChange !== null && (
              <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-end`}>
                <Zap className="h-3 w-3 mr-1" />
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartControls;
