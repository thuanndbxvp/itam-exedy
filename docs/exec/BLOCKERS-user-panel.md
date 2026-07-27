# BLOCKERS — user-panel

> **Cập nhật 2026-07-28 01:32** sau khi Epic H (email-settings-self-hosted) đã hoàn thành (commit 9598685).
> - Blocker #1 — Epic H infrastructure: ✅ ĐÃ CÓ (`src/lib/notifications/email.ts`)
> - Blocker #3 — `getSettings`: ✅ CÓ SẴN; `rate-limit` vẫn thiếu (Tier 2 có thể tạo)
> - Blocker #2, #4, #5: vẫn còn

## Blocker #1 — Epic H (Notifications) infrastructure ✅ ĐÃ CÓ (2026-07-28)
- **Type**: Resolved
- **Discovered at**: MSEW Step 5 (Server actions) + Step 6 (Email template) + §5 (Notification service)
- **Description**: `src/lib/notifications/email.ts` đã được tạo ở commit `9598685` — `sendEmail({ to, subject, html })` available.
- **Còn thiếu**: `src/emails/PasswordResetEmail.tsx` (chưa có — sẽ tạo khi code Phase B).
- **API mismatch nhỏ**: MSEW dùng `react: ReactElement` (qua @react-email/components render). Hiện tại `sendEmail` chỉ nhận `html: string` (đã render sẵn). Cần update `EmailPayload` để hỗ trợ cả 2 — không khó, Tier 2 sẽ tự xử lý trong Phase B.
- **Severity**: 🟡 PARTIAL — code được Phase A (Profile + Change Password — không cần email). Phase B cần update email.ts để hỗ trợ React Email.

## Blocker #2 — Epic I (File Storage) infrastructure chưa có
- **Type**: Missing Info
- **Discovered at**: MSEW Step 5 (`uploadAvatarAction` gọi `uploadModule.uploadFile()`)
- **Description**: MSEW tham chiếu `import('@/lib/upload')` và `uploadFile({ file, type: 'avatar', entityId })`. Source hiện tại KHÔNG CÓ `src/lib/upload.ts`.
- **Suggestion**: Tương tự Blocker #1 — cần Epic I hoàn thành trước. Hoặc loại avatar upload khỏi MVP user-panel.
- **Severity**: 🔴 FATAL — `require('@/lib/upload')` sẽ throw MODULE_NOT_FOUND.
- **Awaiting**: Planner review

## Blocker #3 — Helper modules: `rate-limit` vẫn chưa có; `getSettings` ✅
- **Type**: Missing Info
- **Discovered at**: MSEW Step 5 (`changePasswordAction`, `requestPasswordResetAction`)
- **Description**:
  - `import { getSettings } from '@/lib/settings'` — ✅ ĐÃ CÓ
  - `import { rateLimit } from '@/lib/rate-limit'` — file không tồn tại
- **Suggestion**: Tier 2 có thể tạo module `rate-limit` minimal (in-memory, sliding window) trước khi code user-panel. Hoặc Planner update MSEW để bỏ rate-limit / inline thẳng.
- **Severity**: 🟡 HIGH — sẽ crash runtime khi user đổi password hoặc request reset.
- **Awaiting**: Tier 2 sẽ tự tạo nếu sếp OK

## Blocker #4 — Schema conflict với User model hiện tại
- **Type**: Wrong Skill (Data model conflict)
- **Discovered at**: MSEW Step 4 (Prisma schema)
- **Description**:
  - User hiện có `zip` (không phải `zipCode`) — MSEW đặt tên `zipCode` → cần rename hoặc giữ alias.
  - User hiện có `twoFactorSecret`, `twoFactorEnrolled` (Epic C). MSEW khai báo `twoFactorSecret` + `twoFactorEnabled` → trùng field, đặt tên khác nhau gây confusion.
  - User có `notes` (không có trong MSEW nhưng có sẵn). OK nếu giữ.
- **Suggestion**: Planner chuẩn hóa lại schema diff:
  - Đổi `zipCode` → dùng `zip` đã có.
  - 2FA: reuse `twoFactorSecret`, `twoFactorEnrolled`, `twoFactorOptin`. Bỏ 2 fields mới trong MSEW.
- **Severity**: 🟡 HIGH — schema không migrate được nếu không rename. Nếu Planner giữ tên MSEW, sẽ có 2 fields cùng nghĩa trên User.
- **Awaiting**: Planner

## Blocker #5 — Không có CONTEXT / SKILL-ROUTING / ACCEPTANCE files
- **Type**: Missing Info
- **Description**: Theo skill `code.md` Tier 2 protocol, cần đọc 3 files trước khi code:
  - `docs/plan/CONTEXT-user-panel.md`
  - `docs/plan/SKILL-ROUTING-user-panel.md`
  - `docs/plan/ACCEPTANCE-user-panel.md`
- Cả 3 files **không tồn tại**. Không có file WORKFLOW-STATUS-user-panel.md khởi tạo.
- **Suggestion**: Tầng 1 chạy `/plan user-panel` để tạo đủ bộ scaffolding files.
- **Severity**: 🔴 FATAL — không thể bắt đầu theo protocol.
- **Awaiting**: Planner

---

## KẾT LUẬN

**Tier 2 đề xuất 3 lựa chọn cho sếp**:

### Option 1 (Recommend) ⭐
Chạy lại Pipeline Tier 1: `/plan user-panel` để tạo CONTEXT-user-panel.md, SKILL-ROUTING, ACCEPTANCE, WORKFLOW-STATUS, đồng thời cập nhật MSEW để:
- Bỏ requirement Epic H+I (hoặc đánh dấu Phase A vs Phase B tách riêng)
- Rename `zipCode` → `zip`, reuse `twoFactor*` fields hiện có
- Sau đó Tier 2 mới nhận và code.

### Option 2
Code thủ công Phase A only (chỉ Profile + Change Password — không cần Epic H/I):
- Schema: chỉ thêm `passwordChangedAt` + `passwordResetTokens` relation + 3 models cho password reset (KHÔNG cần Epic H để hash + email — chỉ thêm API reset trực tiếp, không qua email).
- Nhưng sẽ **không có forgot password** (vì cần email) → mất 50% giá trị MVP.

### Option 3
Bỏ qua User Panel, làm epic khác trước (Epic H Notifications trước — đã có MSEW), xong Epic H quay lại user-panel.

---

**Tier 2 tạm DỪNG user-panel** cho tới khi Tầng 1 xử lý blockers.

Sếp quyết định Option nào nhé? Tôi không tự ý code khi 4 blockers 🔴 ở trên.
