"use client";

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loginRequest, type LoginResponse } from '../api';
import { apiClient } from '../../../../shared/lib/api';

vi.mock('../../../../shared/lib/api', () => {
  return {
    apiClient: {
      post: vi.fn(),
    },
  };
});

describe('auth services api', () => {
  const mockResponse: LoginResponse = {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    user: {
      id: 'test-user',
      name: 'Admin User',
      email: 'admin@findash.com',
      role: 'admin',
      disabled: false,
    },
  };

  beforeEach(() => {
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);
  });

  it('calls /auth/login with provided credentials', async () => {
    const email = 'admin@findash.com';
    const password = 'password';

    const result = await loginRequest(email, password);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', { email, password });
    expect(result).toEqual(mockResponse);
  });

  it('propagates API errors', async () => {
    const error = new Error('Failed request');
    vi.mocked(apiClient.post).mockRejectedValueOnce(error);

    await expect(loginRequest('admin@findash.com', 'password')).rejects.toThrow(error);
  });
});
