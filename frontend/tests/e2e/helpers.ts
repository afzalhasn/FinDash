import { expect, Page } from '@playwright/test';

const DEFAULT_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@findash.com';
const DEFAULT_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'password';

export async function visitLogin(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /finance dashboard/i })).toBeVisible();
}

export async function submitLoginForm(
  page: Page,
  options?: { email?: string; password?: string }
) {
  const email = options?.email ?? DEFAULT_EMAIL;
  const password = options?.password ?? DEFAULT_PASSWORD;

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
}

export async function loginAsAdmin(page: Page) {
  await visitLogin(page);
  await submitLoginForm(page);
  await expect(page.getByText(/welcome, /i)).toBeVisible();
}
