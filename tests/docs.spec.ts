import { expect, test, type Page } from '@playwright/test'

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
  ['alert-dialog.html', 'alert-dialog'],
  ['popover.html', 'popover'],
  ['tooltip.html', 'tooltip'],
  ['menus.html', 'dropdown-menu'],
  ['collapsible.html', 'collapsible'],
  ['accordion.html', 'accordion'],
  ['tabs.html', 'tabs'],
  ['forms.html', 'forms'],
  ['select.html', 'select'],
  ['slider.html', 'slider'],
  ['toast.html', 'toast'],
  ['display.html', 'display'],
  ['shadcn-registry.html', 'registry'],
  ['compat.html', 'compat-timeline'],
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
      // A control, not just any node — and deliberately not `img`, because the
      // display demo's avatar image is *meant* to be hidden: its src 404s, and
      // hiding itself is the fallback behaviour that demo exists to show.
      await expect(stage.locator('button, details, input, select, progress').first()).toBeVisible()

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

/**
 * The four faults found by a reader in the first minute of browsing, each now
 * a test rather than a memory.
 */
test.describe('site chrome', () => {
  test('the current page is a marker in the nav, not a link to itself', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    const here = page.locator('nav .here')
    await expect(here).toHaveText('Dialog')
    await expect(here).toHaveAttribute('aria-current', 'page')
    // The whole point: it is not clickable.
    await expect(page.locator('nav a', { hasText: /^Dialog$/ })).toHaveCount(0)
  })

  // One test per page rather than a loop: these navigate the same tab, so they
  // cannot run in parallel, and a loop of awaits is the thing the linter is
  // right to object to.
  for (const path of ['index.html', 'should-you-switch.html', 'compat.html']) {
    test(`${path} does not link to the site it is served from`, async ({ page }) => {
      await page.goto(`${SITE}/${path}`)

      // An absolute self-link leaves the site and comes back, and breaks on any
      // host that is not the production domain — a preview deploy, or this test.
      await expect(page.locator('a[href^="https://bedrock.sams.land"]')).toHaveCount(0)
    })
  }

  test('the compat page has the site navigation', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    // It used to be copied in verbatim as a standalone document, so there was
    // no way back to the rest of the docs.
    await expect(page.locator('nav .masthead')).toBeVisible()
    await expect(page.locator('nav a[href="./dialog.html"]')).toBeVisible()
  })

  test('the support matrix carries real versions and a live column', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    const invokers = page.locator('tr.floor', { hasText: 'commandfor' })
    await expect(invokers).toBeVisible()
    // The floor, from MDN data rather than from memory.
    await expect(invokers).toContainText('135')
    await expect(invokers).toContainText('144')

    // The probe is filled in by the inline script, in this browser.
    const probe = invokers.locator('.probe')
    await expect(probe).toHaveAttribute('data-state', /yes|no/)
    await expect(probe).not.toHaveText('·')
  })

  test('the prose that was previously overwritten is on the page', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)
    // compat.md rendered to compat.html and was then clobbered by the copy of
    // the hand-written compat.html, so none of this had ever been visible.
    await expect(page.getByText('The stance')).toBeVisible()
    await expect(page.getByRole('heading', { name: /degrades/ })).toBeVisible()
  })
})

/**
 * Moves the slider to one of its stops, through the input rather than around
 * it: the same event React is listening for, so the test drives the widget the
 * way an arrow key does.
 */
const scrubTo = (page: Page, index: number) =>
  page.locator('.tl-range').evaluate((node, value) => {
    const input = node as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, String(value))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, index)

/**
 * The timeline is the compat page's headline, and every claim it makes is
 * checkable: that a component which could not have existed at the selected
 * date is switched off rather than merely greyed, that one built on markup
 * from 2011 never switches off at all, and that the styling belongs to the era
 * rather than to the components.
 */
test.describe('the compat timeline', () => {
  test('opens on the most recent moment that has actually happened', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    await expect(page.locator('.tl-tile')).toHaveCount(15)
    // Past the end are projected dates, which must not be where it opens.
    await expect(page.locator('.tl')).not.toHaveAttribute('data-ahead', 'true')

    const when = await page.locator('.tl-when time').getAttribute('datetime')
    expect(when && when <= new Date().toISOString().slice(0, 10)).toBe(true)
  })

  test('a component that could not exist yet is switched off, not just greyed', async ({
    page,
  }) => {
    await page.goto(`${SITE}/compat.html`)
    await scrubTo(page, 0)

    const dialog = page.locator('.tl-tile', { hasText: 'Dialog' }).first()
    await expect(dialog).toHaveAttribute('data-status', 'dead')
    // 2013: no <dialog>, no invoker commands, so the trigger is inert — which
    // means it cannot be focused, not merely that it looks disabled.
    const focusable = await dialog
      .getByRole('button', { name: 'Rename project' })
      .evaluate((node) => {
        node.focus()
        return document.activeElement === node
      })

    expect(focusable).toBe(false)
  })

  test('a component built on markup that already shipped never switches off', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    const tabs = page.locator('.tl-tile', { hasText: 'Tabs' }).first()
    const statusAt = async (index: number) => {
      await scrubTo(page, index)
      return tabs.getAttribute('data-status')
    }

    // Spread across the whole track, including the first moment on it. Tabs is
    // roving tabindex and nothing else, so there has never been a date at
    // which it did not work.
    expect([
      await statusAt(0),
      await statusAt(12),
      await statusAt(24),
      await statusAt(36),
      await statusAt(48),
    ]).toEqual(['complete', 'complete', 'complete', 'complete', 'complete'])
  })

  test('the styling belongs to the era, and the markup does not change', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    const tile = page.locator('.tl-tile').first()
    const look = () =>
      tile.evaluate((node) => {
        const style = getComputedStyle(node)
        return `${style.backgroundColor} ${style.borderRadius} ${style.boxShadow}`
      })

    await scrubTo(page, 0)
    const flat = await look()
    const markup = await tile.locator('.tl-stage').innerHTML()

    await scrubTo(page, 30)
    expect(await page.locator('.tl').getAttribute('data-era')).not.toBe('flat')
    expect(await look()).not.toBe(flat)
    // Same components, restyled. If this ever differs, the grid is swapping
    // implementations and the page is making a claim it cannot support.
    expect(await tile.locator('.tl-stage').innerHTML()).toBe(markup)
  })

  test('the grid and the table are built from the same file', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)
    await scrubTo(page, 0)

    // The tile names the date the Popover API first shipped anywhere; the table
    // names the version that shipped it. Chrome 114 was released on 30 May
    // 2023, and both of those come out of docs/compat.json.
    await expect(page.locator('.tl-tile', { hasText: 'Popover' }).first()).toContainText(
      '30 May 2023',
    )
    await expect(page.locator('tr.floor', { hasText: 'Popover API' })).toContainText('114')
  })
})

test.describe('shadcn registry gallery', () => {
  test('renders the shipped registry components, not copies', async ({ page }) => {
    await page.goto(`${SITE}/shadcn-registry.html`)

    // shadcn's own markup contract: data-slot survives the swap to bedrock.
    await expect(page.locator('[data-slot="tabs"]')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Account' })).toBeVisible()

    // And the component works, which a screenshot could not show.
    await page.getByRole('button', { name: 'Delete account' }).click()
    const modal = page.locator('dialog')
    await expect(modal).toHaveJSProperty('open', true)
    // Scoped to the dialog: the demo's own source is printed on the page below
    // it, so an unscoped text match finds the string twice.
    await expect(modal.getByText('Delete account?')).toBeVisible()
  })

  test('Tailwind does not reset the documentation around it', async ({ page }) => {
    await page.goto(`${SITE}/shadcn-registry.html`)

    // The gallery loads Tailwind's theme and utilities but deliberately not
    // Preflight, which is a global reset. If it ever creeps back in, headings
    // collapse to body text — cheap to assert, and invisible in a diff.
    const size = await page
      .locator('h1')
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))

    expect(size).toBeGreaterThan(24)
  })
})

/**
 * The gallery's whole argument is that the swap is invisible, so "it rendered"
 * is not enough — it has to render *as shadcn*. These assert the computed
 * result, because every way this broke while it was being built was a cascade
 * problem that looked fine in the source: an unlayered reset beating the
 * utilities it exists to enable, a layer order that put `base` above
 * `utilities`, and a dark `@theme` that Tailwind hoists out of its media query
 * and applies unconditionally.
 */
test.describe('registry gallery matches shadcn', () => {
  test('the tab list and trigger compute to shadcn values', async ({ page }) => {
    await page.goto(`${SITE}/shadcn-registry.html`)

    const list = await page.locator('[data-slot="tabs-list"]').evaluate((node) => {
      const style = getComputedStyle(node)
      return { radius: style.borderRadius, padding: style.padding }
    })
    expect(list).toEqual({ radius: '8px', padding: '3px' })

    // px-2 py-1 rounded-md text-sm. Zero padding here means the reset won.
    const trigger = await page.getByRole('tab', { name: 'Account' }).evaluate((node) => {
      const style = getComputedStyle(node)
      return { padding: style.padding, radius: style.borderRadius, size: style.fontSize }
    })
    expect(trigger).toEqual({ padding: '4px 8px', radius: '6px', size: '14px' })
  })

  test('light mode uses the light theme tokens', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(`${SITE}/shadcn-registry.html`)

    // oklch(0.97) is the light muted; the dark one is oklch(0.269).
    const background = await page
      .locator('[data-slot="tabs-list"]')
      .evaluate((node) => getComputedStyle(node).backgroundColor)

    expect(background).toContain('0.97')
  })
})
