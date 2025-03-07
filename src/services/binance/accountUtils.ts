
import { BinanceBalance, AccountInfoResponse } from './types';
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
export function formatBalanceData(balances: BinanceBalance[]): Record<string, { asset: string, free: string, locked: string }> {
  const result: Record<string, { asset: string, free: string, locked: string }> = {};
  
  balances.forEach(balance => {
    if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
      result[balance.asset] = {
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked
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
