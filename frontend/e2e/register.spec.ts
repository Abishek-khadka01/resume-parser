import { test, expect } from '@playwright/test'

test.describe('Register Page', () => {
  test('shows registration form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toHaveCount(2)
  })

  test('password confirmation mismatch shows error', async ({ page }) => {
    await page.goto('/register')
    const emailInput = page.locator('input[type="email"]')
    const passwordInputs = page.locator('input[type="password"]')

    await emailInput.fill('test@example.com')
    await passwordInputs.nth(0).fill('password123')
    await passwordInputs.nth(1).fill('differentpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/register/)
  })

  test('has link to login page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
  })
})
