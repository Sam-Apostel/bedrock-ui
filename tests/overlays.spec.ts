import { expect, test } from '@playwright/test'

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
