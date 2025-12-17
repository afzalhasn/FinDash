import { apiClient } from '../../../shared/lib/api';
import type { Investor, InvestorApiResponse, InvestorActivityPayload } from '../types';

export const mapInvestorResponse = (inv: InvestorApiResponse): Investor => ({
  id: inv.id,
  name: inv.name,
  totalInvested: Number(inv.total_invested),
  totalWithdrawn: Number(inv.total_withdrawn),
  netInvestment: Number(inv.net_investment),
  lastActivityDate: inv.last_activity_at ? new Date(inv.last_activity_at) : new Date(),
  investments: [],
});

export const fetchInvestors = async (): Promise<Investor[]> => {
  const response = await apiClient.get<InvestorApiResponse[]>('/api/v1/investors');
  return response.map(mapInvestorResponse);
};

export const createInvestorRequest = async (name: string): Promise<Investor> => {
  const response = await apiClient.post<InvestorApiResponse>('/api/v1/investors', { name });
  return mapInvestorResponse(response);
};

export const createInvestorActivityRequest = async (investorId: string, payload: InvestorActivityPayload): Promise<Investor> => {
  const response = await apiClient.post<InvestorApiResponse>(`/api/v1/investors/${investorId}/activities`, payload);
  return mapInvestorResponse(response);
};
