import {installWebGLDrawCounters,sampleWebGLDraws} from './webgl-draws'
import {test,expect} from '@playwright/test'
test('crossing families preserve both Ring directions and the paused clock',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 await page.getByRole('button',{name:'Ring & crossings'}).click()
 const counts=await page.locator('.direction-grid strong').allTextContents()
 for(const name of ['North–south','East–west','U-Bahn + tram','All crossings']){
  await page.getByRole('button',{name,exact:true}).click()
  await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.getByTestId('clock')).toHaveText('08:00')
  expect(await page.locator('.direction-grid strong').allTextContents()).toEqual(counts)
 }
 await page.getByRole('slider',{name:'Geography to circulation'}).fill('1')
 await page.getByRole('checkbox',{name:'Spree & canals'}).check()
 await expect(page.getByText('Fades as geography becomes a diagram')).toBeVisible()
 await page.getByRole('checkbox',{name:'Spree & canals'}).uncheck()
 await page.getByRole('slider',{name:'Geography to circulation'}).fill('0')
 await expect(page.getByTestId('clock')).toHaveText('08:00')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
test('optional water failure leaves the network and station usable',async({page})=>{
 await page.route('**/berlin-water.json',route=>route.fulfill({status:503,body:'Unavailable'}))
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 const waterToggle=page.locator('.map-context input');await waterToggle.waitFor()
 if(!await waterToggle.isDisabled())await waterToggle.check()
 await expect(page.getByRole('checkbox',{name:'Water unavailable'})).toBeDisabled()
 await expect(page.locator('canvas')).toBeVisible()
 await page.getByRole('button',{name:'Ostkreuz',exact:false}).click()
 await expect(page.getByRole('combobox',{name:'Choose platform'})).toBeVisible()
})

test('full circulation submits no fully transparent map draws',async({page})=>{
 await page.addInitScript(installWebGLDrawCounters)
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 await page.getByRole('button',{name:'Ring & crossings'}).click()
 await page.getByRole('slider',{name:'Geography to circulation'}).fill('1')
 await expect.poll(async()=>{const sample=await page.evaluate(sampleWebGLDraws);return sample.draws>0&&sample.zeroOpacityDraws===0}).toBe(true)
})
