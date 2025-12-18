import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Transactions feature', () => {
  test('navigates from dashboard to transactions and back', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: /transactions/i }).click();
    await expect(page.getByRole('heading', { name: /transactions history/i })).toBeVisible();

    await page.getByRole('button', { name: /back to dashboard/i }).click();
    await expect(page.getByRole('heading', { name: /overview/i }).first()).toBeVisible();
  });

  test('opens add-entry flow from transactions page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /transactions/i }).click();

    await page.getByRole('button', { name: /add entry/i }).click();
    await expect(page.getByRole('heading', { name: /add inventory transaction/i })).toBeVisible();
  });
});
