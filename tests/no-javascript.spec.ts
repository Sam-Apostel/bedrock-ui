import { expect, test } from '@playwright/test'

/**
 * The load-bearing claim of the whole library: the trigger is wired to the
 * dialog by the parser, so the rendered markup keeps working with the bundle
 * removed entirely. If this test ever needs JavaScript to pass, the premise is
 * gone.
 *
 * The markup is lifted from a real render rather than hand-written, so it can't
 * drift into something the parts no longer emit.
 */
test('rendered markup opens and closes with JavaScript disabled', async ({ page, browser }) => {
  await page.goto('/?case=plain')
  await expect(page.locator('dialog')).toHaveCount(1)
  const markup = await page.locator('#root').innerHTML()

  const context = await browser.newContext({ javaScriptEnabled: false })
  const dead = await context.newPage()
  await dead.setContent(`<!doctype html><html lang="en"><body>${markup}</body></html>`)

  const dialog = dead.locator('dialog')
  await expect(dialog).toHaveJSProperty('open', false)

  await dead.getByRole('button', { name: 'Delete project' }).click()
  await expect(dialog).toHaveJSProperty('open', true)
  expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)

  await dead.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveJSProperty('open', false)

  await context.close()
})
