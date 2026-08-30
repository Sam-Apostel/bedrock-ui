import { expect, test } from '@playwright/test'

test.describe('DropdownMenu', () => {
  test('opens, focuses the first item, and walks with arrow keys', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('content')).toBeVisible()
    await expect(page.getByTestId('cut')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('copy')).toBeFocused()

    // The whole menu is one tab stop.
    expect(await page.getByTestId('cut').evaluate((node) => node.tabIndex)).toBe(-1)
    expect(await page.getByTestId('copy').evaluate((node) => node.tabIndex)).toBe(0)
  })

  test('typeahead jumps to a matching item', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('cut')).toBeFocused()
    await page.keyboard.press('s')

    await expect(page.getByTestId('share')).toBeFocused()
  })

  test('Home and End go to the ends', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    // Focus lands on the first item a frame after the popover opens; pressing a
    // key before that sends it to the trigger, which is not what is under test.
    await expect(page.getByTestId('cut')).toBeFocused()

    await page.keyboard.press('End')
    await expect(page.getByTestId('share')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(page.getByTestId('cut')).toBeFocused()
  })

  test('choosing an item runs it and closes the menu', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await page.getByTestId('copy').click()

    await expect(page.getByTestId('chosen')).toHaveText('copy')
    await expect(page.getByTestId('content')).toBeHidden()
  })

  test('Escape closes it, and the platform does the dismissing', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('content')).toBeHidden()
  })

  test('a submenu opens without closing its parent', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await page.getByTestId('share').click()

    // Nesting is the popover stack's rule: the invoker is inside the parent.
    await expect(page.getByTestId('sub-content')).toBeVisible()
    await expect(page.getByTestId('content')).toBeVisible()
  })

  test('ArrowRight opens a submenu from the keyboard', async ({ page }) => {
    await page.goto('/?case=menu')

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('cut')).toBeFocused()

    await page.keyboard.press('End')
    await expect(page.getByTestId('share')).toBeFocused()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByTestId('sub-content')).toBeVisible()
    await expect(page.getByTestId('email')).toBeFocused()
  })
})

test.describe('ContextMenu', () => {
  test('opens at the pointer', async ({ page }) => {
    await page.goto('/?case=context-menu')

    await page.getByText('Right-click me').click({ button: 'right', position: { x: 50, y: 40 } })
    const content = page.getByTestId('content')
    await expect(content).toBeVisible()

    const box = (await content.boundingBox())!
    const area = (await page.getByText('Right-click me').boundingBox())!
    // Anchored to where the pointer was, not to the element or the viewport.
    expect(box.x).toBeGreaterThan(area.x + 30)
    expect(box.y).toBeGreaterThan(area.y + 20)
  })
})

test.describe('Tabs', () => {
  test('arrow keys move selection, and only the selected panel is mounted', async ({ page }) => {
    await page.goto('/?case=tabs')

    await expect(page.getByTestId('panel-one')).toBeVisible()
    await expect(page.getByTestId('panel-two')).toHaveCount(0)

    await page.getByTestId('tab-one').focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByTestId('tab-two')).toBeFocused()
    await expect(page.getByTestId('panel-two')).toBeVisible()
    await expect(page.getByTestId('panel-one')).toHaveCount(0)
  })

  test('panels are wired to their tabs', async ({ page }) => {
    await page.goto('/?case=tabs')

    const controls = await page.getByTestId('tab-one').getAttribute('aria-controls')
    await expect(page.getByTestId('panel-one')).toHaveAttribute('id', controls!)
    await expect(page.getByTestId('tab-one')).toHaveAttribute('aria-selected', 'true')
  })

  test('leaving a tab resets what was in it', async ({ page }) => {
    await page.goto('/?case=tabs')

    await page.getByTestId('field-one').fill('typed')
    await page.getByTestId('tab-two').click()
    await page.getByTestId('tab-one').click()

    await expect(page.getByTestId('field-one')).toHaveValue('')
  })
})

test.describe('Toolbar and ToggleGroup', () => {
  test('one tab stop, arrows across everything in it', async ({ page }) => {
    await page.goto('/?case=toolbar')

    await page.getByTestId('bold').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('italic')).toBeFocused()
  })

  test('toggle items report pressed state', async ({ page }) => {
    await page.goto('/?case=toolbar')

    await page.getByTestId('bold').click()
    await expect(page.getByTestId('bold')).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('italic').click()
    // type="multiple": both stay down.
    await expect(page.getByTestId('bold')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('italic')).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Menubar', () => {
  test('arrows move along the bar and each menu is a popover', async ({ page }) => {
    await page.goto('/?case=menubar')

    await page.getByTestId('file').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('edit')).toBeFocused()

    await page.getByTestId('edit').click()
    await expect(page.getByTestId('edit-menu')).toBeVisible()

    // Opening another closes the first: the popover stack, not a reducer.
    await page.getByTestId('file').click()
    await expect(page.getByTestId('file-menu')).toBeVisible()
    await expect(page.getByTestId('edit-menu')).toBeHidden()
  })
})
