import {test,expect} from '@playwright/test'

test('Ostkreuz travel reverses continuously and preserves the chosen city composition',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/')
 await page.getByRole('button',{name:'Pause playback'}).click()
 await page.getByRole('slider',{name:'Study time',exact:true}).fill('29400')
 await page.getByRole('button',{name:'Ring & crossings'}).click()
 await page.getByRole('button',{name:'East–west',exact:true}).click()
 await page.getByRole('button',{name:'S41 clockwise only',exact:true}).click()
 await page.getByRole('slider',{name:'Geography to circulation'}).fill('0.8')
 await page.getByRole('button',{name:'Ostkreuz',exact:false}).click()
 const travel=page.getByTestId('interchange-travel')
 await expect.poll(async()=>{const p=Number(await travel.getAttribute('data-progress'));return p>0.2&&p<0.8}).toBe(true)
 await expect(page.getByTestId('network-scene')).toBeAttached()
 await page.getByRole('button',{name:'Ring & crossings'}).click()
 await expect(travel).toHaveCount(0)
 await expect(page.getByRole('slider',{name:'Geography to circulation'})).toHaveValue('0.8')
 await expect(page.getByRole('button',{name:'East–west',exact:true})).toHaveAttribute('aria-pressed','true')
 await expect(page.getByRole('button',{name:'S41 clockwise only',exact:true})).toHaveAttribute('aria-pressed','true')
 await page.getByRole('button',{name:'Ostkreuz',exact:false}).click()
 await expect(travel).toHaveAttribute('data-progress','1.000',{timeout:15000})
 await expect(page.getByTestId('network-scene')).toHaveCount(0)
 await expect(page.getByRole('combobox',{name:'Choose platform'})).toBeVisible()
 await expect(page.getByTestId('clock')).toHaveText('08:10')
 await page.getByRole('button',{name:'The ring',exact:false}).click()
 await expect(travel).toHaveCount(0,{timeout:15000})
 await expect(page.getByTestId('clock')).toHaveText('08:10')
})

test('station loading failure retains the city and can be retried',async({page})=>{
 let fail=true
 await page.route('**/ostkreuz.json',route=>fail?route.fulfill({status:503,body:'Unavailable'}):route.continue())
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 await page.getByRole('button',{name:'Ostkreuz',exact:false}).click()
 await expect(page.getByRole('alert')).toContainText('Unable to load Ostkreuz')
 await expect(page.getByTestId('network-scene')).toBeVisible()
 fail=false;await page.getByRole('button',{name:'Try again',exact:true}).click()
 await expect(page.getByRole('combobox',{name:'Choose platform'})).toBeVisible()
 await expect(page.getByTestId('interchange-travel')).toHaveAttribute('data-progress','1.000')
 await expect(page.getByTestId('clock')).toHaveText('08:00')
})

test('zoom reveals additional station label textures without enabling train labels',async({page})=>{
 await page.addInitScript(()=>{
  const names=new Set<string>();Object.assign(window,{__drawnLabelNames:names})
  const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(text,...args:Parameters<typeof original> extends [string,...infer P]?P:never){names.add(text);return original.call(this,text,...args)}
 })
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 await page.getByRole('button',{name:'Ring & crossings'}).click()
 const names=()=>page.evaluate(()=>[...(window as unknown as {__drawnLabelNames:Set<string>}).__drawnLabelNames])
 await expect.poll(async()=>(await names()).length).toBeGreaterThan(2)
 await page.waitForTimeout(800)
 const overview=new Set(await names())
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Zoom in',exact:true}).click()
 await expect.poll(async()=>(await names()).filter(n=>!overview.has(n)&&!/^S\d|^U\d|^M\d/.test(n)).length,{timeout:15000}).toBeGreaterThan(2)
 await expect(page.getByRole('button',{name:'Train labels',exact:true})).toHaveAttribute('aria-pressed','false')
})

test('a slow station source leaves the city visible until arrival is ready',async({page})=>{
 let release!:()=>void
 const ready=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/ostkreuz.json',async route=>{await ready;await route.continue()})
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
 await page.getByRole('button',{name:'Ostkreuz',exact:false}).click()
 await expect(page.getByRole('status').filter({hasText:'Preparing Ostkreuz'})).toContainText('Preparing Ostkreuz')
 await expect(page.getByTestId('interchange-travel')).toHaveAttribute('data-progress','0.000')
 await expect(page.getByTestId('network-scene')).toBeVisible()
 await page.getByRole('slider',{name:'Study time',exact:true}).fill('30000')
 release()
 await expect(page.getByRole('combobox',{name:'Choose platform'})).toBeVisible()
 await expect(page.getByTestId('clock')).toHaveText('08:20')
})
