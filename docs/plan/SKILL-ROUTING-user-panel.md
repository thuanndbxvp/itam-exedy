# SKILL ROUTING: USER PANEL — Chọn agents/skills cho từng phần

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-28
**Phạm vi:** MVP 1 ngày (Profile + Avatar + Change Password + Security Info)

---

## 1. Matrix: Công việc × Agent/Skill

| # | Công việc | Subagent | Lý do | Khi nào |
|---|-----------|----------|-------|---------|
| 1 | DB schema verify (đọc prisma/schema.prisma) | `generalPurpose` | Verify field tồn tại trước khi code | Bước 1 |
| 2 | Server actions (3 actions) | `backend` skills (chung) | TypeScript + Prisma + bcrypt | Bước 2 |
| 3 | Layout + sidebar nav (TSX) | `frontend` skills (chung) | React Server Component | Bước 3 |
| 4 | ProfileForm với validation | `frontend` skills | Client Component + Form | Bước 4 |
| 5 | Avatar upload (reuse `/api/upload`) | `frontend` + Epic I integration | FormData + upload | Bước 5 |
| 6 | ChangePasswordForm với bcrypt | `backend` skills | Security-critical | Bước 6 |
| 7 | SecurityInfoCard (read-only) | `frontend` skills | Hiển thị passwordChangedAt, lastLogin | Bước 7 |
| 8 | Header menu update | `frontend` skills | Thêm "Profile" item | Bước 8 |
| 9 | Security review | `security-reviewer` | OWASP Top 10 check | Bước 9 |
| 10 | Type check + build | Local tools | `npx tsc --noEmit` | Bước 10 |

---

## 2. Skills ưu tiên sử dụng

### 2.1 NÊN sử dụng (Priority 1)

#### **`security-reviewer`** — cho password change flow
- **Lý do:** Password hashing, rate limiting, timing attacks = security-critical
- **Áp dụng:** Sau khi code `changePasswordAction` xong, trước khi merge
- **Output mong đợi:** Verify bcrypt cost ≥12, rate limit hoạt động, không leak thông tin (same response time cho "wrong old" vs "user not found")

#### **`code-reviewer`** — cho mọi PR
- **Lý do:** Catch obvious bugs (KeyError, off-by-one, etc.)
- **Áp dụng:** Mỗi commit

#### **`typescript-reviewer`** — cho type safety
- **Lý do:** Schema changes có thể gây type error
- **Áp dụng:** Sau khi schema migration

### 2.2 CÓ THỂ sử dụng (Priority 2)

#### **`silent-failure-hunter`** — cho error handling
- **Lý do:** Upload avatar có thể silently fail
- **Áp dụng:** Review `uploadAvatarAction`

#### **`ui-ux-designer`** — cho UX consistency
- **Lý do:** Form phải match AdminLTE style hiện có
- **Áp dụng:** ProfileForm validation messages, loading states

### 2.3 KHÔNG cần cho MVP (Phase 5+)

- ❌ `tester` (chưa có test framework configured cho User Panel)
- ❌ `frontend-design` (giữ style hiện tại, không redesign)
- ❌ `a11y-architect` (audit sau khi MVP chạy ổn)

---

## 3. Routing chi tiết từng bước

### Bước 1: DB Schema Verify

**Subagent:** `generalPurpose` (single-shot)

**Task:**
```
Đọc file `D:\IT-management\prisma\schema.prisma` và verify TẤT CẢ các fields sau có tồn tại trong model `User`:
- phone, address, city, state, country, zip (string|null)
- avatar (string|null)
- passwordChangedAt (DateTime|null)

Output:
- ✅/❌ cho mỗi field
- Nếu ❌ → escalate (Tier 2 KHÔNG tự thêm field, phải hỏi Tier 1 trước)
```

### Bước 2: Server Actions

**Approach:** Tier 2 code trực tiếp (không delegate) — logic đơn giản, đã có pattern từ Epic F Settings.

**Files:**
- `src/app/actions/account.ts` — 3 actions:
  - `updateProfileAction`
  - `changePasswordAction`
  - `uploadAvatarAction`

**Pattern tham khảo:** `src/app/actions/settings.ts`

### Bước 3: Layout + Sidebar

**Subagent:** `frontend` (generalPurpose + persona)

**Task:**
```
Tạo `src/app/account/layout.tsx` (Server Component):
- Require session (redirect /login nếu chưa)
- Render `<UserPanelNav user={session.user} />` bên trái
- Render `{children}` bên phải
- Mobile: stack dọc

Tạo `src/components/account/UserPanelNav.tsx` (Client Component):
- Sidebar với 3 links: Profile, Mật khẩu, Bảo mật
- Highlight active route (usePathname)
- Hiển thị firstName + avatar ở top
- Style: AdminLTE-compatible (border, rounded, shadow-sm)
```

### Bước 4-5: ProfileForm + Avatar

**Subagent:** `frontend` (generalPurpose + persona)

**Task:**
```
Tạo `src/components/account/ProfileForm.tsx` (Client Component):

FIELD LIST (theo thứ tự):
1. Avatar upload (drag-drop hoặc click):
   - Hiển thị preview nếu đã có
   - Button "Upload" → file picker
   - Validate: image/* only, ≤1MB
   - Call uploadAvatarAction (FormData)
   - Show loading overlay khi upload
2. Tên (text, required)
3. Họ (text)
4. Email (READ-ONLY + note "Liên hệ admin để đổi")
5. Username (READ-ONLY)
6. Số điện thoại (tel)
7. Địa chỉ (text)
8. Thành phố / Quốc gia / Zip (3-col grid)

STATE:
- form: object chứa các editable fields
- avatar: string|null (URL)
- isSaving: boolean
- isUploading: boolean
- showToast function từ useToast()

VALIDATION:
- Tên không được rỗng
- Phone format optional (chỉ check có chữ số nếu nhập)
- Zip optional

UX:
- Auto-save: KHÔNG (chỉ save khi click button)
- Loading state: button disable + spinner
- Success: Toast "Đã lưu"
- Error: Toast với message từ server
- Avatar crop: KHÔNG (upload nguyên ảnh, server-side resize ở Epic I)
```

### Bước 6: ChangePasswordForm

**Subagent:** `frontend` (generalPurpose + persona) + **MUST** review by `security-reviewer`

**Task:**
```
Tạo `src/components/account/ChangePasswordForm.tsx`:

FIELDS:
1. Mật khẩu hiện tại (password input)
2. Mật khẩu mới (password input, ≥8 ký tự)
3. Xác nhận mật khẩu mới (password input, match new)

VALIDATION (CLIENT):
- newPassword === confirmPassword
- newPassword.length >= 8
- newPassword !== currentPassword (không cho đổi giống)

ACTION (changePasswordAction):
- Verify bcrypt hash của currentPassword
- Hash new password với cost 12
- Update password + passwordChangedAt
- Trả ok/error

UX:
- Strength indicator cho newPassword (basic: length + hasNumber)
- Show/hide password toggle (eye icon)
- Disable button nếu newPassword === currentPassword
- Success: Toast + clear form fields
- Error: Toast error (message khác nhau cho "wrong old" vs "user not found" — security)
- Rate limit: 3 attempts/15min (sẽ fail gracefully ở lần thứ 4)

SECURITY CHECKLIST (Tier 2 verify):
- [ ] bcrypt.compare() cho currentPassword
- [ ] bcrypt.hash() cost = 12 (không hơn, không kém)
- [ ] Không log password anywhere
- [ ] Same response time cho "wrong old" vs "user has no password"
- [ ] Không trả user object back (chỉ { ok: bool, message: string })
```

### Bước 7: SecurityInfoCard

**Subagent:** `frontend` (generalPurpose + persona)

**Task:**
```
Tạo `src/components/account/SecurityInfoCard.tsx` (READ-ONLY):

Hiển thị:
- Email: {user.email} (mask: a****@gmail.com?)
- Username: {user.username}
- Mật khẩu đã đổi lần cuối: {passwordChangedAt ? formatDate : "Chưa bao giờ"}
- Trạng thái 2FA: {user.twoFactorEnabled ? "Đã bật" : "Chưa bật (sẽ có ở Phase 5)"}
- Sessions: "Liên hệ admin để revoke" (Phase 5)

NOTE: KHÔNG hiển thị password hash
```

### Bước 8: Header Menu Update

**Subagent:** `frontend` (generalPurpose + persona)

**Task:**
```
Sửa `src/components/Header.tsx` (hoặc tương đương):
- Thêm menu item "Profile" → link `/account/profile`
- Icon: User icon (lucide-react)
- Vị trí: trong dropdown user menu, giữa "Settings" và "Logout"
- Style: match existing dropdown
```

### Bước 9: Security Review (BẮT BUỘC)

**Subagent:** `security-reviewer` (must use)

**Task:**
```
Review lại:
- src/app/actions/account.ts (3 actions)
- Đặc biệt: changePasswordAction

Check OWASP Top 10:
- [ ] A01 Broken Access Control: session check + ownership check
- [ ] A02 Cryptographic Failures: bcrypt cost, không lưu plain password
- [ ] A03 Injection: input validation, Prisma parameterized queries
- [ ] A04 Insecure Design: rate limit, defense-in-depth
- [ ] A05 Security Misconfiguration: không có secret trong code/log
- [ ] A07 Authentication Failures: brute force protection
- [ ] A09 Logging Failures: log failed attempts (nhưng KHÔNG log password)

Output:
- Severity (Critical/High/Medium/Low)
- Specific recommendations
- Nếu Critical → BLOCK merge
```

### Bước 10: Type Check + Build

**Tools:** Local shell

```bash
cd D:\IT-management
npx tsc --noEmit          # Type errors
npx next build --dry-run  # Build check (optional)
```

---

## 4. Skill delegation matrix

| Subagent | Khi nào dùng | Công việc chính |
|----------|--------------|-----------------|
| `generalPurpose` (với persona frontend) | Bước 3-5, 7-8 | Tạo UI components |
| `generalPurpose` (với persona backend) | Bước 1-2 | Verify schema, server actions |
| `generalPurpose` (với persona backend) | Bước 6 | ChangePasswordForm + action |
| `security-reviewer` | Bước 9 (MUST) | OWASP review |
| `code-reviewer` | Sau mỗi commit | Catch bugs |

---

## 5. Lệnh cấm (What NOT to do)

❌ **KHÔNG** delegate toàn bộ "code User Panel" cho một subagent — quá lớn, dễ miss context.

❌ **KHÔNG** skip security-reviewer — security-critical feature.

❌ **KHÔNG** tự thêm field vào schema mà chưa confirm với Tier 1.

❌ **KHÔNG** dùng MD5/SHA1 cho password — chỉ bcrypt/argon2.

❌ **KHÔNG** đổi email qua User Panel — escalation lên admin.

❌ **KHÔNG** implement forgot password trong MVP — defer Phase 5.

❌ **KHÔNG** add 2FA — defer Phase 5.

---

**HẾT SKILL-ROUTING-user-panel.md**
