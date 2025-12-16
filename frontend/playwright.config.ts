import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const webServerPort = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/results',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        port: webServerPort,
        timeout: 120000,
        reuseExistingServer: !process.env.CI,
        cwd: '.',
      },
});
