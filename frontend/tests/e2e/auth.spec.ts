import { test, expect } from '@playwright/test';
import { visitLogin, submitLoginForm, loginAsAdmin } from './helpers';

test.describe('Auth feature', () => {
  test('shows validation feedback when credentials are invalid', async ({ page }) => {
    await visitLogin(page);
    await submitLoginForm(page, { email: 'wrong@findash.com', password: 'invalid' });
    await expect(page.getByText(/invalid credentials|unable to sign in/i).first()).toBeVisible();
  });

  test('allows an admin to authenticate and land on the dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole('heading', { name: /findash/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /transactions/i })).toBeVisible();
    await expect(page.getByText(/welcome, /i)).toBeVisible();
  });
});
