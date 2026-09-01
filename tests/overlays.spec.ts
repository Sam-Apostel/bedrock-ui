import { expect, test, type Page } from '@playwright/test'

test.describe('Popover', () => {
  test('the invoker opens it into the top layer', async ({ page }) => {
    await page.goto('/?case=popover')
    const content = page.getByTestId('content')

    await expect(content).toBeHidden()
    await page.getByTestId('trigger').click()

    await expect(content).toBeVisible()
    expect(await content.evaluate((node) => node.matches(':popover-open'))).toBe(true)
    await expect(page.getByTestId('log')).toHaveText('true')
  })

  test('the trigger gets implicit aria-expanded from the platform', async ({ page }) => {
    await page.goto('/?case=popover')
    const trigger = page.getByTestId('trigger')

    // Not an attribute we write — this is the browser deriving it from the
    // invoker relationship, which a dialog invoker does not get.
    expect(await trigger.evaluate((node) => node.getAttribute('aria-expanded'))).toBeNull()
    await expect(trigger).toHaveAttribute('command', 'toggle-popover')

    await trigger.click()

    // Read the accessibility tree directly; the attribute really is absent and
    // the state really is exposed.
    const client = await page.context().newCDPSession(page)
    await client.send('Accessibility.enable')
    const { root } = await client.send('DOM.getDocument')
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '[data-testid="trigger"]',
    })
    const { nodes } = await client.send('Accessibility.getPartialAXTree', { nodeId })
    const expanded = nodes[0]?.properties?.find((property) => property.name === 'expanded')

    expect(expanded?.value.value).toBe(true)
  })

  test('anchor positioning puts it under its trigger, not in the middle of the page', async ({
    page,
  }) => {
    await page.goto('/?case=popover')
    await page.getByTestId('trigger').click()

    const trigger = (await page.getByTestId('trigger').boundingBox())!
    const content = (await page.getByTestId('content').boundingBox())!

    // side="bottom": below the trigger, with the 8px offset.
    expect(content.y).toBeGreaterThan(trigger.y + trigger.height - 1)
    expect(content.y).toBeLessThan(trigger.y + trigger.height + 20)
    // align="start": left edges line up.
    expect(Math.abs(content.x - trigger.x)).toBeLessThan(2)
  })

  test('light dismiss closes it, and closing resets its content', async ({ page }) => {
    await page.goto('/?case=popover')

    await page.getByTestId('trigger').click()
    await page.getByTestId('field').fill('typed')

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content')).toBeHidden()
    await expect(page.getByTestId('log')).toHaveText('true,false')

    // Hidden is not yet unmounted: the subtree survives the exit transition on
    // purpose, and reopening inside that window reuses it. Wait for it to go,
    // or this races the behaviour the next test asserts.
    await expect(page.getByTestId('field')).toHaveCount(0)

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('field')).toHaveValue('')
  })

  test('a controlled popover refuses the open outright', async ({ page }) => {
    await page.goto('/?case=refused-popover')

    await page.getByTestId('trigger').click()
    await page.getByTestId('trigger').click()

    await expect(page.getByTestId('attempts')).toHaveText('2')
    // beforetoggle is cancelable for a popover, so it never opened at all —
    // no revert, no frame of visible movement.
    expect(
      await page.getByTestId('content').evaluate((node) => node.matches(':popover-open')),
    ).toBe(false)
  })
})

test.describe('Tooltip', () => {
  test('opens on hover after the delay and closes on leave', async ({ page }) => {
    await page.goto('/?case=tooltip')
    const content = page.getByTestId('content')

    await expect(content).toBeHidden()
    await page.getByTestId('trigger').hover()
    await expect(content).toBeVisible()

    await page.mouse.move(0, 0)
    await expect(content).toBeHidden()
  })

  test('opens on keyboard focus too', async ({ page }) => {
    await page.goto('/?case=tooltip')

    await page.getByTestId('trigger').focus()
    await expect(page.getByTestId('content')).toBeVisible()

    await page.getByTestId('trigger').blur()
    await expect(page.getByTestId('content')).toBeHidden()
  })

  test('describes the trigger rather than naming it', async ({ page }) => {
    await page.goto('/?case=tooltip')
    const trigger = page.getByTestId('trigger')

    const describedBy = await trigger.getAttribute('aria-describedby')
    await expect(page.getByTestId('content')).toHaveAttribute('id', describedBy!)
    await expect(page.getByTestId('content')).toHaveAttribute('role', 'tooltip')
  })
})

test.describe('HoverCard', () => {
  test('an anchor can be the trigger, which is what link previews need', async ({ page }) => {
    await page.goto('/?case=hover-card')
    const trigger = page.getByTestId('trigger')

    expect(await trigger.evaluate((node) => node.tagName)).toBe('A')

    await trigger.hover()
    await expect(page.getByTestId('content')).toBeVisible()
  })

  test('stays open while the pointer is inside it', async ({ page }) => {
    await page.goto('/?case=hover-card')

    await page.getByTestId('trigger').hover()
    await expect(page.getByTestId('content')).toBeVisible()

    await page.getByTestId('inner-link').hover()
    await expect(page.getByTestId('content')).toBeVisible()
  })
})

/**
 * The content of a popover-backed primitive mounts on `beforetoggle` and stays
 * until it closes.
 *
 * Regression: `useOpenState` asked `:open`, which does not match an open
 * popover in Chrome, so `settle()` concluded a frame later that the element was
 * closed and unmounted the children under it. The popover stayed open and
 * empty, collapsing to the width of nothing — a flicker open followed by a jump
 * to the smallest possible size.
 *
 * The faulty read affected every popover-backed primitive, but only Tooltip and
 * HoverCard showed it. It is a race between the queued `toggle` event, which
 * sets the flag back, and the `requestAnimationFrame` in `settle`, which clears
 * it — and the two land in a different order when `showPopover()` is called
 * from a timer than from a click. So the hover card test below is the one that
 * discriminates; the popover one is a guard that does not currently reproduce,
 * and is kept because the underlying read is shared.
 *
 * Measured across frames rather than asserted once, because the failure is that
 * the first frame is right and the second is not.
 */
interface Frame {
  open: boolean
  kids: number
  width: number
}

declare global {
  interface Window {
    bedrockFrames?: Frame[]
  }
}

/**
 * Records every animation frame from *before* the thing is opened.
 *
 * Sampling after an `expect(...).toBeVisible()` is what an earlier version of
 * this did, and it caught nothing: waiting for visibility already consumes the
 * frames where the subtree is torn down, so the bad frame is gone by the time
 * the first sample is taken.
 */
async function record(page: Page, selector: string) {
  await page.evaluate((target) => {
    window.bedrockFrames = []
    const tick = () => {
      const node = document.querySelector<HTMLElement>(target)
      if (node) {
        window.bedrockFrames?.push({
          open: node.matches(':popover-open'),
          kids: node.childElementCount,
          width: Math.round(node.getBoundingClientRect().width),
        })
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, selector)
}

async function openFrames(page: Page) {
  const frames = await page.evaluate(() => window.bedrockFrames ?? [])
  return frames.filter((frame) => frame.open)
}

test.describe('open content stays mounted', () => {
  test('a hover card never has an open, empty frame', async ({ page }) => {
    await page.goto('/?case=hover-card')
    await record(page, '[data-testid="content"]')

    await page.getByTestId('trigger').hover()
    await expect(page.getByTestId('content')).toBeVisible()
    await page.waitForTimeout(500)

    const frames = await openFrames(page)

    expect(frames.length).toBeGreaterThan(4)
    // Open with no children is the bug, whether it lasts one frame or forever.
    expect(frames.filter((frame) => frame.kids === 0)).toEqual([])
  })

  test('a popover never has an open, empty frame', async ({ page }) => {
    await page.goto('/?case=popover')
    await record(page, '[data-testid="content"]')

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('content')).toBeVisible()
    await page.waitForTimeout(500)

    const frames = await openFrames(page)

    expect(frames.length).toBeGreaterThan(4)
    expect(frames.filter((frame) => frame.kids === 0)).toEqual([])
  })

  test('the DOM open state is read through :popover-open, not just :open', async ({ page }) => {
    await page.goto('/?case=popover')
    await page.getByTestId('trigger').click()

    // Pins the platform fact the fix rests on. If a future Chrome makes `:open`
    // match popovers, this failing is the signal that the workaround can go.
    const support = await page.getByTestId('content').evaluate((node) => ({
      popoverOpen: node.matches(':popover-open'),
      colonOpen: node.matches(':open'),
    }))

    expect(support.popoverOpen).toBe(true)
    expect(support.colonOpen).toBe(false)
  })
})
