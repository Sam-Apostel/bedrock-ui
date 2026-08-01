import { expect, test } from '@playwright/test'

/**
 * Closed content is not in the DOM on the client. This is what makes the
 * uncontrolled root genuinely uncontrolled: closing tears the subtree down, so
 * a form resets itself and nobody has to remember to do it in `onOpenChange`.
 */
test.describe('content mounting', () => {
  test('a closed dialog has no children', async ({ page }) => {
    await page.goto('/?case=mounting')

    await expect(page.locator('dialog')).toHaveCount(1)
    await expect(page.getByTestId('field')).toHaveCount(0)
  })

  test('opening mounts them, closing removes them again', async ({ page }) => {
    await page.goto('/?case=mounting')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('field')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('field')).toHaveCount(0)
  })

  test('state inside resets on close, with nothing wired to onOpenChange', async ({ page }) => {
    await page.goto('/?case=mounting')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await page.getByTestId('field').fill('half-typed input')
    await expect(page.getByTestId('field')).toHaveValue('half-typed input')

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('field')).toHaveCount(0)

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('field')).toHaveValue('')
  })

  test('children mount before the dialog is painted, not after', async ({ page }) => {
    await page.goto('/?case=mounting')

    // `beforetoggle` is where the mount happens. If it were `toggle`, the first
    // frame of the open dialog would be empty; asserting in the same tick as
    // the open catches that.
    await page.getByRole('button', { name: 'Delete project' }).click()

    const emptyOnOpen = await page.locator('dialog').evaluate((node) => {
      const dialog = node as HTMLDialogElement
      return dialog.open && dialog.children.length === 0
    })

    expect(emptyOnOpen).toBe(false)
  })

  test('mounts once per open', async ({ page }) => {
    await page.goto('/?case=mount-counting')
    await expect(page.getByTestId('mounts')).toHaveText('0')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('mounts')).not.toHaveText('0')
    const first = await page.getByTestId('mounts').textContent()

    await page.keyboard.press('Escape')
    // Wait for the subtree to actually go: reopening before the exit transition
    // finishes reuses it, which is the next test.
    await expect(page.getByTestId('body')).toHaveCount(0)
    await expect(page.getByTestId('mounts')).toHaveText(first!)

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('mounts')).not.toHaveText(first!)
  })

  test('reopening during the exit transition keeps the same subtree', async ({ page }) => {
    await page.goto('/?case=mount-counting')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('body')).toBeVisible()
    const mounts = await page.getByTestId('mounts').textContent()

    // Close and reopen inside the 180ms fade. Tearing down and rebuilding here
    // would be visible as a flicker, so the subtree is left alone.
    await page.evaluate(() => {
      const dialog = document.querySelector('dialog')!
      dialog.querySelector<HTMLButtonElement>('[data-bedrock-dialog-close]')!.click()
      document.querySelector<HTMLButtonElement>('[data-bedrock-dialog-trigger]')!.click()
    })

    await expect(page.locator('dialog')).toHaveJSProperty('open', true)
    await expect(page.getByTestId('body')).toBeVisible()
    await expect(page.getByTestId('mounts')).toHaveText(mounts!)
  })

  test('children survive the exit transition', async ({ page }) => {
    // bedrock.css gives the fixture a 180ms fade. Unmounting at `toggle` would
    // empty the dialog while it is still visible and fading.
    await page.goto('/?case=mounting')
    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('field')).toBeVisible()

    const stillThere = await page.evaluate(async () => {
      const dialog = document.querySelector('dialog')!
      const close = dialog.querySelector<HTMLButtonElement>('[data-bedrock-dialog-close]')!
      close.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await new Promise((resolve) => requestAnimationFrame(resolve))
      return dialog.querySelector('[data-testid="field"]') !== null
    })

    expect(stillThere).toBe(true)
    await expect(page.getByTestId('field')).toHaveCount(0)
  })
})
