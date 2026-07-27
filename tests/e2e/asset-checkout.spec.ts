import { expect, test } from '@playwright/test'

test.describe('Asset checkout flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
    await page.getByLabel('Mật khẩu').fill('password123')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
    await expect(page).toHaveURL(/\/assets$/)
  })

  test('ADMIN mở modal và checkout asset cho user', async ({ page }) => {
    const firstAsset = page.locator('tbody tr').first()
    await firstAsset.hover()
    await firstAsset.getByRole('button', { name: 'Cấp phát' }).click()
    const dialog = page.getByRole('dialog', { name: /Cấp phát asset/ })
    await expect(dialog).toBeVisible()
    await dialog.locator('select').selectOption({ index: 1 })
    await dialog.getByRole('button', { name: 'Xác nhận cấp phát' }).click()

    await expect(page.getByRole('alert')).toContainText('thành công')
  })
})
