import type { UserRole } from './types';

export type AppPage =
  | 'login'
  | 'dashboard'
  | 'add-entry'
  | 'history'
  | 'insights'
  | 'add-investor'
  | 'new-account';

export const DEFAULT_PAGE: AppPage = 'login';

export const PAGE_ACCESS: Partial<Record<AppPage, UserRole[]>> = {
  'add-entry': ['admin', 'partner'],
  'add-investor': ['admin'],
  'new-account': ['admin'],
};

export const PUBLIC_PAGES: AppPage[] = ['login'];
