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

/**
 * The other bargain. A `<details>` has no cancelable hook at all — no
 * `beforetoggle`, no `cancel`, only a `toggle` once it has already moved — so
 * these pin what the controlled root can and cannot do, which is not the same
 * set as Dialog's. The gap is documented in docs/known-gaps.md; if someone
 * closes it, the third test here is the one that should fail.
 */
test.describe('Collapsible, controlled root', () => {
  test('a prop change with no user interaction reconciles the disclosure', async ({ page }) => {
    await page.goto('/?case=controlled-collapsible')
    const details = page.locator('details')

    await expect(details).toHaveJSProperty('open', true)

    await page.getByTestId('close-from-react').click()

    await expect(details).toHaveJSProperty('open', false)
    // Reconciliation is not a user action, so there is nothing to report.
    await expect(page.getByTestId('log')).toBeEmpty()
  })

  test('accepting a toggle lets the DOM keep what it did', async ({ page }) => {
    await page.goto('/?case=controlled-collapsible')
    const details = page.locator('details')

    await page.getByTestId('trigger').click()

    await expect(page.getByTestId('log')).toHaveText('false')
    await expect(details).toHaveJSProperty('open', false)
    await expect(page.getByTestId('body')).toBeHidden()
  })

  test('refusing a toggle is reported and not honoured', async ({ page }) => {
    await page.goto('/?case=controlled-collapsible-refuse')
    const details = page.locator('details')

    await expect(details).toHaveJSProperty('open', true)

    await page.getByTestId('trigger').click()

    // The consumer declined and the `open` prop is still true, but `<details>`
    // offered no hook to decline through and nothing puts it back. This is the
    // documented gap, asserted so it cannot change silently in either direction.
    await expect(page.getByTestId('log')).toHaveText('false')

    // Read once, after a settling window, rather than through a polling
    // matcher: a matcher would be satisfied by the closed frame and could not
    // tell "stays closed" from "closed, then reverted".
    await page.waitForTimeout(300)
    expect(await details.evaluate((node: HTMLDetailsElement) => node.open)).toBe(false)
  })

  test('preventing the trigger click is the veto that does work', async ({ page }) => {
    await page.goto('/?case=collapsible-trigger-veto')
    const details = page.locator('details')

    await page.getByTestId('trigger').click()
    await expect(details).toHaveJSProperty('open', false)

    // Enter and Space on a `<summary>` dispatch the same click, so the same
    // preventDefault covers the keyboard.
    await page.getByTestId('trigger').press('Enter')
    await expect(details).toHaveJSProperty('open', false)

    await page.getByTestId('trigger').press(' ')
    await expect(details).toHaveJSProperty('open', false)

    // Never moved, so there was never a toggle to report.
    await expect(page.getByTestId('log')).toBeEmpty()
  })
})
