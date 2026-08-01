import { expect, test } from '@playwright/test'

test.describe('Dialog, controlled root', () => {
  test('accepting a change lets the DOM keep what it did', async ({ page }) => {
    await page.goto('/?case=controlled-accept')
    const dialog = page.locator('dialog')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('log')).toHaveText('true')
    await expect(dialog).toHaveJSProperty('open', true)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('log')).toHaveText('true,false')
    await expect(dialog).toHaveJSProperty('open', false)
  })

  test('a prop change with no user interaction reconciles the DOM', async ({ page }) => {
    await page.goto('/?case=controlled-accept')

    await page.getByTestId('open-from-react').click()

    await expect(page.locator('dialog')).toHaveJSProperty('open', true)
  })

  test('refusing an open means the dialog never opens at all', async ({ page }) => {
    await page.goto('/?case=controlled-refuse-open')
    const dialog = page.locator('dialog')

    await page.getByRole('button', { name: 'Delete project' }).click()

    // beforetoggle is cancelable for closed->open on <dialog>, so this is a
    // true veto: no frame of visible movement, not a revert.
    await expect(page.getByTestId('log')).toHaveText('true')
    await expect(dialog).toHaveJSProperty('open', false)
    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(false)
  })

  test('refusing a close keeps it open, for Escape and for Close alike', async ({ page }) => {
    await page.goto('/?case=controlled-refuse-close')
    const dialog = page.locator('dialog')

    await expect(dialog).toHaveJSProperty('open', true)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('log')).toHaveText('false')
    await expect(dialog).toHaveJSProperty('open', true)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('log')).toHaveText('false,false')
    await expect(dialog).toHaveJSProperty('open', true)
  })
})
