import { expect, test } from '@playwright/test'

/**
 * The load-bearing claim of the whole library: the trigger is wired to the
 * dialog by the parser, so the server-rendered markup keeps working with the
 * bundle removed entirely. If this test ever needs JavaScript to pass, the
 * premise is gone.
 *
 * `/ssr` serves what the server actually sent — no script tag, no hydration.
 * Scraping a hydrated page would not do: on the client, a closed dialog's
 * children are unmounted.
 */
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('server-rendered markup opens and closes on its own', async ({ page }) => {
    await page.goto('/ssr?case=plain')
    const dialog = page.locator('dialog')

    // The children a client-side render would have dropped are present here.
    await expect(dialog.locator('h2')).toHaveText('Delete project?')
    await expect(dialog).toHaveJSProperty('open', false)

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(dialog).toHaveJSProperty('open', true)
    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveJSProperty('open', false)
  })
})
