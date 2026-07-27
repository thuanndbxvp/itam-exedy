# Báo cáo Điểm nghẽn (BLOCKERS) — epic-C-auth-middleware

**Người lập:** Tier 2 (Coder / Auditor)
**Ngày lập:** 2026-07-26
**Mục đích:** Ghi nhận các ambiguity Tier 2 gặp phải trong quá trình thi công + cách giải quyết.

---

## Blocker #1 — MSEW BƯỚC 5 viết `password: "any"` gây login fail (BUG trong MSEW)

- **Phát hiện tại Workflow Step:** BƯỚC 5 (sửa `src/app/login/page.tsx`)
- **Loại Blocker (Type):** [ MSEW code example bug — fix được trong cùng step ]
- **Mô tả chi tiết (Description):**

  MSEW BƯỚC 5 viết code example:
  ```typescript
  const result = await signIn("credentials", {
    email,
    password: "any",  // ← BUG
    redirect: false,
  })
  ```

  Tuy nhiên `src/lib/auth.ts:26-29` đã được verify ở Epic A2:
  ```typescript
  if (credentials.password && user.password) {
    const ok = await bcrypt.compare(credentials.password, user.password);
    if (!ok) return null;  // ← return null nếu bcrypt fail
  }
  ```

  Với `credentials.password = "any"` (truthy) → bcrypt chạy `bcrypt.compare("any", hash)` → `false` (vì hash là `"password123"`) → `authorize()` returns null → NextAuth returns `CredentialsSignin` error.

  Verify:
  ```
  $ curl POST /api/auth/callback/credentials -d "email=admin@congty.com&password=any"
  {"url":"http://localhost:3000/api/auth/error?error=CredentialsSignin&provider=credentials"}
  ```

  Đồng thời kiểm tra DB:
  ```
  $ npx tsx check-admin.ts
  bcrypt("password123") => true
  bcrypt("any") => false
  ```

- **Decision Tier 2 đưa ra:**

  Bỏ `password` hoàn toàn khỏi `signIn()` call. Khi `credentials.password = undefined` → điều kiện `credentials.password && user.password` là `false` → bcrypt check bị bypass → `authorize()` return user object → NextAuth tạo session JWT.

  Đây là cách duy nhất để vừa giữ MVP UX (password disabled, không bắt user nhập password) vừa bypass bcrypt check theo logic A2 đã verify.

  ```typescript
  const result = await signIn("credentials", {
    email,
    redirect: false, // không gửi password để bypass bcrypt check
  })
  ```

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Tier 1 viết MSEW nhưng KHÔNG verify lại với `auth.ts` actual code.
  - Sửa trong cùng step, không ảnh hưởng scope (chỉ thay đổi 1 line trong login form).
  - Đã verify lại bằng cách test login API curl → thành công với approach mới.

- **Tier 2 đã làm gì:**

  - Edit `src/app/login/page.tsx`: bỏ `password: "any"` → không gửi password.
  - Update JSDoc comment giải thích lý do bypass.
  - Verify: `curl /api/auth/callback/credentials -d "email=admin@congty.com"` → `{"url":"http://localhost:3000/assets"}` (success).
  - Verify: `curl /api/auth/session` với cookie → `{firstName: "Admin", lastName: "IT", role: "ADMIN"}`.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — không cần escalate.

---

## Blocker #2 — Next.js 16 vẫn cảnh báo `middleware.ts` deprecated (PHÁT HIỆN NGOÀI SCOPE)

- **Phát hiện tại Workflow Step:** BƯỚC 8 (verify dev server) — log từ Epic B
- **Loại Blocker (Type):** [ Pre-existing deprecation warning — KHÔNG thuộc Epic C scope ]
- **Mô tả chi tiết (Description):**

  `.next/dev/logs/next-development.log` chứa warning:
  ```
  {"level":"WARN","message":"The \"middleware\" file convention is deprecated. Please use \"proxy\" instead."}
  ```

  File `src/middleware.ts` đã được sửa ở Epic C (gate routes với `isAuthorized`). Tier 2 Phase 1 CHƯA rename vì:
  1. KHÔNG thuộc scope Epic C (theo MSEW Phụ lục A).
  2. Tier 1 cam kết xử lý ở Epic C+1 (RBAC) hoặc Epic Cleanup.
  3. KHÔNG có breaking change — middleware vẫn hoạt động bình thường (đã verify 6 routes curl PASS).

- **Tier 2 đã làm gì:**

  - Ghi nhận trong EVIDENCE §8.8.
  - Đề xuất ở WORKFLOW-STATUS §"Tiếp theo" — Epic C+1 hoặc Epic Cleanup sẽ rename `middleware.ts` → `proxy.ts`.

- **Trạng thái:** ⏸️ CHƯA GIẢI — chờ Epic C+1 (RBAC) hoặc Epic Cleanup.

---

## Tổng kết tình trạng

| # | Blocker | Phát hiện tại Step | Trạng thái |
|---|---------|---------------------|-----------|
| 1 | MSEW BƯỚC 5 password "any" bug | Step 5 | ✅ ĐÃ GIẢI — bỏ password khỏi signIn() call |
| 2 | middleware.ts deprecated | Step 8 (ngoài scope) | ⏸️ CHƯA GIẢI — đề xuất xử lý ở Epic C+1 hoặc Epic Cleanup |

→ **0 blockers chặn** thi công Epic C. 1 blocker đã giải trong cùng step. 1 blocker ngoài scope (Next.js deprecation) đã ghi nhận để epic sau xử lý.
