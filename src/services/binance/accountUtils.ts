
import { BalanceInfo, BinanceBalance } from './types';

export const formatBalanceData = (
  balances: BinanceBalance[]
): Record<string, BalanceInfo> => {
  const balanceMap: Record<string, BalanceInfo> = {};
  
  for (const balance of balances) {
    if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
      balanceMap[balance.asset] = {
        available: balance.free,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
        usdValue: 0 // Will be filled in by binanceService
      };
    }
  }
  
  return balanceMap;
};

export const getDefaultAccountInfo = (defaultTradingPairs: string[]): { balances: BinanceBalance[] } => {
  console.warn("Using default balances as fallback");
  const defaultBalances = defaultTradingPairs.map(pair => {
    const asset = pair.replace('USDT', '');
    return { asset, free: '0', locked: '0' };
  }).concat({ asset: 'USDT', free: '0', locked: '0' });
  
  return { balances: defaultBalances };
};

export const checkHasRealBalances = (balances: BinanceBalance[]): boolean => {
  return balances.some(
    balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
  );
};
