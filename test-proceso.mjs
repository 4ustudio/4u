import { chromium } from '@playwright/test'
const BASE = 'http://localhost:3000'
async function ss(p, n) { await p.screenshot({ path: `/tmp/pr-${n}.png`, fullPage: false }); console.log(`📸 /tmp/pr-${n}.png`) }

;(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })

  // Desktop
  const desk = await browser.newPage()
  await desk.setViewportSize({ width: 1440, height: 900 })
  await desk.goto(`${BASE}/nosotros`)
  await desk.waitForLoadState('networkidle')

  // Scrollar hasta la sección
  await desk.locator('text=Nuestro proceso').first().scrollIntoViewIfNeeded()
  await desk.waitForTimeout(800) // dejar que entren las animaciones

  await ss(desk, '01-desktop-inicial')

  // Hover paso 4 (Grabar)
  await desk.locator('.grid.grid-cols-8 > div').nth(3).hover()
  await desk.waitForTimeout(350)
  await ss(desk, '02-desktop-hover-grabar')

  // Hover último paso
  await desk.locator('.grid.grid-cols-8 > div').last().hover()
  await desk.waitForTimeout(350)
  await ss(desk, '03-desktop-hover-ultimo')

  await desk.close()

  // Mobile
  const mob = await browser.newPage()
  await mob.setViewportSize({ width: 390, height: 844 })
  await mob.goto(`${BASE}/nosotros`)
  await mob.waitForLoadState('networkidle')
  await mob.locator('text=Nuestro proceso').first().scrollIntoViewIfNeeded()
  await mob.waitForTimeout(700)
  await ss(mob, '04-mobile')

  await mob.close()
  await browser.close()
  console.log('\n✅ Done')
})()
