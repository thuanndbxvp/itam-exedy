# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login flow >> ADMIN login thành công và vào trang assets
- Location: tests\e2e\login.spec.ts:4:7

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
  3  | test.describe('Login flow', () => {
  4  |   test('ADMIN login thành công và vào trang assets', async ({ page }) => {
  5  |     await page.goto('/login')
  6  |     await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
  7  |     await page.getByLabel('Mật khẩu').fill('password123')
  8  |     await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  9  | 
> 10 |     await expect(page).toHaveURL(/\/assets$/)
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  11 |   })
  12 | 
  13 |   test('sai mật khẩu hiển thị lỗi thân thiện', async ({ page }) => {
  14 |     await page.goto('/login')
  15 |     await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
  16 |     await page.getByLabel('Mật khẩu').fill('wrong-password')
  17 |     await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  18 | 
  19 |     await expect(page.getByText('Email hoặc mật khẩu không đúng.')).toBeVisible()
  20 |   })
  21 | 
  22 |   test('anonymous truy cập assets bị chuyển về login', async ({ page }) => {
  23 |     await page.goto('/assets')
  24 | 
  25 |     await expect(page).toHaveURL(/\/login/)
  26 |   })
  27 | })
  28 | 
```