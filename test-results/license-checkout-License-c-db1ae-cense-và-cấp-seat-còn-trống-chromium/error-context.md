# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: license-checkout.spec.ts >> License checkout flow >> ADMIN mở license và cấp seat còn trống
- Location: tests\e2e\license-checkout.spec.ts:12:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Cấp Seat' }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - generic [ref=f1e3]:
      - generic [ref=f1e4]: IT Manager
      - navigation [ref=f1e8]:
        - link "Dashboard" [ref=f1e9] [cursor=pointer]:
          - /url: /
        - link "Tài sản (Assets)" [ref=f1e16] [cursor=pointer]:
          - /url: /assets
        - link "Bản quyền (Licenses)" [ref=f1e20] [cursor=pointer]:
          - /url: /licenses
        - link "Cài đặt (Settings)" [ref=f1e26] [cursor=pointer]:
          - /url: /settings
      - generic [ref=f1e32]:
        - generic [ref=f1e33]: AD
        - generic [ref=f1e34]:
          - paragraph [ref=f1e35]: Admin IT
          - paragraph [ref=f1e36]: admin@congty.com
    - generic [ref=f1e37]:
      - banner [ref=f1e38]:
        - heading "Quản lý Bản quyền" [level=1] [ref=f1e40]
        - generic [ref=f1e41]:
          - textbox "Tìm kiếm nhanh..." [ref=f1e46]
          - button [ref=f1e47]
          - button "Admin IT ADMIN" [ref=f1e54]:
            - generic [ref=f1e55]: Admin IT
            - generic [ref=f1e56]: ADMIN
      - main [ref=f1e57]:
        - generic [ref=f1e58]:
          - generic [ref=f1e59]:
            - link [ref=f1e60] [cursor=pointer]:
              - /url: /licenses
            - generic [ref=f1e70]:
              - heading "Microsoft Office 365 Business" [level=1] [ref=f1e71]
              - paragraph [ref=f1e72]: Phần mềm • Microsoft
          - generic [ref=f1e73]:
            - heading "Thông tin License" [level=2] [ref=f1e74]
            - generic [ref=f1e75]:
              - generic [ref=f1e76]:
                - paragraph [ref=f1e77]: Product Key
                - paragraph [ref=f1e78]: XXXXX-XXXXX-XXXXX-XXXXX
              - generic [ref=f1e79]:
                - paragraph [ref=f1e80]: Ngày hết hạn
                - paragraph [ref=f1e81]:
                  - generic [ref=f1e84]: 31/12/2027
                  - generic [ref=f1e85]: REASSIGNABLE
              - generic [ref=f1e86]:
                - paragraph [ref=f1e87]: Số ghế (Seats)
                - generic [ref=f1e88]:
                  - generic [ref=f1e89]: 5 tổng
                  - generic [ref=f1e90]: 0 trống
                  - generic [ref=f1e91]: 5 đã cấp
              - generic [ref=f1e92]:
                - paragraph [ref=f1e93]: Ngày tạo
                - paragraph [ref=f1e94]: 26/7/2026
          - generic [ref=f1e95]:
            - heading "Danh sách Seats (5)" [level=2] [ref=f1e103]
            - table [ref=f1e105]:
              - rowgroup [ref=f1e106]:
                - row [ref=f1e107]:
                  - columnheader "Seat ID" [ref=f1e108]
                  - columnheader "Trạng thái" [ref=f1e109]
                  - columnheader "Người được cấp" [ref=f1e110]
                  - columnheader "Ghi chú" [ref=f1e111]
                  - columnheader "Thao tác" [ref=f1e112]
              - rowgroup [ref=f1e113]:
                - row [ref=f1e114]:
                  - cell "14epq9x5" [ref=f1e115]
                  - cell [ref=f1e121]
                  - cell "A Admin IT" [ref=f1e124]:
                    - generic [ref=f1e125]:
                      - generic [ref=f1e126]: A
                      - generic [ref=f1e127]: Admin IT
                  - cell "Auto-created seat" [ref=f1e128]
                  - cell [ref=f1e129]:
                    - button "Thu hồi" [ref=f1e130]
                - row [ref=f1e134]:
                  - cell "bon8fulh" [ref=f1e135]
                  - cell [ref=f1e141]
                  - cell "A Admin IT" [ref=f1e144]:
                    - generic [ref=f1e145]:
                      - generic [ref=f1e146]: A
                      - generic [ref=f1e147]: Admin IT
                  - cell "Auto-created seat" [ref=f1e148]
                  - cell [ref=f1e149]:
                    - button "Thu hồi" [ref=f1e150]
                - row [ref=f1e154]:
                  - cell "f9gws0xz" [ref=f1e155]
                  - cell [ref=f1e161]
                  - cell "A Admin IT" [ref=f1e164]:
                    - generic [ref=f1e165]:
                      - generic [ref=f1e166]: A
                      - generic [ref=f1e167]: Admin IT
                  - cell "Auto-created seat" [ref=f1e168]
                  - cell [ref=f1e169]:
                    - button "Thu hồi" [ref=f1e170]
                - row [ref=f1e174]:
                  - cell "k4kl2lcm" [ref=f1e175]
                  - cell [ref=f1e181]
                  - cell "A Admin IT" [ref=f1e184]:
                    - generic [ref=f1e185]:
                      - generic [ref=f1e186]: A
                      - generic [ref=f1e187]: Admin IT
                  - cell "Auto-created seat" [ref=f1e188]
                  - cell [ref=f1e189]:
                    - button "Thu hồi" [ref=f1e190]
                - row [ref=f1e194]:
                  - cell "j7wwpzuj" [ref=f1e195]
                  - cell [ref=f1e201]
                  - cell "A Admin IT" [ref=f1e204]:
                    - generic [ref=f1e205]:
                      - generic [ref=f1e206]: A
                      - generic [ref=f1e207]: Admin IT
                  - cell "Auto-created seat" [ref=f1e208]
                  - cell [ref=f1e209]:
                    - button "Thu hồi" [ref=f1e210]
  - button "Open Next.js Dev Tools" [ref=f1e219] [cursor=pointer]
  - alert [ref=f1e223]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | test.describe('License checkout flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login')
  6  |     await page.getByLabel('Tài khoản Email').fill('admin@congty.com')
  7  |     await page.getByLabel('Mật khẩu').fill('password123')
  8  |     await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  9  |     await expect(page).toHaveURL(/\/assets$/)
  10 |   })
  11 | 
  12 |   test('ADMIN mở license và cấp seat còn trống', async ({ page }) => {
  13 |     await page.goto('/licenses')
  14 |     await page.locator('tbody a[href^="/licenses/"]').first().click()
> 15 |     await page.getByRole('button', { name: 'Cấp Seat' }).first().click()
     |                                                                  ^ Error: locator.click: Test timeout of 60000ms exceeded.
  16 |     const dialog = page.getByRole('dialog', { name: /Cấp License Seat/ })
  17 |     await dialog.locator('select').selectOption({ index: 1 })
  18 |     await dialog.getByRole('button', { name: 'Xác nhận cấp seat' }).click()
  19 | 
  20 |     await expect(page.getByRole('alert')).toContainText('thành công')
  21 |   })
  22 | })
  23 | 
```