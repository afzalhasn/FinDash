"use client";

import { apiClient } from '../../../shared/lib/api';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password });
};
