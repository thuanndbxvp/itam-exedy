import { expect, test } from '@playwright/test'

test.describe('License checkout flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
    await page.getByLabel('Mật khẩu').fill('password123')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
    await expect(page).toHaveURL(/\/assets$/)
  })

  test('ADMIN mở license và cấp seat còn trống', async ({ page }) => {
    await page.goto('/licenses')
    await page.locator('tbody a[href^="/licenses/"]').first().click()
    await page.getByRole('button', { name: 'Cấp Seat' }).first().click()
    const dialog = page.getByRole('dialog', { name: /Cấp License Seat/ })
    await dialog.locator('select').selectOption({ index: 1 })
    await dialog.getByRole('button', { name: 'Xác nhận cấp seat' }).click()

    await expect(page.getByRole('alert')).toContainText('thành công')
  })
})
