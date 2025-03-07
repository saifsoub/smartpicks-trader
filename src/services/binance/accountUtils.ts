
import { BalanceInfo, BinanceBalance, AccountInfoResponse } from './types';

export const formatBalanceData = (
  balances: BinanceBalance[],
  isDefaultData: boolean = false
): Record<string, BalanceInfo> => {
  const balanceMap: Record<string, BalanceInfo> = {};
  
  for (const balance of balances) {
    // Consider even very small balances (some exchanges return very small dust amounts)
    if (parseFloat(balance.free) > 0.000000001 || parseFloat(balance.locked) > 0.000000001) {
      balanceMap[balance.asset] = {
        available: balance.free,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
        usdValue: 0, // Will be filled in by binanceService
        rawAsset: balance.asset,
        isDefault: isDefaultData
      };
    }
  }
  
  console.log(`Formatted ${Object.keys(balanceMap).length} non-zero balances (isDefault: ${isDefaultData})`);
  return balanceMap;
};

export const getDefaultAccountInfo = (defaultTradingPairs: string[]): AccountInfoResponse => {
  console.warn("Using default balances as fallback - THIS IS NOT REAL DATA");
  
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
  
  return { 
    balances: defaultBalances,
    isDefault: true 
  };
};

export const checkHasRealBalances = (balances: BinanceBalance[]): boolean => {
  // Check if we have any non-zero balances
  const hasNonZeroBalance = balances.some(
    balance => parseFloat(balance.free) > 0.000000001 || parseFloat(balance.locked) > 0.000000001
  );
  
  // Also check if this looks like our default data
  const looksLikeDefaultData = isDefaultBalance(balances);
  
  return hasNonZeroBalance && !looksLikeDefaultData;
};

export const logBalanceSummary = (balances: Record<string, BalanceInfo>): void => {
  if (Object.keys(balances).length === 0) {
    console.log("No non-zero balances found");
    return;
  }
  
  const isDefaultData = Object.values(balances).some(balance => balance.isDefault);
  
  if (isDefaultData) {
    console.warn("USING DEFAULT BALANCE DATA - NOT REAL BALANCES");
  }
  
  console.log(`Found ${Object.keys(balances).length} assets with non-zero balances:`);
  Object.keys(balances).forEach(asset => {
    console.log(`${asset}: ${balances[asset].total} (${balances[asset].usdValue} USD) ${balances[asset].isDefault ? '[DEFAULT DATA]' : ''}`);
  });
};

export const isDefaultBalance = (balances: BinanceBalance[]): boolean => {
  // Check if this matches our default data pattern
  return balances.length >= 4 && 
    balances.some(b => b.asset === 'BTC' && b.free === '0.01') &&
    balances.some(b => b.asset === 'ETH' && b.free === '0.5') &&
    balances.some(b => b.asset === 'BNB' && b.free === '2') &&
    balances.some(b => b.asset === 'USDT' && b.free === '100');
};
