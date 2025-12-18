import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { saveAuthTokens, loadAuthTokens, clearAuthTokens, getStoredAccessToken, type AuthTokens } from '../auth';

describe('auth token storage helpers', () => {
  const sampleTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: Date.now() + 1000,
  };

  const createMockLocalStorage = () => {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    } satisfies Storage;
  };

  const mockLocalStorage = createMockLocalStorage();

  beforeAll(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal(
      'window',
      {
        localStorage: mockLocalStorage,
      } as Window & typeof globalThis,
    );
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no tokens stored', () => {
    expect(loadAuthTokens()).toBeNull();
    expect(getStoredAccessToken()).toBeNull();
  });

  it('persists and retrieves tokens from localStorage', () => {
    saveAuthTokens(sampleTokens);
    expect(loadAuthTokens()).toEqual(sampleTokens);
  });

  it('returns only the access token via getStoredAccessToken', () => {
    saveAuthTokens(sampleTokens);
    expect(getStoredAccessToken()).toBe(sampleTokens.accessToken);
  });

  it('clears tokens from storage', () => {
    saveAuthTokens(sampleTokens);
    clearAuthTokens();
    expect(loadAuthTokens()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
