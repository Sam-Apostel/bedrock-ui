import { expect, test } from '@playwright/test'

test.describe('markup-only primitives', () => {
  test('Separator states its orientation, and disappears when decorative', async ({ page }) => {
    await page.goto('/?case=markup')

    await expect(page.getByTestId('separator')).toHaveAttribute('role', 'separator')
    await expect(page.getByTestId('separator')).toHaveAttribute('aria-orientation', 'vertical')
    await expect(page.getByTestId('separator-decorative')).toHaveAttribute('role', 'none')
  })

  test('AspectRatio is one element with an aspect-ratio', async ({ page }) => {
    await page.goto('/?case=markup')
    const ratio = page.getByTestId('aspect')

    // Computed as a ratio, not the expression: 16/9 arrives as 1.77778 / 1.
    expect(await ratio.evaluate((node) => getComputedStyle(node).aspectRatio)).toBe('1.77778 / 1')
    expect(await ratio.evaluate((node) => node.children.length)).toBe(0)
  })

  test('Label activates its control, and does not select text on a double click', async ({
    page,
  }) => {
    await page.goto('/?case=markup')

    await page.getByTestId('label').click()
    await expect(page.getByTestId('input')).toBeFocused()

    await page.getByTestId('label').dblclick()
    expect(await page.evaluate(() => String(getSelection()))).toBe('')
  })

  test('VisuallyHidden is invisible but still announced', async ({ page }) => {
    await page.goto('/?case=markup')
    const hidden = page.getByTestId('hidden')

    const box = await hidden.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(1)
    // Still in the accessibility tree — display:none would take it out.
    await expect(page.getByText('Screen readers only')).toBeAttached()
  })

  test('Progress is a real <progress>, determinate and indeterminate', async ({ page }) => {
    await page.goto('/?case=markup')

    const determinate = page.getByTestId('progress')
    expect(await determinate.evaluate((node) => node.tagName)).toBe('PROGRESS')
    await expect(determinate).toHaveJSProperty('value', 40)
    await expect(determinate).toHaveJSProperty('max', 100)
    await expect(determinate).toHaveRole('progressbar')

    // No `value` attribute at all is what makes it indeterminate.
    await expect(page.getByTestId('progress-indeterminate')).not.toHaveAttribute('value')
  })

  test('AccessibleIcon gives the glyph a name in one element', async ({ page }) => {
    await page.goto('/?case=markup')
    const icon = page.getByTestId('icon')

    await expect(icon).toHaveAttribute('role', 'img')
    await expect(icon).toHaveAttribute('aria-label', 'Close')
  })
})

test.describe('Avatar', () => {
  test('shows the fallback when the image fails and hides it when it loads', async ({ page }) => {
    await page.goto('/?case=avatars')

    await expect(page.getByTestId('broken-fallback')).toBeVisible()
    await expect(page.getByTestId('working-fallback')).toHaveCount(0)
    await expect(page.getByTestId('working-image')).toBeVisible()
  })
})

test.describe('Collapsible', () => {
  test('the summary toggles it with no JavaScript in the path', async ({ page }) => {
    await page.goto('/?case=collapsible')
    const root = page.getByTestId('collapsible')

    await expect(root).toHaveJSProperty('open', false)
    await page.getByTestId('collapsible-trigger').click()
    await expect(root).toHaveJSProperty('open', true)
  })

  test('content unmounts on close, so its state resets', async ({ page }) => {
    await page.goto('/?case=collapsible')

    await page.getByTestId('collapsible-trigger').click()
    await page.getByTestId('collapsible-field').fill('typed')

    await page.getByTestId('collapsible-trigger').click()
    await expect(page.getByTestId('collapsible-field')).toHaveCount(0)

    await page.getByTestId('collapsible-trigger').click()
    await expect(page.getByTestId('collapsible-field')).toHaveValue('')
  })

  test('works with JavaScript disabled', async ({ page }) => {
    await page.goto('/ssr?case=collapsible')

    await page.getByTestId('collapsible-trigger').click()
    await expect(page.getByTestId('collapsible')).toHaveJSProperty('open', true)
  })
})

test.describe('Accordion', () => {
  test('single lets the browser close the others', async ({ page }) => {
    await page.goto('/?case=accordion-single')

    await page.getByTestId('header-one').click()
    await expect(page.getByTestId('item-one')).toHaveJSProperty('open', true)

    await page.getByTestId('header-two').click()
    // No effect closed it: <details name> is mutually exclusive in the browser.
    await expect(page.getByTestId('item-one')).toHaveJSProperty('open', false)
    await expect(page.getByTestId('item-two')).toHaveJSProperty('open', true)
  })

  test('multiple leaves them independent', async ({ page }) => {
    await page.goto('/?case=accordion-multiple')

    await page.getByTestId('header-one').click()
    await page.getByTestId('header-two').click()

    await expect(page.getByTestId('item-one')).toHaveJSProperty('open', true)
    await expect(page.getByTestId('item-two')).toHaveJSProperty('open', true)
  })

  test('exclusivity survives with JavaScript disabled', async ({ page }) => {
    await page.goto('/ssr?case=accordion-single')

    await page.getByTestId('header-one').click()
    await page.getByTestId('header-two').click()

    await expect(page.getByTestId('item-one')).toHaveJSProperty('open', false)
    await expect(page.getByTestId('item-two')).toHaveJSProperty('open', true)
  })
})

test.describe('form controls', () => {
  test('Checkbox is an input, with native semantics and indeterminate', async ({ page }) => {
    await page.goto('/?case=form-controls')
    const checkbox = page.getByTestId('checkbox')

    expect(await checkbox.evaluate((node) => node.tagName)).toBe('INPUT')
    await expect(checkbox).toHaveRole('checkbox')

    await checkbox.check()
    await expect(page.getByTestId('log')).toContainText('checkbox:true')

    // Property-only; there is no attribute for it.
    await expect(page.getByTestId('indeterminate')).toHaveJSProperty('indeterminate', true)
  })

  test('Checkbox responds to the space bar without a keydown handler', async ({ page }) => {
    await page.goto('/?case=form-controls')

    await page.getByTestId('checkbox').focus()
    await page.keyboard.press('Space')

    await expect(page.getByTestId('checkbox')).toBeChecked()
  })

  test('Switch is a checkbox announced as a switch', async ({ page }) => {
    await page.goto('/?case=form-controls')
    const control = page.getByTestId('switch')

    await expect(control).toHaveRole('switch')
    await control.check()
    await expect(page.getByTestId('log')).toContainText('switch:true')
  })

  test('RadioGroup gets arrow-key roving focus from the browser', async ({ page }) => {
    await page.goto('/?case=form-controls')

    // One tab stop for the group, and it lands on the checked radio.
    await page.getByTestId('radio-b').focus()
    await expect(page.getByTestId('radio-b')).toBeChecked()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('radio-c')).toBeChecked()
    await expect(page.getByTestId('radio-c')).toBeFocused()
    await expect(page.getByTestId('log')).toContainText('radio:c')

    // Wraps, like a native radio group.
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('radio-a')).toBeChecked()
  })

  test('Toggle is a button with aria-pressed', async ({ page }) => {
    await page.goto('/?case=form-controls')
    const toggle = page.getByTestId('toggle')

    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('log')).toContainText('toggle:true')
  })

  test('a controlled checkbox that refuses stays unchecked', async ({ page }) => {
    await page.goto('/?case=refused-checkbox')

    await page.getByTestId('refused').click()
    await page.getByTestId('refused').click()

    await expect(page.getByTestId('attempts')).toHaveText('2')
    await expect(page.getByTestId('refused')).not.toBeChecked()
  })
})
