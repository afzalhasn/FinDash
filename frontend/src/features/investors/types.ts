export interface InvestmentActivity {
  id: string;
  type: 'investment' | 'withdrawal';
  amount: number;
  date: Date;
  notes?: string;
}

export interface Investor {
  id: string;
  name: string;
  totalInvested: number;
  totalWithdrawn: number;
  netInvestment: number;
  lastActivityDate: Date;
  investments: InvestmentActivity[];
}

export interface InvestorApiResponse {
  id: string;
  name: string;
  total_invested: number;
  total_withdrawn: number;
  net_investment: number;
  last_activity_at?: string | null;
}

export interface InvestorActivityPayload {
  type: 'investment' | 'withdrawal';
  amount: number;
  notes?: string;
}
