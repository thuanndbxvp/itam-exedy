import { expect, test } from '@playwright/test'

test.describe('Login flow', () => {
  test('ADMIN login thành công và vào trang assets', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
    await page.getByLabel('Mật khẩu').fill('password123')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()

    await expect(page).toHaveURL(/\/assets$/)
  })

  test('sai mật khẩu hiển thị lỗi thân thiện', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
    await page.getByLabel('Mật khẩu').fill('wrong-password')
    await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()

    await expect(page.getByText('Email hoặc mật khẩu không đúng.')).toBeVisible()
  })

  test('anonymous truy cập assets bị chuyển về login', async ({ page }) => {
    await page.goto('/assets')

    await expect(page).toHaveURL(/\/login/)
  })
})
