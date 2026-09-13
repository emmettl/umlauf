import { test, expect } from '@playwright/test'

test('a map station opens a responsive departure card and selects a train', async ({ page }) => {
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.setViewportSize({width:1440,height:1000})
 await page.goto('/')
 await expect(page.locator('canvas')).toBeVisible()
 // Westkreuz label in the fixed opening composition. Open it before testing the phone layout.
 await expect(async () => {
   await page.mouse.click(450, 563)
   await expect(page.locator('.station-card')).toBeVisible()
 }).toPass({timeout:15000})
 await page.setViewportSize({width:390,height:844})
 const card = page.locator('.station-card')
 await expect(card.locator('.ms-dot-matrix-board')).toBeVisible()
 expect(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true)
 await expect(card.locator('tbody button').first()).toBeVisible()
 await card.screenshot({path:'test-results/station-hero.png'})
 await card.locator('tbody button').first().click()
 await expect(card.locator('button[aria-pressed="true"]')).toHaveCount(1)
 await page.getByRole('button',{name:'Close station'}).click()
 await expect(card).toHaveCount(0)
})
