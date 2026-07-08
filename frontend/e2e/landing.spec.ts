import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads and shows the main heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('has navigation links to login and register', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()
  })

  test('clicking Login navigates to /login', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/login"]').first().click()
    await expect(page).toHaveURL(/\/login/)
  })
})
