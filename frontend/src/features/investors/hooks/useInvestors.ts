"use client";

import { useApp } from '../../../app/context/AppContext';

export function useInvestorsFeature() {
  const { investors, addInvestor, addInvestment, addWithdrawal } = useApp();
  return {
    investors,
    addInvestor,
    addInvestment,
    addWithdrawal,
  };
}
