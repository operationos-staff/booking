const { test, expect } = require('@playwright/test')

const EMAIL    = process.env.TEST_EMAIL    || ''
const PASSWORD = process.env.TEST_PASSWORD || ''

// Helper: log in and wait for calculator
async function login(page, email, password) {
  await page.goto('/')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('.login-btn')
  await expect(page.locator('text=Пакеты туров')).toBeVisible({ timeout: 20000 })
}

test.describe('Booking portal', () => {

  test('login page renders', async ({ page }) => {
    await page.goto('/')
    // Brand title visible
    await expect(page.locator('text=ОСТРОВ СОКРОВИЩ')).toBeVisible()
    // Auth form visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('.login-btn')).toBeVisible()
  })

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('.login-btn')
    // Error block should appear
    await expect(page.locator('.login-err')).toBeVisible({ timeout: 10000 })
  })

  test('client page renders from tour link (no auth)', async ({ page }) => {
    const data = {
      name: 'Test Client',
      date: '2026-04-01',
      items: [{ name: '8h Standard Tour', type: 'package' }],
      total: 15000,
      gen: '1 апреля 2026',
    }
    const encoded = Buffer.from(encodeURIComponent(JSON.stringify(data))).toString('base64')
    await page.goto(`/?tour=${encoded}`)
    await expect(page.locator('text=Остров Сокровищ')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=15')).toBeVisible()
  })

  // Authenticated tests — only run if credentials provided
  test.describe('authenticated flows', () => {
    test.skip(!EMAIL || !PASSWORD, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run')

    test.beforeEach(async ({ page }) => {
      await login(page, EMAIL, PASSWORD)
    })

    test('calculator page shows packages', async ({ page }) => {
      const pkgItems = page.locator('[class*="tourItem"]')
      await expect(pkgItems.first()).toBeVisible({ timeout: 10000 })
    })

    test('select package shows options section', async ({ page }) => {
      await page.locator('[class*="tourItem"]').first().click()
      await expect(page.locator('text=Дополнительные опции')).toBeVisible()
    })

    test('fill client info and generate link', async ({ page }) => {
      await page.locator('[class*="tourItem"]').first().click()
      await page.fill('input[placeholder="Иван Иванов"]', 'Test Client')
      await page.fill('input[placeholder="+66 XX XXX XXXX"]', '+66 81 000 0000')
      await page.click('text=Создать ссылку')
      // Either link modal or copy toast should appear
      await expect(
        page.locator('text=скопирована').or(page.locator('text=ссылк'))
      ).toBeVisible({ timeout: 10000 })
    })

    test('my calculations page loads', async ({ page }) => {
      await page.click('text=Расчёты')
      await expect(page.locator('text=Мои расчёты')).toBeVisible()
    })

    test('charter page loads', async ({ page }) => {
      await page.click('text=Спидбот туры')
      await expect(
        page.locator('text=Phi Phi').or(page.locator('text=James Bond'))
      ).toBeVisible({ timeout: 10000 })
    })

    test('booking role sees stats page', async ({ page }) => {
      // Only booking role has this button — skip if not visible
      const statsBtn = page.locator('text=Статистика')
      const visible = await statsBtn.isVisible().catch(() => false)
      if (!visible) test.skip()
      await statsBtn.click()
      await expect(page.locator('text=Всего расчётов')).toBeVisible()
    })
  })
})
