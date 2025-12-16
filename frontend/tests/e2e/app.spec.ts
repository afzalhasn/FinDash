import { test, expect } from '@playwright/test';
import { visitLogin, submitLoginForm, loginAsAdmin } from './helpers';

test.describe('FinDash Auth & Navigation', () => {
  test('shows validation feedback for invalid credentials', async ({ page }) => {
    await visitLogin(page);
    await submitLoginForm(page, { email: 'wrong@findash.com', password: 'nope' });
    await expect(
      page.getByText(/invalid credentials|unable to sign in/i).first()
    ).toBeVisible();
  });

  test('allows admin to sign in and see dashboard metrics', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole('heading', { name: /findash/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /transactions/i })).toBeVisible();
  });

  test('navigates to Transactions, Investors, and Account pages', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: /transactions/i }).click();
    await expect(page.getByRole('heading', { name: /transactions history/i })).toBeVisible();

    await page.getByRole('button', { name: /back to dashboard/i }).click();
    await page.getByRole('button', { name: /add investor/i }).click();
    await expect(page.getByRole('heading', { name: /investor management/i })).toBeVisible();

    await page.getByRole('button', { name: /back to dashboard/i }).click();
    await page.getByRole('button', { name: /new account/i }).click();
    await expect(page.getByRole('heading', { name: /account management/i })).toBeVisible();
  });
});
