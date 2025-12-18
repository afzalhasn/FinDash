import type { Investor, InvestmentActivity, InvestorActivityPayload } from '../types';

export interface ActivityTransformOptions {
  activityId?: string;
  timestamp?: Date;
  idFactory?: () => string;
}

const defaultIdFactory = () => Date.now().toString();

export const buildInvestmentActivity = (
  payload: InvestorActivityPayload,
  options: ActivityTransformOptions = {},
): InvestmentActivity => {
  const id = options.activityId ?? options.idFactory?.() ?? defaultIdFactory();
  const date = options.timestamp ?? new Date();
  return {
    id,
    type: payload.type,
    amount: payload.amount,
    date,
    notes: payload.notes,
  };
};

export const applyActivityToInvestor = (
  investor: Investor,
  payload: InvestorActivityPayload,
  options: ActivityTransformOptions = {},
): Investor => {
  const activity = buildInvestmentActivity(payload, options);
  if (payload.type === 'investment') {
    return {
      ...investor,
      totalInvested: investor.totalInvested + payload.amount,
      netInvestment: investor.netInvestment + payload.amount,
      lastActivityDate: activity.date,
      investments: [...investor.investments, activity],
    };
  }
  return {
    ...investor,
    totalWithdrawn: investor.totalWithdrawn + payload.amount,
    netInvestment: investor.netInvestment - payload.amount,
    lastActivityDate: activity.date,
    investments: [...investor.investments, activity],
  };
};

export const applyActivityToInvestors = (
  investors: Investor[],
  investorId: string,
  payload: InvestorActivityPayload,
  options: ActivityTransformOptions = {},
): Investor[] => {
  return investors.map(inv => {
    if (inv.id !== investorId) {
      return inv;
    }
    return applyActivityToInvestor(inv, payload, options);
  });
};
