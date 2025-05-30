import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import binanceService from "@/services/binanceService";
import { toast } from "sonner";

interface SymbolSelectorProps {
  selectedSymbols: string[];
  onChange: (symbols: string[]) => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ selectedSymbols, onChange }) => {
  const [open, setOpen] = useState(false);
  const [symbols, setSymbols] = useState<{symbol: string, priceChangePercent: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const MAX_SELECTIONS = 5;

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allSymbols = await binanceService.getSymbols();
        
        // Validate the response before processing
        if (!allSymbols || !Array.isArray(allSymbols)) {
          console.warn("Invalid symbols data received:", allSymbols);
          throw new Error("Failed to get valid symbol data");
        }
        
        // Filter for major USDT pairs
        const filteredSymbols = allSymbols
          .filter(s => s && s.symbol && typeof s.symbol === 'string' && s.symbol.endsWith('USDT'))
          // Top 20 by trading volume or just use the most common ones
          .slice(0, 50);
          
        setSymbols(filteredSymbols);
      } catch (error) {
        console.error("Failed to fetch symbols:", error);
        setError("Failed to load symbols. Using default list.");
        
        // Fallback to common symbols if API fails
        setSymbols([
          { symbol: "BTCUSDT", priceChangePercent: "0" },
          { symbol: "ETHUSDT", priceChangePercent: "0" },
          { symbol: "BNBUSDT", priceChangePercent: "0" },
          { symbol: "ADAUSDT", priceChangePercent: "0" },
          { symbol: "DOGEUSDT", priceChangePercent: "0" },
          { symbol: "XRPUSDT", priceChangePercent: "0" },
          { symbol: "DOTUSDT", priceChangePercent: "0" },
          { symbol: "SOLUSDT", priceChangePercent: "0" },
        ]);
        
        // Show toast for better UX
        toast.error("Failed to load symbols. Using default list.");
      } finally {
        setLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  const handleSymbolSelect = (symbol: string) => {
    if (!symbol) return;
    
    // Make sure selectedSymbols is an array
    const safeSelectedSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];
    
    // If already selected, remove it
    if (safeSelectedSymbols.includes(symbol)) {
      onChange(safeSelectedSymbols.filter(s => s !== symbol));
    } 
    // Otherwise add it if under the limit
    else if (safeSelectedSymbols.length < MAX_SELECTIONS) {
      onChange([...safeSelectedSymbols, symbol]);
    }
  };

  const removeSymbol = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const safeSelectedSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];
    onChange(safeSelectedSymbols.filter(s => s !== symbol));
  };

  // Make sure we have valid arrays for the component to work with
  const safeSymbols = Array.isArray(symbols) ? symbols : [];
  const safeSelectedSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {safeSelectedSymbols.map(symbol => (
          <Badge 
            key={symbol} 
            variant="secondary"
            className="bg-indigo-800/40 hover:bg-indigo-800/60 text-white"
          >
            {symbol.replace('USDT', '')}
            <button 
              className="ml-1 text-xs hover:bg-indigo-700 rounded-full h-4 w-4 inline-flex items-center justify-center"
              onClick={(e) => removeSymbol(symbol, e)}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-slate-800 border-slate-700 text-white"
            disabled={loading}
          >
            {loading 
              ? "Loading symbols..." 
              : safeSelectedSymbols.length === 0 
                ? "Select cryptocurrencies..." 
                : `${safeSelectedSymbols.length}/${MAX_SELECTIONS} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-slate-900 border-slate-700">
          {error && (
            <div className="p-2 text-amber-400 text-xs border-b border-slate-800">
              {error}
            </div>
          )}
          
          <Command className="bg-transparent">
            <CommandInput placeholder="Search cryptocurrencies..." className="text-white" />
            <CommandEmpty>No cryptocurrency found.</CommandEmpty>
            <div className="max-h-[280px] overflow-y-auto">
              <CommandGroup>
                {safeSymbols.length > 0 ? (
                  safeSymbols.map((item) => {
                    if (!item || typeof item.symbol !== 'string') {
                      return null; // Skip invalid items
                    }
                    
                    const isSelected = safeSelectedSymbols.includes(item.symbol);
                    const isDisabled = safeSelectedSymbols.length >= MAX_SELECTIONS && !isSelected;
                    
                    return (
                      <CommandItem
                        key={item.symbol}
                        value={item.symbol}
                        onSelect={() => handleSymbolSelect(item.symbol)}
                        disabled={isDisabled}
                        className={cn(
                          "flex items-center justify-between text-white",
                          isDisabled && "opacity-50 cursor-not-allowed",
                          isSelected && "bg-indigo-900/30"
                        )}
                      >
                        <div className="flex items-center">
                          {item.symbol.replace('USDT', '')}
                          <span className={cn(
                            "ml-2 text-xs",
                            parseFloat(item.priceChangePercent || "0") >= 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {parseFloat(item.priceChangePercent || "0") > 0 && "+"}
                            {parseFloat(item.priceChangePercent || "0").toFixed(2)}%
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-green-500" />}
                      </CommandItem>
                    );
                  })
                ) : loading ? (
                  <div className="p-4 text-center text-white">Loading symbols...</div>
                ) : (
                  <div className="p-4 text-center text-white">No symbols found</div>
                )}
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      
      <p className="text-xs text-slate-400">
        {safeSelectedSymbols.length === MAX_SELECTIONS 
          ? `Maximum ${MAX_SELECTIONS} symbols selected` 
          : `Select up to ${MAX_SELECTIONS} symbols`}
      </p>
    </div>
  );
};

export default SymbolSelector;
