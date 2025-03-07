
import { BinanceBalance, BalanceInfo, AccountInfoResponse } from './types';
import { FallbackDataProvider } from './fallbackDataProvider';

/**
 * Formats and processes portfolio balance data from Binance
 */
export function formatBalanceData(balances: BinanceBalance[]): Record<string, BalanceInfo> {
  const balanceMap: Record<string, BalanceInfo> = {};
  
  for (const balance of balances) {
    const free = parseFloat(balance.free);
    const locked = parseFloat(balance.locked);
    const total = free + locked;
    
    if (total > 0) {
      balanceMap[balance.asset] = {
        available: balance.free,
        total: total.toString(),
        usdValue: 0, // Will be updated with real values later
        rawAsset: balance.asset
      };
    }
  }
  
  return balanceMap;
}

/**
 * Provides default account info when API access is limited or fails
 */
export function getDefaultAccountInfo(tradingPairs: string[]): AccountInfoResponse {
  const mockData = FallbackDataProvider.getMockAccountInfo();
  return {
    balances: mockData.balances,
    isDefault: true,
    isLimitedAccess: true
  };
}

/**
 * Checks if account info contains actual non-zero balances
 */
export function checkHasRealBalances(balances: BinanceBalance[]): boolean {
  return balances.some(
    balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
  );
}

/**
 * Utility to calculate USD value for crypto assets
 */
export function calculateUsdValue(
  asset: string, 
  amount: number, 
  prices: Record<string, string>
): number {
  if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC' || asset === 'DAI') {
    return amount;
  }
  
  // Try common pairs first
  const symbolsToTry = [`${asset}USDT`, `${asset}BUSD`, `${asset}USDC`];
  
  for (const symbol of symbolsToTry) {
    if (prices[symbol]) {
      return amount * parseFloat(prices[symbol]);
    }
  }
  
  // If no direct USD pair, try BTC pairs and convert BTC to USD
  const btcSymbol = `${asset}BTC`;
  if (prices[btcSymbol] && prices['BTCUSDT']) {
    return amount * parseFloat(prices[btcSymbol]) * parseFloat(prices['BTCUSDT']);
  }
  
  return 0; // Unable to determine USD value
}
