import { expect, test } from '@playwright/test'

test.describe('Dialog, plain root', () => {
  test('the trigger opens it, modally, with no JS in the open path', async ({ page }) => {
    await page.goto('/?case=plain')
    const dialog = page.locator('dialog')

    await expect(dialog).toHaveJSProperty('open', false)
    await page.getByRole('button', { name: 'Delete project' }).click()

    await expect(dialog).toHaveJSProperty('open', true)
    // :modal is the difference between showModal() and the `open` attribute —
    // top layer, backdrop, inert background.
    await expect(dialog).toMatchAriaSnapshot(`
      - dialog "Delete project?":
        - heading "Delete project?" [level=2]
    `)
    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)
  })

  test('reports open state through onOpenChange without owning it', async ({ page }) => {
    await page.goto('/?case=plain')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByTestId('log')).toHaveText('true')

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('log')).toHaveText('true,false')
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)
  })

  test('Escape closes it and is reported', async ({ page }) => {
    await page.goto('/?case=plain')

    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', true)

    await page.keyboard.press('Escape')
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)
    await expect(page.getByTestId('log')).toHaveText('true,false')
  })

  test('the trigger is keyboard operable, which is the point of requiring a button', async ({
    page,
  }) => {
    await page.goto('/?case=plain')

    await page.getByRole('button', { name: 'Delete project' }).focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('dialog')).toHaveJSProperty('open', true)
  })

  test('defaultOpen opens on mount', async ({ page }) => {
    await page.goto('/?case=default-open')
    const dialog = page.locator('dialog')

    await expect(dialog).toHaveJSProperty('open', true)
    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)
  })

  test('title and description are wired to the dialog', async ({ page }) => {
    await page.goto('/?case=default-open')
    const dialog = page.locator('dialog')

    const labelledBy = await dialog.getAttribute('aria-labelledby')
    const describedBy = await dialog.getAttribute('aria-describedby')

    await expect(page.locator('[data-bedrock-dialog-title]')).toHaveAttribute('id', labelledBy!)
    await expect(page.locator('[data-bedrock-dialog-description]')).toHaveAttribute(
      'id',
      describedBy!,
    )
  })
})

test.describe('asChild', () => {
  test('keeps the child element and its props, and still wires the invoker', async ({ page }) => {
    await page.goto('/?case=aschild')

    const trigger = page.getByRole('button', { name: 'Delete project' })
    await expect(trigger).toHaveAttribute('data-fancy', '')
    await expect(trigger).toHaveAttribute('command', 'show-modal')

    await trigger.click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', true)

    // Title asChild renders the consumer's heading level, keeping our id.
    await expect(page.locator('h1')).toHaveAttribute('data-bedrock-dialog-title', '')

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)
  })
})
