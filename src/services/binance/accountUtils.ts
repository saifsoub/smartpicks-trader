
import { BalanceInfo, BinanceBalance } from './types';

export const formatBalanceData = (
  balances: BinanceBalance[]
): Record<string, BalanceInfo> => {
  const balanceMap: Record<string, BalanceInfo> = {};
  
  for (const balance of balances) {
    // Consider even very small balances (some exchanges return very small dust amounts)
    if (parseFloat(balance.free) > 0.00000001 || parseFloat(balance.locked) > 0.00000001) {
      balanceMap[balance.asset] = {
        available: balance.free,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
        usdValue: 0, // Will be filled in by binanceService
        rawAsset: balance.asset
      };
    }
  }
  
  console.log(`Formatted ${Object.keys(balanceMap).length} non-zero balances`);
  return balanceMap;
};

export const getDefaultAccountInfo = (defaultTradingPairs: string[]): { balances: BinanceBalance[] } => {
  console.warn("Using default balances as fallback");
  
  // Create some sample balances for testing when API isn't working
  const defaultBalances = [
    { asset: 'BTC', free: '0.01', locked: '0' },
    { asset: 'ETH', free: '0.5', locked: '0' },
    { asset: 'BNB', free: '2', locked: '0' },
    { asset: 'USDT', free: '100', locked: '0' }
  ];
  
  // Add any missing pairs from defaultTradingPairs
  const existingAssets = defaultBalances.map(b => b.asset);
  defaultTradingPairs.forEach(pair => {
    const asset = pair.replace('USDT', '');
    if (!existingAssets.includes(asset) && asset !== '') {
      defaultBalances.push({ asset, free: '0', locked: '0' });
    }
  });
  
  return { balances: defaultBalances };
};

export const checkHasRealBalances = (balances: BinanceBalance[]): boolean => {
  return balances.some(
    balance => parseFloat(balance.free) > 0.00000001 || parseFloat(balance.locked) > 0.00000001
  );
};

export const logBalanceSummary = (balances: Record<string, BalanceInfo>): void => {
  if (Object.keys(balances).length === 0) {
    console.log("No non-zero balances found");
    return;
  }
  
  console.log(`Found ${Object.keys(balances).length} assets with non-zero balances:`);
  Object.keys(balances).forEach(asset => {
    console.log(`${asset}: ${balances[asset].total} (${balances[asset].usdValue} USD)`);
  });
};
