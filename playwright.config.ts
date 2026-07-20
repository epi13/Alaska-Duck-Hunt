import { defineConfig, devices } from '@playwright/test';

const production = process.env.PLAYWRIGHT_PRODUCTION === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: production ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:8000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: production ? 'npm run preview' : 'npm run dev',
    port: production ? 4173 : 8000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
