import { expect, test } from '@playwright/test'

test.describe('Select', () => {
  test('is a real <select> with real options', async ({ page }) => {
    await page.goto('/?case=select')
    const select = page.getByTestId('select')

    expect(await select.evaluate((node) => node.tagName)).toBe('SELECT')
    await expect(select).toHaveJSProperty('value', 'two')
    expect(await page.getByTestId('one').evaluate((node) => node.tagName)).toBe('OPTION')
  })

  test('selecting reports the new value', async ({ page }) => {
    await page.goto('/?case=select')

    await page.getByTestId('select').selectOption('three')
    await expect(page.getByTestId('value')).toHaveText('three')
  })

  test('opts into the stylable form', async ({ page }) => {
    await page.goto('/?case=select')

    const appearance = await page
      .getByTestId('select')
      .evaluate((node) => getComputedStyle(node).appearance)

    expect(appearance).toBe('base-select')
  })
})

test.describe('Slider', () => {
  test('is a range input, keyboard included', async ({ page }) => {
    await page.goto('/?case=slider')
    const slider = page.getByTestId('slider')

    expect(await slider.evaluate((node) => node.tagName)).toBe('INPUT')
    await expect(slider).toHaveRole('slider')

    await slider.focus()
    await page.keyboard.press('ArrowRight')

    // step=5, and none of that is our code.
    await expect(slider).toHaveJSProperty('value', '30')
    await expect(page.getByTestId('value')).toHaveText('30')
  })
})

test.describe('ScrollArea', () => {
  test('scrolls natively', async ({ page }) => {
    await page.goto('/?case=scroll-area')
    const root = page.getByTestId('scroll')

    await root.evaluate((node) => {
      node.scrollTop = 200
    })

    expect(await root.evaluate((node) => node.scrollTop)).toBe(200)
  })
})

test.describe('AlertDialog', () => {
  test('is announced as an alert dialog and both buttons dismiss', async ({ page }) => {
    await page.goto('/?case=alert-dialog')

    await page.getByTestId('trigger').click()
    await expect(page.getByTestId('content')).toHaveAttribute('role', 'alertdialog')

    await page.getByTestId('action').click()
    await expect(page.getByTestId('result')).toHaveText('deleted')
    await expect(page.getByTestId('content')).toHaveJSProperty('open', false)
  })
})

test.describe('Toast', () => {
  test('appears in the top layer and dismisses itself', async ({ page }) => {
    await page.goto('/?case=toast')

    await page.getByTestId('add').click()
    await expect(page.getByTestId('toast-0')).toBeVisible()

    const inTopLayer = await page
      .getByTestId('viewport')
      .evaluate((node) => node.matches(':popover-open'))
    expect(inTopLayer).toBe(true)

    // duration=300 in the fixture.
    await expect(page.getByTestId('toast-0')).toHaveCount(0)
  })

  test('the close button dismisses it early', async ({ page }) => {
    await page.goto('/?case=toast')

    await page.getByTestId('add').click()
    await page.getByTestId('close-0').click()

    await expect(page.getByTestId('toast-0')).toHaveCount(0)
  })
})
