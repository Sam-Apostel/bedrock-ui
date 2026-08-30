import { expect, test } from '@playwright/test'

/**
 * Drives the built site rather than a fixture.
 *
 * A demo that compiles, bundles and renders an empty box is the failure this
 * catches: the build is green, the page looks finished, and the thing the page
 * exists to show never appears. Every demo below is asserted to have mounted
 * *and* to do something.
 */
const SITE = 'http://localhost:5174'

/** Every page that embeds a demo, and the demo it should mount. */
const PAGES = [
  ['dialog.html', 'dialog'],
  ['popover.html', 'popover'],
  ['menus.html', 'dropdown-menu'],
  ['accordion.html', 'accordion'],
] as const

test.describe('docs site', () => {
  for (const [page_, demo] of PAGES) {
    test(`${page_} mounts the ${demo} demo`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))

      await page.goto(`${SITE}/${page_}`)

      const stage = page.locator(`[data-demo="${demo}"]`)
      await expect(stage).toBeVisible()

      // The placeholder is replaced by React. Still there means it never ran.
      await expect(stage.locator('.demo-pending')).toHaveCount(0)
      await expect(stage.locator('button, details, input').first()).toBeVisible()

      expect(errors).toEqual([])
    })
  }

  test('the source of each demo is on the page', async ({ page }) => {
    await page.goto(`${SITE}/popover.html`)

    const source = page.locator('.demo-source')
    await expect(source).toBeVisible()
    // Escaped, not executed, and actually the file's contents.
    await expect(source).toContainText('Popover.Content')
  })

  test('a prose page does not load the demo bundle', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))

    await page.goto(`${SITE}/styling.html`)

    expect(requested.some((url) => url.includes('demos.js'))).toBe(false)
  })

  test('the registry the shadcn CLI fetches is served and valid', async ({ request }) => {
    const response = await request.get(`${SITE}/r/dialog.json`)

    expect(response.status()).toBe(200)
    const item = (await response.json()) as { name: string; files: unknown[] }
    expect(item.name).toBe('dialog')
    expect(item.files.length).toBeGreaterThan(0)
  })
})

test.describe('docs demos are interactive', () => {
  test('the dialog demo opens, and its content resets on close', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    await page.getByRole('button', { name: 'Rename project' }).click()
    const dialog = page.locator('dialog')
    await expect(dialog).toHaveJSProperty('open', true)

    await dialog.getByPlaceholder('New name').fill('typed')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveJSProperty('open', false)

    // Closed is not yet unmounted: the subtree survives the exit animation on
    // purpose, and reopening inside that window reuses it. Wait for it to go,
    // or this races the behaviour the page above it documents.
    await expect(dialog.getByPlaceholder('New name')).toHaveCount(0)

    // Reopen: the field is empty because the subtree was discarded.
    await page.getByRole('button', { name: 'Rename project' }).click()
    await expect(dialog.getByPlaceholder('New name')).toHaveValue('')
  })

  test('the popover demo opens into the top layer and dismisses', async ({ page }) => {
    await page.goto(`${SITE}/popover.html`)

    await page.getByRole('button', { name: 'Filters' }).click()
    const content = page.locator('[data-bedrock-popover]')
    await expect(content).toBeVisible()
    expect(await content.evaluate((node) => node.matches(':popover-open'))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(content).toBeHidden()
  })

  test('the accordion demo closes the open item, with no JavaScript involved', async ({ page }) => {
    await page.goto(`${SITE}/accordion.html`)

    const items = page.locator('details')
    await items.nth(0).locator('summary').click()
    await expect(items.nth(0)).toHaveJSProperty('open', true)

    await items.nth(1).locator('summary').click()
    // The shared name is what closes the first one — the browser, not us.
    await expect(items.nth(1)).toHaveJSProperty('open', true)
    await expect(items.nth(0)).toHaveJSProperty('open', false)
  })

  test('the menu demo walks with arrow keys and closes on Escape', async ({ page }) => {
    await page.goto(`${SITE}/menus.html`)

    await page.getByRole('button', { name: 'Actions' }).click()
    const content = page.locator('[data-bedrock-menu]').first()
    await expect(content).toBeVisible()

    // Opening focuses the first item; the menu is one tab stop from there.
    await expect(page.getByRole('menuitem', { name: 'Cut' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: 'Copy' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(content).toBeHidden()
  })
})
