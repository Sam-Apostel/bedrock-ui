import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Radix's own Dialog test suite, ported.
 *
 * Every test here corresponds one-to-one with a test in
 * `radix-ui/primitives` — `packages/react/dialog/src/dialog.test.tsx` (33 cases)
 * and `e2e/dialog.spec.ts` (9). Titles are theirs, verbatim, so the two suites
 * can be diffed by eye.
 *
 * Three outcomes, and the split is the point:
 *
 *   - passes         — bedrock satisfies the assertion Radix wrote
 *   - test.fail()    — a real behavioural divergence, documented in docs/gaps.md
 *   - test.skip()    — the test exercises API bedrock does not have (Portal,
 *                      Overlay, forceMount, modal={false}, focus-scope branches)
 *
 * A skip is not a pass. The scorecard in docs/radix-parity.md counts all three.
 */

test.describe('given a default Dialog', () => {
  test('should have no accessibility violations in default state', async ({ page }) => {
    await page.goto('/?case=parity-default')
    const { violations } = await new AxeBuilder({ page }).include('#root').analyze()
    expect(violations).toEqual([])
  })

  test('should open the content', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await page.getByText('Open', { exact: true }).click()
    await expect(page.getByText('Close', { exact: true })).toBeVisible()
  })

  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await page.getByText('Open', { exact: true }).click()
    await expect(page.locator('dialog')).toHaveJSProperty('open', true)
    const { violations } = await new AxeBuilder({ page }).include('#root').analyze()
    expect(violations).toEqual([])
  })

  test('should focus the close button', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await page.getByText('Open', { exact: true }).click()
    await expect(page.getByText('Close', { exact: true })).toBeFocused()
  })

  test('should close the content', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await page.getByText('Open', { exact: true }).click()
    await page.keyboard.press('Escape')
    // Radix asserts the close button has left the document. A <dialog> stays in
    // the DOM and is hidden by the UA stylesheet, so the equivalent assertion is
    // that it is no longer visible.
    await expect(page.getByText('Close', { exact: true })).toBeHidden()
  })
})

test.describe('aria-controls', () => {
  test('should not reference a non-existent element while closed', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)
    await expect(page.getByText('Open', { exact: true })).not.toHaveAttribute('aria-controls')
  })

  test('should reference the rendered content while open', async ({ page }) => {
    // DIVERGENCE: the trigger→content relationship is `commandfor`, which the
    // browser resolves natively. No aria-controls is written, and Chrome 141
    // does not expose an implicit one for `show-modal` invokers either — unlike
    // popover invokers, which do get implicit aria-expanded.
    test.fail()
    await page.goto('/?case=parity-default')
    const trigger = page.getByText('Open', { exact: true })
    await trigger.click()
    const id = await page.locator('dialog').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-controls', id!)
  })
})

test.describe('aria-labelledby / aria-describedby references', () => {
  test('should reference `Title` and `Description` when they are rendered', async ({ page }) => {
    await page.goto('/?case=parity-labelled')
    const dialog = page.locator('dialog')

    const labelledBy = await dialog.getAttribute('aria-labelledby')
    const describedBy = await dialog.getAttribute('aria-describedby')
    expect(labelledBy).toBeTruthy()
    expect(describedBy).toBeTruthy()

    await expect(page.locator('[data-bedrock-dialog-title]')).toHaveAttribute('id', labelledBy!)
    await expect(page.locator('[data-bedrock-dialog-title]')).toHaveText('Title')
    await expect(page.locator('[data-bedrock-dialog-description]')).toHaveAttribute(
      'id',
      describedBy!,
    )
  })

  test('should normalize existing aria-describedby ids and append the Description id', async ({
    page,
  }) => {
    // DIVERGENCE: a passed aria-describedby replaces ours rather than merging.
    // Radix collects the ids and dedupes them; bedrock treats the prop as final.
    test.fail()
    await page.goto('/?case=parity-existing-describedby')
    const descriptionId = await page.locator('[data-bedrock-dialog-description]').getAttribute('id')
    await expect(page.locator('dialog')).toHaveAttribute(
      'aria-describedby',
      `existing-description shared-description ${descriptionId}`,
    )
  })

  test('should not set `aria-labelledby` when no `Title` is rendered', async ({ page }) => {
    await page.goto('/?case=parity-custom-label')
    await expect(page.locator('dialog')).not.toHaveAttribute('aria-labelledby')
  })

  test('should not set `aria-describedby` when no `Description` is rendered', async ({ page }) => {
    await page.goto('/?case=parity-title-only')
    await expect(page.locator('dialog')).not.toHaveAttribute('aria-describedby')
  })

  test('should update references when `Title`/`Description` mount and unmount', async ({
    page,
  }) => {
    await page.goto('/?case=parity-toggle-refs')
    const dialog = page.locator('dialog')

    await expect(dialog).not.toHaveAttribute('aria-labelledby')
    await page.getByTestId('toggle').click()
    await expect(dialog).toHaveAttribute('aria-labelledby', /.+/)
    await page.getByTestId('toggle').click()
    await expect(dialog).not.toHaveAttribute('aria-labelledby')
  })
})

test.describe('given a modal Dialog', () => {
  test.skip('should restore `body` pointer-events after closing', () => {
    // N/A: `pointer-events: none` on the body is how Radix makes the background
    // inert. showModal() does it in the UA, with no style to restore.
  })

  test('should not prevent ctrl + wheel (page zoom) while open', async ({ page }) => {
    await page.goto('/?case=parity-default')
    await page.getByText('Open', { exact: true }).click()

    const prevented = await page.locator('dialog').evaluate((node) => {
      const event = new WheelEvent('wheel', {
        ctrlKey: true,
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      })
      node.dispatchEvent(event)
      return event.defaultPrevented
    })

    expect(prevented).toBe(false)
  })
})

test.describe('given a Dialog with `asChild` on the Content', () => {
  test.skip('forwards content props and the ref to the child (modal: true)', () => {
    // N/A: Dialog.Content has no asChild. docs/gaps.md#dialogcontent-has-no-aschild
  })
  test.skip('forwards content props and the ref to the child (modal: false)', () => {
    // N/A: no asChild, and no non-modal dialog.
  })
  test.skip('registers portalled descendants as focus scope branches', () => {
    // N/A: no focus scope. A modal <dialog> inerts everything outside itself, so
    // a portalled branch outside the subtree cannot be focused at all.
  })
  test.skip('still dismisses on escape when slotted', () => {
    // N/A: requires asChild on Content.
  })
})

test.describe('given two overlapping modal Dialogs (forceMount)', () => {
  test.skip('should restore `body` pointer-events after both close', () => {
    // N/A: no forceMount (content is always mounted) and no pointer-events
    // bookkeeping to leak. The bug this regression-tests cannot occur.
  })
})

test.describe('given a modal Dialog containing a nested modal layer (eg. a DropdownMenu)', () => {
  test.skip('does not call `onOpenChange(false)` on a controlled dialog when the nested layer is dismissed by an outside interaction', () => {
    // N/A: requires DismissableLayer and a second primitive. Outside pointer
    // interaction does not dismiss a bedrock dialog at all.
  })
})

const SPREAD_PARTS = ['trigger', 'title', 'description', 'close'] as const

test.describe('Dialog.Trigger', () => {
  test('spreads props it does not consume onto the element it renders', async ({ page }) => {
    // Closed, like Radix's version — an open modal would cover its own trigger.
    await page.goto('/?case=parity-spread-closed')
    const trigger = page.getByTestId('trigger')

    await expect(trigger).toHaveClass(/custom-class/)
    expect(await trigger.evaluate((n) => n.style.outlineColor)).toBe('rgb(1, 2, 3)')
    await expect(trigger).toHaveAttribute('data-ref-attached', '')

    await trigger.click()
    await expect(page.getByTestId('clicks')).toContainText('trigger')
  })

  test('forwards props to the child element when `asChild` is set', async ({ page }) => {
    // DIVERGENCE on one assertion only: Radix also asserts aria-expanded="false".
    // bedrock writes no aria-expanded, and Chrome exposes no implicit one for
    // dialog invokers. Everything else in this test passes.
    test.fail()
    await page.goto('/?case=parity-spread-aschild')
    const trigger = page.getByTestId('trigger')

    expect(await trigger.evaluate((n) => n.tagName)).toBe('BUTTON')
    await expect(trigger).toHaveClass(/custom-class/)
    expect(await trigger.evaluate((n) => n.style.outlineColor)).toBe('rgb(1, 2, 3)')
    await expect(trigger).toHaveAttribute('data-ref-attached', '')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('Dialog.Overlay', () => {
  test.skip('spreads props it does not consume onto the element it renders', () => {
    // N/A: the overlay is ::backdrop, a pseudo-element with no props to spread.
  })
  test.skip('forwards props to the child element when `asChild` is set', () => {
    // N/A: same.
  })
})

test.describe('Dialog.Content', () => {
  test('spreads props it does not consume onto the element it renders', async ({ page }) => {
    await page.goto('/?case=parity-spread')
    const content = page.getByTestId('content')

    await expect(content).toHaveClass(/custom-class/)
    expect(await content.evaluate((n) => n.style.outlineColor)).toBe('rgb(1, 2, 3)')
    await expect(content).toHaveAttribute('data-ref-attached', '')

    await content.click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('clicks')).toContainText('content')
  })

  test.skip('forwards props to the child element when `asChild` is set', () => {
    // N/A: no asChild on Content.
  })
  test.skip('forwards props to the child element when `asChild` is set on a non-modal dialog', () => {
    // N/A: no asChild on Content, no non-modal dialog.
  })
})

for (const part of SPREAD_PARTS.filter((p) => p !== 'trigger')) {
  test.describe(`Dialog.${part[0]!.toUpperCase()}${part.slice(1)}`, () => {
    test('spreads props it does not consume onto the element it renders', async ({ page }) => {
      await page.goto('/?case=parity-spread')
      const element = page.getByTestId(part)

      await expect(element).toHaveClass(/custom-class/)
      expect(await element.evaluate((n) => n.style.outlineColor)).toBe('rgb(1, 2, 3)')
      await expect(element).toHaveAttribute('data-ref-attached', '')
    })

    test('forwards props to the child element when `asChild` is set', async ({ page }) => {
      await page.goto('/?case=parity-spread-aschild')
      const element = page.getByTestId(part)

      await expect(element).toHaveClass(/custom-class/)
      expect(await element.evaluate((n) => n.style.outlineColor)).toBe('rgb(1, 2, 3)')
      await expect(element).toHaveAttribute('data-ref-attached', '')
    })
  })
}

test.describe('e2e: given a modal dialog', () => {
  test('can be open/closed with a keyboard', async ({ page }) => {
    await page.goto('/?case=parity-default')
    const open = page.getByText('Open', { exact: true })
    const close = page.getByText('Close', { exact: true })

    await open.focus()
    await page.keyboard.press('Space')
    await expect(close).toBeVisible()
    await expect(close).toBeFocused()

    await page.keyboard.press('Space')
    await expect(close).toBeHidden()
    await expect(open).toBeFocused()

    await page.keyboard.press('Space')
    await expect(close).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(close).toBeHidden()
  })

  test('can be open/closed with a pointer', async ({ page }) => {
    await page.goto('/?case=parity-default')
    const open = page.getByText('Open', { exact: true })
    const close = page.getByText('Close', { exact: true })

    await open.click()
    await expect(close).toBeVisible()
    await close.click()
    await expect(close).toBeHidden()
  })

  test('keeps focus trapped even if focused element is removed', async ({ page }) => {
    await page.goto('/?case=parity-focus-trap')

    await expect(page.getByTestId('first')).toBeFocused()
    // The fixture removes it on a timer, so focus is genuinely lost rather than
    // moved by the interaction that removes it.
    await expect(page.getByTestId('first')).toHaveCount(0)

    // Focus falls to nothing when its element goes — but the background is
    // inert, so Tab cannot escape into it and lands back inside the dialog.
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('second')).toBeFocused()

    // Cycle right round the dialog's tab order and confirm it never escapes.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const escaped = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'outside',
    )
    expect(escaped).toBe(false)
  })
})

test.describe('e2e: given a non-modal dialog', () => {
  test.skip('can be open/closed with a keyboard', () => {
    // N/A: no modal={false}. A non-modal layer is a different element and will
    // be Popover, not a prop on Dialog.
  })
  test.skip('can be open/closed with a pointer', () => {
    // N/A: same.
  })
})

test.describe('e2e: Dialog with a nested DropdownMenu', () => {
  test.skip('dismissing the dropdown does not close the dialog', () => {
    // N/A: no DropdownMenu primitive yet.
  })
  test.skip('pressing Escape closes only the dropdown', () => {
    // N/A: same. Worth revisiting when it exists — nested close watchers make
    // this the platform's problem rather than ours.
  })
})

test.describe('e2e: Dialog extension overlay interactions', () => {
  test.skip('keeps the dialog open when interacting with a shadow tree inside the dialog', () => {
    // N/A: regression test for DismissableLayer's outside-click detection, which
    // does not exist here — nothing dismisses on outside interaction.
  })
  test.skip('keeps the dialog open when an outside overlay stops later mouse events', () => {
    // N/A: same.
  })
})
