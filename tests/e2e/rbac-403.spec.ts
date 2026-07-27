import { expect, test } from '@playwright/test'

test.describe('RBAC UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('nhanvien@congty.com')
    await page.getByLabel('Mật khẩu').fill('password123')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
    await expect(page).toHaveURL(/\/assets$/)
  })

  test('EMPLOYEE không thấy thao tác tạo và checkout asset', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Thêm Tài Sản' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cấp phát' })).toHaveCount(0)
  })
})
