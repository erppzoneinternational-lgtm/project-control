import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Next.js Daily Progress E2E testing.
 * Runs on production build (npx next start -p 3000) for deterministic fast execution.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npx next start -p 3000',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 60000,
    // Enables the middleware E2E login bypass for THIS test server only.
    // If you reuse an already-running server, start it with PZONE_E2E_ENABLED=true and NEXT_PUBLIC_PZONE_E2E_ENABLED=true.
    env: {
      PZONE_E2E_ENABLED: 'true',
      NEXT_PUBLIC_PZONE_E2E_ENABLED: 'true',
    },
  },
});
