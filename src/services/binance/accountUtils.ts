
import { BinanceBalance, AccountInfoResponse, BalanceInfo } from './types';
import { FallbackDataProvider } from './fallbackDataProvider';

/**
 * Returns default account information when real data cannot be fetched
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
 * Checks if the account has any non-zero balances
 */
export function checkHasRealBalances(balances: BinanceBalance[]): boolean {
  return balances.some(
    balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
  );
}

/**
 * Formats raw balance data into a more usable format
 */
export function formatBalanceData(balances: BinanceBalance[]): Record<string, BalanceInfo> {
  const result: Record<string, BalanceInfo> = {};
  
  balances.forEach(balance => {
    if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
      const freeAmount = parseFloat(balance.free);
      const lockedAmount = parseFloat(balance.locked);
      const total = (freeAmount + lockedAmount).toString();
      
      result[balance.asset] = {
        available: balance.free,
        total: total,
        usdValue: balance.asset === 'USDT' ? freeAmount + lockedAmount : 0,
        rawAsset: balance.asset
      };
    }
  });
  
  return result;
}

/**
 * Creates a unique ID for an account to help with caching
 */
export function generateAccountCacheKey(apiKey: string, useProxy: boolean): string {
  // Use just part of the API key for privacy
  const keyFragment = apiKey.substring(0, 6) + apiKey.substring(apiKey.length - 6);
  return `account_${keyFragment}_${useProxy ? 'proxy' : 'direct'}`;
}

/**
 * Extracts a safer version of account info for logging, removing sensitive data
 */
export function getSafeAccountInfoForLogging(accountInfo: AccountInfoResponse): object {
  return {
    balancesCount: accountInfo.balances ? accountInfo.balances.length : 0,
    accountType: accountInfo.accountType,
    canTrade: accountInfo.canTrade,
    canDeposit: accountInfo.canDeposit,
    canWithdraw: accountInfo.canWithdraw,
    isDefault: accountInfo.isDefault,
    isLimitedAccess: accountInfo.isLimitedAccess,
    permissionsCount: accountInfo.permissions ? accountInfo.permissions.length : 0
  };
}
