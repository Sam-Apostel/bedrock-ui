import { defineConfig, devices } from '@playwright/test'

const PORT = 5173

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
  webServer: {
    command: `vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
})
