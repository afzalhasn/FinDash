import type { RequestInit } from 'next/dist/server/web/spec-extension/request';
import { getStoredAccessToken, clearAuthTokens } from './auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => Promise<string | null> | string | null;
}

export interface ApiErrorPayload {
  detail?: string;
  code?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: ApiClientOptions['getToken'];

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    this.getToken = options.getToken || getStoredAccessToken;
  }

  private async request<T>(path: string, method: HttpMethod, body?: unknown, init?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...init?.headers,
    };

    const token = this.getToken ? await this.getToken() : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...init,
    });

    const correlationId = response.headers.get('X-Correlation-ID');
    if (correlationId) {
      console.debug('API correlation ID', correlationId);
    }

    if (!response.ok) {
      let payload: ApiErrorPayload | undefined;
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }

      if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
        clearAuthTokens();
        window.dispatchEvent(
          new CustomEvent('auth:session-expired', {
            detail: { status: response.status, message: payload?.detail ?? response.statusText },
          })
        );
      }

      throw new ApiError(response.status, payload?.detail || response.statusText, payload);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, 'GET', undefined, init);
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, 'POST', body, init);
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, 'PATCH', body, init);
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, 'DELETE', undefined, init);
  }
}

export const apiClient = new ApiClient();
