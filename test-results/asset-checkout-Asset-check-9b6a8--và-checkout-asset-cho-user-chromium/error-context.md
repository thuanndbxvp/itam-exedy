# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: asset-checkout.spec.ts >> Asset checkout flow >> ADMIN mở modal và checkout asset cho user
- Location: tests\e2e\asset-checkout.spec.ts:12:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/assets$/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased bg-gray-50">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- main:
  - heading "IT Asset Management" [level=2]
  - paragraph: Hệ thống quản lý tài sản nội bộ cấp doanh nghiệp
  - text: Tài khoản Email
  - textbox "Tài khoản Email":
    - /placeholder: admin@congty.com
    - text: admin@congty.com
  - text: Mật khẩu
  - textbox "Mật khẩu":
    - /placeholder: Nhập mật khẩu
    - text: password123
  - button "Đang xác thực..." [disabled]
- alert
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | test.describe('Asset checkout flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login')
  6  |     await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
  7  |     await page.getByLabel('Mật khẩu').fill('password123')
  8  |     await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
> 9  |     await expect(page).toHaveURL(/\/assets$/)
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  10 |   })
  11 | 
  12 |   test('ADMIN mở modal và checkout asset cho user', async ({ page }) => {
  13 |     const firstAsset = page.locator('tbody tr').first()
  14 |     await firstAsset.hover()
  15 |     await firstAsset.getByRole('button', { name: 'Cấp phát' }).click()
  16 |     const dialog = page.getByRole('dialog', { name: /Cấp phát asset/ })
  17 |     await expect(dialog).toBeVisible()
  18 |     await dialog.locator('select').selectOption({ index: 1 })
  19 |     await dialog.getByRole('button', { name: 'Xác nhận cấp phát' }).click()
  20 | 
  21 |     await expect(page.getByRole('alert')).toContainText('thành công')
  22 |   })
  23 | })
  24 | 
```