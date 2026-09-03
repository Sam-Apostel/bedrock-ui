import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'

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

/**
 * The source block under a demo: coloured at build time by scripts/highlight.mjs,
 * disclosed by <details>, and copied by eight inline lines of script.
 */
test.describe('demo source blocks', () => {
  test('the source is coloured without a character of it going missing', async ({ page }) => {
    await page.goto(`${SITE}/popover.html`)

    const code = page.locator('.demo-source code')

    // The scanner rewrites the file into spans, so the thing worth asserting is
    // that what comes out still is the file — every character, in order.
    const rendered = await code.evaluate((node) => node.textContent)
    expect(rendered).toBe(readFileSync('demos/cases/popover.tsx', 'utf8').trim())

    await expect(code.locator('.tok-keyword').first()).toHaveText('import')
    await expect(code.locator('.tok-comment')).toHaveCount(1)

    // Prose inside an element is not code, and colouring it as code is the
    // failure mode that made the scanner mode-aware in the first place.
    await expect(code.locator('.tok-type', { hasText: /^Filters$/ })).toHaveCount(0)
  })

  test('the disclosure marker is inside the row rather than against the edge', async ({ page }) => {
    await page.goto(`${SITE}/popover.html`)

    const summary = page.locator('.demo-source summary').first()
    const marker = await summary.evaluate((node) => ({
      display: getComputedStyle(node).display,
      list: getComputedStyle(node).listStyleType,
      chevron: getComputedStyle(node, '::before').content,
    }))

    // A flex summary has no marker box, which is what used to sit outside the
    // padding; the chevron in ::before replaces it inside the row.
    expect(marker.display).toBe('flex')
    expect(marker.list).toBe('none')
    expect(marker.chevron).not.toBe('none')
  })

  test('opening and closing is animated by the browser', async ({ page }) => {
    await page.goto(`${SITE}/popover.html`)

    const details = page.locator('.demo-source').first()

    const content = await details.evaluate((node) => {
      const style = getComputedStyle(node, '::details-content')
      return { property: style.transitionProperty, duration: style.transitionDuration }
    })
    expect(content.property).toContain('block-size')
    // Without the discrete transition the content vanishes on the first frame
    // of the collapse and there is nothing left to animate the height of.
    expect(content.property).toContain('content-visibility')
    expect(content.duration).not.toBe('0s')

    // The content fades in from @starting-style: before it opens there is no
    // rendered box, so that is the only style this transition can start from.
    // The chevron turns at the same time, hence a list rather than the first.
    const started = await details.evaluate(
      (node) =>
        new Promise<string[]>((resolve) => {
          const properties: string[] = []
          node.addEventListener('transitionrun', (event) => {
            properties.push((event as TransitionEvent).propertyName)
          })
          node.querySelector('summary')?.click()
          setTimeout(() => resolve(properties), 300)
        }),
    )
    expect(started).toContain('opacity')
    expect(started).toContain('rotate')

    const opened = await details.evaluate((node) => node.getBoundingClientRect().height)
    await expect(page.locator('.demo-code').first()).toHaveCSS('opacity', '1')
    expect(opened).toBeGreaterThan(100)
  })

  test('the copy button appears with the script and copies the source', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`${SITE}/popover.html`)

    // Shipped hidden: a button that cannot copy is worse than no button, and
    // the inline script is what reveals it.
    const button = page.locator('.demo-copy').first()
    await expect(button).not.toHaveAttribute('hidden')

    await page.locator('.demo-source summary').first().click()
    await expect(button).toBeVisible()
    await button.click()

    await expect(button).toHaveText('Copied')
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe(readFileSync('demos/cases/popover.tsx', 'utf8').trim())
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

  test('the page behind an open dialog does not scroll', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    await page.getByRole('button', { name: 'Rename project' }).click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', true)

    // A wheel over the backdrop, not `scrollBy`: `overflow: hidden` still
    // permits programmatic scrolling, and the gesture is what was getting
    // through. Chrome animates a wheel, so settling is time rather than a frame.
    const wheelMoves = async () => {
      const before = await page.evaluate(() => window.scrollY)
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(300)

      return (await page.evaluate(() => window.scrollY)) !== before
    }

    // `showModal()` makes the background inert to interaction and nothing else.
    expect(await wheelMoves()).toBe(false)

    // And the second half is what makes the first half mean anything: the same
    // gesture, after the dialog closes, on a page that is not locked.
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)

    expect(await wheelMoves()).toBe(true)
  })

  test('the backdrop dims and blurs the page behind it', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    await page.getByRole('button', { name: 'Rename project' }).click()
    const backdrop = page.locator('dialog')

    expect(
      await backdrop.evaluate((node) => {
        const style = getComputedStyle(node, '::backdrop')
        return { background: style.backgroundColor, blur: style.backdropFilter }
      }),
    ).toEqual({ background: 'rgba(0, 0, 0, 0.42)', blur: 'blur(3px)' })

    // The blur is a docs token, and it reaches a pseudo-element at all only
    // because ::backdrop inherits from the element it belongs to. The literal
    // fallback would satisfy the assertion above on its own, so read the
    // property: this is the assertion that the inheritance is what happened.
    expect(
      await backdrop.evaluate((node) =>
        getComputedStyle(node, '::backdrop').getPropertyValue('--backdrop-blur'),
      ),
    ).toBe('3px')
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

  test('a wide screen gets the sidebar itself, not a button to open it', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    // The links are inside a popover that is never opened here. If the rule
    // that hands its box back to the sidebar ever breaks, they all disappear.
    await expect(page.locator('nav a[href="./popover.html"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden()
  })

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

/** Recursive rather than a loop, which the linter is right to object to. */
async function stepRight(range: Locator, times: number): Promise<void> {
  if (times <= 0) return
  await range.press('ArrowRight')
  await stepRight(range, times - 1)
}

/**
 * Moves the slider to one of its stops with the keyboard.
 *
 * The input counts in days, not in stops — that is what puts the playhead where
 * the date is — so setting `value` to an index would land on whatever happened
 * nearest that many days after 2013. Arrow keys are what a reader has, and what
 * the widget intercepts to move by events.
 */
async function scrubTo(page: Page, index: number): Promise<void> {
  const range = page.locator('.tl-range')
  await range.focus()
  await range.press('Home')
  await stepRight(range, index)
}

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

    const when = await page.locator('time.tl-when').getAttribute('datetime')
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

  test('a component with nothing to wait for is marked, not withheld', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)
    await scrubTo(page, 0)

    // Tabs needs no platform feature, which is the strongest form of "you will
    // never have to check this" — so it carries the same mark as a feature that
    // has been everywhere for thirty months, and says why instead of borrowing
    // Baseline's words for it.
    const tabs = page.locator('.tl-tile', { hasText: 'Tabs' }).first()
    await expect(tabs).toHaveAttribute('data-status', 'gold')
    await expect(tabs.locator('.tl-badge')).toHaveText('nothing to wait for')
  })

  test('the axis is drawn in time, not in stops', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)

    const axis = (await page.locator('.tl-ticks').boundingBox()) ?? { x: 0, width: 1 }
    const ticks = await page
      .locator('.tl-tick')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().x))

    // Spread evenly, 40% of the stops would sit in the last 40% of the track.
    // Placed by date, most of them do: almost everything here happened after
    // 2023, and that pile-up is the point of drawing it this way.
    const late = ticks.filter((x) => (x - axis.x) / axis.width > 0.6)

    expect(ticks.length).toBeGreaterThan(40)
    expect(late.length / ticks.length).toBeGreaterThan(0.5)
  })

  test('the header says what the features in the event do, and links MDN', async ({ page }) => {
    await page.goto(`${SITE}/compat.html`)
    await scrubTo(page, 2)

    // 26 Aug 2014: Chrome 37 shipped showModal() and ::backdrop on one day.
    const features = page.locator('.tl-features li')
    await expect(features).toHaveCount(2)
    await expect(features.first()).toContainText('top layer')

    // The link is MDN's own URL for the feature, out of the compat data.
    const href = await features.first().locator('a').getAttribute('href')
    expect(href).toBe('https://developer.mozilla.org/docs/Web/API/HTMLDialogElement/showModal')
  })

  test('a narrow screen gets the whole grid, scaled down', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 900 })
    await page.goto(`${SITE}/compat.html`)
    await expect(page.locator('.tl-grid')).toBeVisible()

    const layout = await page.locator('.tl-grid').evaluate((node) => {
      const style = getComputedStyle(node)
      return { zoom: style.zoom, columns: style.gridTemplateColumns.split(' ').length }
    })

    // Zoomed, not rebuilt: four columns of real components at whatever size
    // fits, rather than a simplified layout that throws the styling away.
    expect(Number(layout.zoom)).toBeLessThan(1)
    expect(layout.columns).toBe(4)
    await expect(page.locator('.tl-tile').first().locator('.tl-stage')).toBeVisible()
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
    ]).toEqual(['gold', 'gold', 'gold', 'gold', 'gold'])
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

/**
 * A phone, which is where both of these were found.
 *
 * `hasTouch` is what makes `pointer: coarse` match, and `isMobile` is what
 * makes the viewport a phone's rather than a small window's — the two media
 * conditions the fixes below are written against.
 */
test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('the navigation is collapsed until it is asked for', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    // Thirty links ahead of the first paragraph is the whole reason for this.
    const links = page.locator('.nav-links')
    await expect(links).toBeHidden()

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(links).toBeVisible()
    expect(await links.evaluate((node) => node.matches(':popover-open'))).toBe(true)
    await expect(links.locator('a[href="./popover.html"]')).toBeVisible()

    // Escape closes it, and the button carries an expanded state in the
    // accessibility tree, because the invoker wiring is what produces both.
    // The site ships no script for either.
    await page.keyboard.press('Escape')
    await expect(links).toBeHidden()
  })

  test('the page behind the open nav does not scroll either', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('.nav-links')).toBeVisible()

    // Parked at the last link, because the panel is a scroller of its own and
    // what it did at its end was hand the rest of the gesture to the page.
    await page.locator('.nav-links').evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    await page.mouse.move(195, 400)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // And over the bar, where the wheel lands on the backdrop rather than on
    // the links.
    await page.mouse.move(195, 30)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('nothing on the page paints over the nav bar', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)

    // The demo source's row, parked under the bar. Its chevron and filename
    // each make a stacking context, which is enough to paint over a sticky bar
    // that has no z-index of its own — and did.
    await page.locator('.demo-source summary').evaluate((node) => {
      window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 20)
    })
    await page.waitForTimeout(200)

    const strangers = await page.evaluate(() => {
      const bar = document.querySelector('nav').getBoundingClientRect()
      const found = new Set()

      for (let x = 4; x < window.innerWidth; x += 6) {
        for (let y = 4; y < bar.bottom - 2; y += 6) {
          const element = document.elementFromPoint(x, y)
          if (element && !element.closest('nav')) found.add(element.className || element.tagName)
        }
      }

      return [...found]
    })

    expect(strangers).toEqual([])
  })

  test('a field is large enough that focusing it does not zoom the page', async ({ page }) => {
    await page.goto(`${SITE}/dialog.html`)
    await page.getByRole('button', { name: 'Rename project' }).click()

    const size = await page
      .getByPlaceholder('New name')
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))

    // Under 16px, iOS Safari zooms the viewport when the field takes focus and
    // never zooms back out. The UA default for a field is a shade under 14px.
    expect(size).toBeGreaterThanOrEqual(16)
  })
})
