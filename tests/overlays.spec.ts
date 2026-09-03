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

/**
 * A long press, driven through the protocol rather than through Playwright's
 * touchscreen, because `tap()` is a tap and the whole gesture here is the hold.
 * Real touch events, so the pointer events the library listens to carry
 * `pointerType: 'touch'` and the browser produces the click a lift produces.
 */
async function hold(page: Page, testId: string, ms: number, drift = 0) {
  const cdp = await page.context().newCDPSession(page)
  const box = (await page.getByTestId(testId).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  if (drift) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + drift }],
    })
  }
  await page.waitForTimeout(ms)

  return async () => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  }
}

async function press(page: Page, testId: string, ms: number, drift = 0) {
  const release = await hold(page, testId, ms, drift)
  await release()
}

/**
 * Open right now, with no retrying. The press timers are still running while a
 * test asserts, so a retried expectation would happily wait for a panel that
 * was supposed to stay shut.
 */
function openNow(page: Page) {
  return page.evaluate(
    () => document.querySelector('[data-testid="content"]')?.matches(':popover-open') === true,
  )
}

/** True where `interestfor` is the browser's, which is what decides the path. */
async function hasInterestInvokers(page: Page) {
  return page.evaluate(() => 'interestForElement' in HTMLButtonElement.prototype)
}

/**
 * A touch screen has no hover, and the platform's answer is a long press — the
 * gesture iOS uses for its own link previews and the one `interestfor` is
 * specified to answer. A tap stays a tap: a tooltip that opens on tap is a
 * popover with extra steps.
 *
 * The attribute is taken away before the page loads, so these drive the
 * JavaScript path on any browser. That is not a workaround for the test runner:
 * it is the path every WebKit engine takes, iOS included, and the one this
 * gesture was written for. What the browsers that *do* have the attribute leave
 * behind is the describe below.
 */
test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test.beforeEach(async ({ page }) => {
    // Exactly what `capabilities.ts` reads, and nothing else.
    await page.addInitScript(() => {
      delete (HTMLButtonElement.prototype as { interestForElement?: unknown }).interestForElement
    })
  })

  test('a tooltip is held up while you press, and goes when you let go', async ({ page }) => {
    await page.goto('/?case=tooltip')
    const content = page.getByTestId('content')

    await expect(content).toBeHidden()
    const release = await hold(page, 'trigger', 700)
    expect(await openNow(page)).toBe(true)

    await release()

    await expect(content).toBeHidden()
    // The press was a peek, so the button it was pressing never fired.
    await expect(page.getByTestId('clicks')).toHaveText('0')
  })

  test('a hover card stays after the lift, because it is somewhere to go', async ({ page }) => {
    await page.goto('/?case=hover-card')
    const content = page.getByTestId('content')

    await press(page, 'trigger', 700)

    // The lift is a pointerup outside every open popover, so this is also the
    // assertion that light dismiss did not take back what the press opened.
    await expect(content).toBeVisible()
  })

  test('an info icon opens almost at once; a button waits out the tap', async ({ page }) => {
    // Nothing happens when you tap an icon, so there is no tap to protect.
    await page.goto('/?case=tooltip-icon')
    const lift = await hold(page, 'trigger', 200)
    expect(await openNow(page)).toBe(true)
    await lift()

    // The same hold on a trigger that does something is still inside the window
    // where it might have been a tap, so nothing has opened yet.
    await page.goto('/?case=tooltip')
    const release = await hold(page, 'trigger', 200)
    expect(await openNow(page)).toBe(false)
    await release()
  })

  test('a tap activates the trigger and opens nothing', async ({ page }) => {
    await page.goto('/?case=tooltip')

    await press(page, 'trigger', 100)

    await expect(page.getByTestId('clicks')).toHaveText('1')
    // Long enough for the delay, the close delay and the focus that a tap
    // leaves behind on Android to have each had their chance.
    await page.waitForTimeout(300)
    await expect(page.getByTestId('content')).toBeHidden()
  })

  test('a finger that drifts is scrolling, and opens nothing', async ({ page }) => {
    await page.goto('/?case=tooltip')

    await press(page, 'trigger', 700, 40)

    await expect(page.getByTestId('content')).toBeHidden()
  })

  test('a long press on a link previews it instead of following it', async ({ page }) => {
    await page.goto('/?case=hover-card')
    const url = page.url()

    await press(page, 'trigger', 700)

    await expect(page.getByTestId('content')).toBeVisible()
    expect(page.url()).toBe(url)
  })

  test('the lift never paints the card closed on its way back', async ({ page }) => {
    await page.goto('/?case=hover-card')
    await record(page, '[data-testid="content"]')

    await press(page, 'trigger', 700)
    await expect(page.getByTestId('content')).toBeVisible()
    await page.waitForTimeout(300)

    // Light dismiss closes it on the lift and the same task opens it again, so
    // the closed state exists but is never painted. Every frame from the first
    // open one onwards is open, or the gesture flickers on a real phone.
    const frames = await page.evaluate(() => window.bedrockFrames ?? [])
    const opened = frames.findIndex((frame) => frame.open)

    expect(opened).toBeGreaterThanOrEqual(0)
    expect(frames.slice(opened).filter((frame) => !frame.open)).toEqual([])
  })

  test('tapping elsewhere dismisses what the press opened', async ({ page }) => {
    await page.goto('/?case=hover-card')
    await press(page, 'trigger', 700)
    await expect(page.getByTestId('content')).toBeVisible()

    // Light dismiss, which is the popover's own and not ours.
    await page.touchscreen.tap(10, 10)
    await expect(page.getByTestId('content')).toBeHidden()
  })
})

/**
 * `popover` is an enumerated attribute whose invalid-value default is manual, so
 * `hint` on an engine that does not have it is not a tooltip that layers badly —
 * it is a tooltip nothing dismisses. Every WebKit engine is that engine today.
 *
 * Emulated rather than skipped: the capability test is made to answer no, and
 * any `hint` that still reaches an element is turned into the `manual` such an
 * engine would have read it as. A tooltip that cannot be tapped away then fails
 * here rather than on someone's phone.
 */
test.describe('where the browser has no hint popovers', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      delete (HTMLButtonElement.prototype as { interestForElement?: unknown }).interestForElement

      // The property, so the capability test answers no; the attribute, so any
      // `hint` that still gets written lands as the manual such an engine reads.
      const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'popover')!

      Object.defineProperty(HTMLElement.prototype, 'popover', {
        ...descriptor,
        set(value: unknown) {
          descriptor.set?.call(this, value === 'hint' ? 'manual' : value)
        },
      })

      const setAttribute = Element.prototype.setAttribute
      Element.prototype.setAttribute = function (name: string, value: string) {
        setAttribute.call(this, name, name === 'popover' && value === 'hint' ? 'manual' : value)
      }
    })
  })

  test('the tooltip asks for auto instead', async ({ page }) => {
    await page.goto('/?case=tooltip')

    await expect(page.getByTestId('content')).toHaveAttribute('popover', 'auto')
  })

  test('and Escape still closes it, which manual would not', async ({ page }) => {
    await page.goto('/?case=tooltip')
    const content = page.getByTestId('content')

    await page.getByTestId('trigger').focus()
    await expect(content).toBeVisible()

    // The whole cost of the wrong attribute, in one key: a manual popover is
    // dismissed by nothing at all, so this is the assertion that fails on every
    // WebKit engine when the fallback is not asked for.
    await page.keyboard.press('Escape')
    await expect(content).toBeHidden()
  })
})

/**
 * Where the browser answers the hold itself, the panel is its own — and so is
 * dismissing it on the lift. What it does not do is stop the click that lift
 * produces, so the gesture previews the link and then follows it. That half is
 * ours, and it is all that is asserted here.
 */
test.describe('on a touch screen, with the platform doing intent', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('a long press neither follows the link nor activates the trigger', async ({ page }) => {
    await page.goto('/?case=hover-card')
    test.skip(!(await hasInterestInvokers(page)), 'the browser has no interest invokers')

    const url = page.url()
    await press(page, 'trigger', 700)

    expect(page.url()).toBe(url)
    await expect(page.getByTestId('content')).toBeAttached()
  })

  test('a tap still activates the trigger', async ({ page }) => {
    await page.goto('/?case=tooltip')
    test.skip(!(await hasInterestInvokers(page)), 'the browser has no interest invokers')

    await press(page, 'trigger', 100)

    await expect(page.getByTestId('clicks')).toHaveText('1')
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
