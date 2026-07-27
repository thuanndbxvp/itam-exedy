import { expect, test } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
    await page.getByLabel('Mật khẩu').fill('password123')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
    await expect(page).toHaveURL(/\/assets$/)
  })

  test('ADMIN xem được danh sách tài sản và điều hướng chính', async ({ page }) => {
    await expect(page.getByPlaceholder('Tìm theo mã thẻ, tên, serial...')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Thêm Tài Sản' })).toBeVisible()
  })
})
