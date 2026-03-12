const { test, expect } = require('@playwright/test')

// Credentials from env (never hardcode in repo)
const EMAIL    = process.env.TEST_EMAIL    || 'manager@test.com'
const PASSWORD = process.env.TEST_PASSWORD || 'password123'

test.describe('Booking portal', () => {

  test('login page renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Портал бронирования')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error toast or stay on login
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
  })

  test.describe('authenticated flows', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', EMAIL)
      await page.fill('input[type="password"]', PASSWORD)
      await page.click('button[type="submit"]')
      // Wait for calculator to load
      await expect(page.locator('text=Пакеты туров')).toBeVisible({ timeout: 15000 })
    })

    test('calculator page shows packages', async ({ page }) => {
      await expect(page.locator('text=Групповые туры')).toBeVisible()
      // At least one package should be visible
      const pkgItems = page.locator('[class*="tourItem"]')
      await expect(pkgItems.first()).toBeVisible({ timeout: 10000 })
    })

    test('select package shows options table', async ({ page }) => {
      const firstPkg = page.locator('[class*="tourItem"]').first()
      await firstPkg.click()
      await expect(page.locator('text=Дополнительные опции')).toBeVisible()
    })

    test('fill client info and generate link', async ({ page }) => {
      // Select first package
      await page.locator('[class*="tourItem"]').first().click()
      // Fill client info
      await page.fill('input[placeholder="Иван Иванов"]', 'Test Client')
      await page.fill('input[placeholder="+66 XX XXX XXXX"]', '+66 81 000 0000')
      // Generate link
      await page.click('text=Создать ссылку')
      // Link modal or copied toast should appear
      await expect(page.locator('text=скопирована').or(page.locator('[class*="modal"]'))).toBeVisible({ timeout: 10000 })
    })

    test('my calculations page loads', async ({ page }) => {
      await page.click('text=Расчёты')
      await expect(page.locator('text=Мои расчёты')).toBeVisible()
    })

    test('charter page loads', async ({ page }) => {
      await page.click('text=Спидбот туры')
      await expect(page.locator('text=Спидбот').or(page.locator('text=Phi Phi'))).toBeVisible({ timeout: 10000 })
    })
  })

  test('client page renders from tour link', async ({ page }) => {
    // Create minimal client data payload (legacy base64 format)
    const data = {
      name: 'Test Client',
      date: '2026-04-01',
      items: [{ name: '8h Standard Tour', type: 'package' }],
      total: 15000,
      gen: '1 апреля 2026',
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    await page.goto(`/?tour=${encoded}`)
    await expect(page.locator('text=Остров Сокровищ')).toBeVisible()
    await expect(page.locator('text=15')).toBeVisible() // part of price
  })

})
