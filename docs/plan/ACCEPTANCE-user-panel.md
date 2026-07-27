# ACCEPTANCE CRITERIA: USER PANEL MVP

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-28
**Phạm vi:** MVP 1 ngày (UP-1 + UP-2 + UP-3 + Security Info)
**Definition of Done:** Pass TẤT CẢ checkboxes bên dưới.

---

## 1. Test plan format

Mỗi feature có 3 mức:
- **✅ MUST PASS** (block merge): Lỗi → revert hoặc fix
- **🟡 SHOULD PASS** (review sau): Lỗi nhỏ có thể defer
- **🟢 NICE TO HAVE** (polish): Có thể skip

---

## 2. Functional Acceptance

### 2.1 UP-1: Profile edit ✅ MUST PASS

**Files involved:**
- `src/app/account/layout.tsx`
- `src/app/account/profile/page.tsx`
- `src/components/account/ProfileForm.tsx`
- `src/app/actions/account.ts → updateProfileAction`
- `prisma/schema.prisma` (verify only)

**Acceptance:**

```
[ ] F1.1  Truy cập /account/profile → page load, không redirect, không lỗi 500
[ ] F1.2  Layout hiển thị sidebar với 3 items: Profile, Mật khẩu, Bảo mật
[ ] F1.3  Sidebar highlight đúng active link
[ ] F1.4  Form render với firstName, lastName, phone, address, city, country, zipCode (7 fields edit)
[ ] F1.5  Email + Username là READ-ONLY (không thể edit, có note "Liên hệ admin")
[ ] F1.6  Click Save → POST thành công, toast "Đã lưu"
[ ] F1.7  Reload page → giá trị mới hiển thị đúng
[ ] F1.8  Submit với firstName rỗng → server validation error → toast error
[ ] F1.9  Session check: gọi action mà không có session → return FORBIDDEN, không update DB
[ ] F1.10 Page thân thiện mobile (responsive)
[ ] F1.11 Không có console error/warning
```

**SQL verification sau test:**
```sql
-- Sau khi sửa firstName "New Name"
SELECT firstName FROM "user" WHERE id = 'test-user-id';
-- Expected: 'New Name'
```

### 2.2 UP-2: Avatar upload ✅ MUST PASS

**Files involved:**
- `src/components/account/ProfileForm.tsx`
- `src/app/actions/account.ts → uploadAvatarAction`
- `src/app/api/upload/route.ts` (Epic I, reuse)
- Vercel Blob hoặc local storage (Epic I)

**Acceptance:**

```
[ ] F2.1  Avatar section hiển thị (preview hoặc fallback initials)
[ ] F2.2  Click "Upload avatar" → file picker mở
[ ] F2.3  Chọn PNG ≤1MB → upload thành công, preview cập nhật
[ ] F2.4  Chọn JPG ≤1MB → thành công
[ ] F2.5  Chọn WEBP ≤1MB → thành công
[ ] F2.6  Chọn JPG >1MB → reject với toast "Tối đa 1MB"
[ ] F2.7  Chọn file PDF → reject (MIME không hợp lệ)
[ ] F2.8  Upload → toast loading overlay hiển thị
[ ] F2.9  Upload fail (network) → toast error, KHÔNG clear avatar cũ
[ ] F2.10 Reload page → avatar URL persist trong DB
[ ] F2.11 User.avatar column được update (verify bằng SQL)
[ ] F2.12 Old avatar file (nếu có) được cleanup hoặc orphaned OK
```

**Test file fixtures:**
```
tests/fixtures/avatar/
├── valid-1mb.png   ✓
├── valid-500kb.jpg ✓
├── valid-200kb.webp ✓
├── invalid-2mb.jpg ✗ (size fail)
└── invalid.pdf     ✗ (MIME fail)
```

### 2.3 UP-3: Change password ✅ MUST PASS

**Files involved:**
- `src/app/account/password/page.tsx`
- `src/components/account/ChangePasswordForm.tsx`
- `src/app/actions/account.ts → changePasswordAction`

**Acceptance:**

```
[ ] F3.1  Truy cập /account/password → form load OK
[ ] F3.2  3 fields: Current password, New password, Confirm new password
[ ] F3.3  Submit với current password SAI → toast "Mật khẩu hiện tại không đúng", password KHÔNG đổi
[ ] F3.4  Submit với new password <8 chars → client validation reject
[ ] F3.5  Submit với confirm ≠ new → client validation reject
[ ] F3.6  Submit với new = current → reject "Mật khẩu mới phải khác mật khẩu cũ"
[ ] F3.7  Submit hợp lệ → success, form clear, toast "Đã đổi"
[ ] F3.8  Đăng xuất → đăng nhập lại với password MỚI → thành công
[ ] F3.9  Vẫn KHÔNG login được với password CŨ
[ ] F3.10 Verify User.password hash trong DB đã update (bcrypt prefix "$2a$12$...")
[ ] F3.11 Verify User.passwordChangedAt đã update thành NOW()
[ ] F3.12 Rate limit: thử 5 lần liên tiếp → lần thứ 4 bị reject "Vui lòng đợi 15 phút"
[ ] F3.13 Timeout/rate-limit reset sau 15 phút (verify bằng cách clear Map hoặc sleep)
[ ] F3.14 User từ SSO (User.password = null) → toast "Tài khoản SSO, liên hệ admin"
```

**Security test (MUST):**
```
[ ] F3.15 Hash function: bcrypt.compare() verify old password (không log value)
[ ] F3.16 New password hash cost ≥12
[ ] F3.17 Response time cho "wrong old" và "user has no password" tương đương (timing attack mitigation)
[ ] F3.18 KHÔNG có console log nào in password value
```

### 2.4 UP-4: Security info (read-only) 🟡 SHOULD PASS

**Files involved:**
- `src/app/account/security/page.tsx`
- `src/components/account/SecurityInfoCard.tsx`

**Acceptance:**

```
[ ] F4.1  Truy cập /account/security → page load, không lỗi
[ ] F4.2  Hiển thị email (mask một phần)
[ ] F4.3  Hiển thị username
[ ] F4.4  Hiển thị "Mật khẩu đã đổi lần cuối: {date} hoặc 'Chưa bao giờ'"
[ ] F4.5  Hiển thị "2FA: Chưa bật (Phase 5)" hoặc nếu user đã bật → "Đã bật"
[ ] F4.6  Sessions section show "Sẽ có ở Phase 5"
[ ] F4.7  KHÔNG hiển thị password hash
```

---

## 3. Non-functional Acceptance

### 3.1 Performance ✅ MUST

```
[ ] N1.1  Page load < 2s (Local + Vercel Free tier)
[ ] N1.2  Avatar upload < 3s cho 1MB
[ ] N1.3  Password change < 1s (bcrypt compare+hash + DB update)
[ ] N1.4  Profile update < 1s
```

### 3.2 Security ✅ MUST

```
[ ] S1.1  Mọi action có session check
[ ] S1.2  Password KHÔNG log anywhere (grep code → 0 matches)
[ ] S1.3  bcrypt cost = 12 (verify bằng cách check hash format $2a$12$)
[ ] S1.4  Rate limit hoạt động (test brute force 5 lần)
[ ] S1.5  CSRF protection (Next.js Server Actions built-in)
[ ] S1.6  MIME validation cho avatar upload
[ ] S1.7  Size limit cho avatar (≤1MB)
[ ] S1.8  session.user.id ownership: user không thể đổi thông tin user khác
```

### 3.3 Code quality 🟡 SHOULD

```
[ ] Q1.1  npx tsc --noEmit → 0 errors
[ ] Q1.2  ESLint → 0 errors (cho files mới)
[ ] Q1.3  Không có TODO/FIXME trong code (defer có thể comment hợp lệ)
[ ] Q1.4  Action signature: Promise<CommandResult<T>>
[ ] Q1.5  Mọi error có message user-friendly (Tiếng Việt)
[ ] Q1.6  Code reuses patterns từ Epic F Settings (import structure)
```

### 3.4 UX 🟡 SHOULD

```
[ ] U1.1  Form có loading state rõ ràng (button disabled + spinner)
[ ] U1.2  Toast success/error với message rõ ràng
[ ] U1.3  Error message cho "wrong password" KHÔNG leak "user not found" vs "wrong password"
[ ] U1.4  Avatar preview trước khi upload (browser File API)
[ ] U1.5  Form reset sau khi save thành công
[ ] U1.6  Mobile: 3-col grid (city/country/zip) collapse về 1-col
```

### 3.5 Accessibility 🟢 NICE TO HAVE

```
[ ] A1.1  Form có <label> cho mọi input (không chỉ placeholder)
[ ] A1.2  Avatar upload có alt text
[ ] A1.3  Keyboard navigation hoạt động
[ ] A1.4  Color contrast ≥4.5 (dùng default theme)
```

---

## 4. Integration verification

### 4.1 Epic I integration (avatar upload) ✅ MUST

```
[ ] I1.1  /api/upload tồn tại và accept FormData('file', 'type', 'entityId')
[ ] I1.2  Endpoint return { ok, url } với type=avatar
[ ] I1.3  File được lưu ở Vercel Blob hoặc local upload dir (Epic I config)
[ ] I1.4  URL accessible public (hoặc signed URL nếu private)
```

### 4.2 Epic C integration (auth) ✅ MUST

```
[ ] I2.1  getServerSession() hoạt động
[ ] I2.2  Layout redirect /login nếu !session
[ ] I2.3  User ID match giữa session.user.id và DB query
```

### 4.3 Header menu integration 🟡 SHOULD

```
[ ] I3.1  Header có "Profile" link → /account/profile
[ ] I3.2  Link hoạt động từ mọi page (logout/login state)
[ ] I3.3  Active state khi ở /account/*
```

---

## 5. Regression check

```
[ ] R1.1  /login, /logout không break
[ ] R1.2  /admin/users không break (Epic E)
[ ] R1.3  Admin edit user (EditUserForm) không bị conflict với User Panel
[ ] R1.4  Khi admin sửa user từ Admin UI, user vẫn thấy update ở User Panel
[ ] R1.5  NextAuth flow không break
[ ] R1.6  Avatar của user hiển thị ở các nơi khác (header dropdown, ...) nếu có
```

---

## 6. Test commands

```bash
cd "D:\IT-management"

# 1. Type check
npx tsc --noEmit
# Expected: 0 errors

# 2. Build check
npx next build
# Expected: success

# 3. Manual test flow:
# - Login as test user
# - Go to /account/profile
# - Edit firstName + phone
# - Upload avatar (PNG)
# - Save → verify toast + reload
# - Go to /account/password
# - Change password
# - Logout → login with new password

# 4. Security check (grep)
grep -r "log.*password" src/  # Should return 0
grep -r "console.log.*pwd" src/ # Should return 0
grep -rE "bcrypt\.(gen|hash|enc)" src/app/actions/account.ts
# Should show: bcrypt.compare + bcrypt.hash cost 12

# 5. Rate limit test (manual)
# Try wrong password 4 times → 4th should reject with rate limit message
```

---

## 7. Definition of Done (final)

User Panel MVP PASS khi:

```
✅ Tất cả F1.1 → F1.11 (UP-1 Profile) PASS
✅ Tất cả F2.1 → F2.12 (UP-2 Avatar) PASS
✅ Tất cả F3.1 → F3.18 (UP-3 Password) PASS
✅ Tất cả F4.1 → F4.7 (UP-4 Security info) PASS
✅ Tất cả S1.1 → S1.8 (Security) PASS
✅ Tất cả N1.1 → N1.4 (Performance) PASS
✅ Tất cả I1.1 → I2.3 (Integration) PASS
🟡 80%+ U, Q SHOULD PASS (acceptable có gap minor)
🟢 Accessibility có thể skip cho MVP
✅ Regression check R1.1 → R1.6 PASS
✅ npx tsc --noEmit → 0 errors
✅ Code reviewed by security-reviewer (no Critical/High findings)
✅ Code reviewed by code-reviewer (no obvious bugs)
```

**Status:** 🔴 In Progress → 🟢 Done

---

## 8. Out of scope (verify defer)

Các feature sau **KHÔNG CẦN** trong MVP này. Tier 2 KHI THẤY trong code phải KHÔNG tự ý thêm:

```
❌ Forgot password qua email
❌ 2FA TOTP enrollment
❌ Notification preferences
❌ Active sessions management
❌ API tokens
❌ Email change
❌ Phone change (đã làm trong profile, nhưng KHÔNG có OTP verify)
❌ Account deletion
```

Nếu Tier 2 thấy customer request mạnh các features trên → ESCALATE Tier 1.

---

**HẾT ACCEPTANCE-user-panel.md**
