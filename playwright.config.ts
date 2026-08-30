import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const SITE_PORT = 5174

/**
 * Chrome only, and deliberately: the library targets features other engines are
 * still shipping, so a cross-browser matrix would report failures that are the
 * documented state of the world rather than regressions. Widen it when the
 * compat table says the features have landed.
 *
 * CHROMIUM_PATH exists for sandboxes that ship a browser rather than letting
 * `playwright install` fetch one.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: [
    {
      command: `vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
    },
    // The docs site, built and then served, so tests/docs.spec.ts drives the
    // real generated pages. It means a broken docs build fails `npm run verify`
    // rather than only the Docs workflow, which is where it went unnoticed for
    // six runs.
    {
      command: `npm run docs:build && node scripts/serve-site.mjs`,
      url: `http://localhost:${SITE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
    },
  ],
})
