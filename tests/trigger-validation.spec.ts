import { expect, test } from '@playwright/test'

/**
 * The dev throw is the whole enforcement mechanism for the button rule, so it
 * is worth a test that it actually reaches the application rather than being
 * swallowed somewhere in the ref-callback plumbing.
 */
test.describe('trigger validation', () => {
  test('a non-button trigger throws in development', async ({ page }) => {
    await page.goto('/?case=non-button-trigger')

    const error = page.getByTestId('error')
    await expect(error).toContainText('Dialog.Trigger rendered <div>')
    await expect(error).toContainText('commandfor only works on <button>')
  })

  test('a submit button inside a form throws in development', async ({ page }) => {
    await page.goto('/?case=submit-trigger')

    const error = page.getByTestId('error')
    await expect(error).toContainText('submit button inside a <form>')
    await expect(error).toContainText('type="button"')
  })
})
