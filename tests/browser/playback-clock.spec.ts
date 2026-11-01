import { test, expect } from '@playwright/test'

test('Ostkreuz playback counts foreground stalls and excludes hidden-tab time', async ({ page }) => {
  const instant = new Date('2026-10-18T08:00:00Z')
  await page.clock.install({ time: instant })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Ostkreuz', exact: false }).click()
  await expect(page.getByRole('combobox', { name: 'Choose platform' })).toBeVisible()
  await page.clock.pauseAt(new Date('2026-10-18T08:05:00Z'))
  await page.getByRole('button', { name: 'Play playback', exact: true }).click()
  await page.clock.runFor(32)
  const slider = page.getByRole('slider', { name: 'Study time', exact: true })
  const before = Number(await slider.inputValue())
  // Deliver one delayed frame rather than sixty ordinary callbacks.
  await page.clock.fastForward(1000)
  await expect.poll(async () => Number(await slider.inputValue()) - before).toBeGreaterThan(29)
  expect(Number(await slider.inputValue()) - before).toBeLessThan(31)

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hidden = await slider.inputValue()
  await page.clock.fastForward(60000)
  await expect(slider).toHaveValue(hidden)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(32)
  expect(Number(await slider.inputValue()) - Number(hidden)).toBeLessThanOrEqual(1)
  const resumed = Number(await slider.inputValue())
  // Deliver a known one-second frame interval. runFor can end between RAFs;
  // the range control quantizes that partial interval to whole study seconds.
  await page.clock.fastForward(1000)
  await expect.poll(async () => Number(await slider.inputValue()) - resumed).toBeGreaterThan(29)
  expect(Number(await slider.inputValue()) - resumed).toBeLessThan(31)
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click()
  const paused = await slider.inputValue()
  await page.clock.fastForward(5000)
  await expect(slider).toHaveValue(paused)
})
