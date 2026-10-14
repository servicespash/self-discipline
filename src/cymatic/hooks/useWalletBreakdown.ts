// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import { useMemo } from 'react';

export const useWalletBreakdown = (cashOnHand: number) => {
  return useMemo(() => {
    const cash = Math.max(0, cashOnHand);
    return {
      savings: Math.round(cash * 0.30),
      operations: Math.round(cash * 0.40),
      investment: Math.round(cash * 0.20),
      unintended: Math.round(cash * 0.10)
    };
  }, [cashOnHand]);
};
