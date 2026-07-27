# WORKFLOW STATUS: USER PANEL MVP (Phase 4.5)

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-28
**Phiên bản:** v1 (8-step loop)
**Status:** 🟡 Planning — chờ Tier 2 code

---

## 1. 8-Step loop overview

User Panel MVP được thực hiện qua 8 bước, mỗi bước Tier 2 phải:
1. Code theo spec
2. Tự verify theo ACCEPTANCE checklist
3. Update status checkboxes ở đây
4. Nếu blocked → escalate Tier 1

```
Step 1: Schema verify      → Tier 2 đọc schema, verify fields tồn tại
Step 2: Server actions     → updateProfileAction + changePasswordAction + uploadAvatarAction
Step 3: Layout + Sidebar   → account/layout.tsx + UserPanelNav.tsx
Step 4: ProfileForm        → Editable form + 7 fields + avatar
Step 5: Avatar upload      → wire FormData + /api/upload (Epic I)
Step 6: ChangePasswordForm → Security-critical + rate limit
Step 7: SecurityInfoCard   → Read-only info card
Step 8: Header menu        → Add "Profile" dropdown item
```

---

## 2. Status tracking

### Master checklist

```
[ ] Step 1: Schema verify
[ ] Step 2: Server actions (3 actions)
[ ] Step 3: Layout + Sidebar (2 files)
[ ] Step 4: ProfileForm (1 file)
[ ] Step 5: Avatar upload (wire to Epic I)
[ ] Step 6: ChangePasswordForm (1 file + action)
[ ] Step 7: SecurityInfoCard (1 file)
[ ] Step 8: Header menu (modify 1 file)

Cross-cutting:
[ ] TypeScript check: npx tsc --noEmit (0 errors)
[ ] Build: npx next build (success)
[ ] Manual test: All F1.*, F2.*, F3.*, F4.* in ACCEPTANCE
[ ] Security review: by security-reviewer (no Critical)
[ ] Code review: by code-reviewer
```

---

## 3. Step-by-step status

### Step 1: Schema verify

**Owner:** Tier 2 (backend persona)

**Pre-conditions:**
- [x] CONTEXT-user-panel.md exists
- [x] ACCEPTANCE-user-panel.md exists

**Tasks:**
```
[ ] S1.1  Đọc prisma/schema.prisma
[ ] S1.2  Verify User model có fields: phone, address, city, state, country, zip, avatar, passwordChangedAt
[ ] S1.3  Nếu MISSING → ESCALATE Tier 1 (KHÔNG tự thêm)
```

**Exit criteria:**
- ✅ TẤT CẢ fields verified → sang Step 2
- 🚨 Nếu thiếu field → dừng lại, hỏi Tier 1 schema change hay skip field

**Estimated effort:** 0.5 giờ

---

### Step 2: Server actions

**Owner:** Tier 2 (backend persona)

**Tasks:**
```
[ ] S2.1  Tạo src/app/actions/account.ts với structure:
        - requireUser() helper
        - updateProfileAction(data)
        - changePasswordAction(data)
        - uploadAvatarAction(formData)
[ ] S2.2  updateProfileAction:
        - requireUser() check
        - Validate firstName not empty
        - prisma.user.update()
        - revalidatePath('/account/profile')
        - Return CommandResult<void>
[ ] S2.3  changePasswordAction:
        - requireUser() check
        - Rate limit: 3 attempts / 15 min / user (in-memory Map)
        - Validate newPassword.length >= 8
        - Validate newPassword === confirmPassword
        - bcrypt.compare(currentPassword, dbUser.password)
        - bcrypt.hash(newPassword, 12)
        - prisma.user.update({ password, passwordChangedAt: NOW() })
        - KHÔNG log password value
        - Return CommandResult<void>
[ ] S2.4  uploadAvatarAction:
        - requireUser() check
        - Validate file.size <= 1MB
        - Validate file.type in [image/png, image/jpeg, image/webp]
        - Call uploadFile() từ Epic I internal module
        - prisma.user.update({ avatar: url })
        - revalidatePath('/account/profile')
        - Return CommandResult<{ url }>
```

**Exit criteria:**
- ✅ Compile pass (`npx tsc --noEmit`)
- ✅ All 3 actions follow Epic F Settings pattern

**Estimated effort:** 1.5 giờ

---

### Step 3: Layout + Sidebar

**Owner:** Tier 2 (frontend persona)

**Tasks:**
```
[ ] S3.1  Tạo src/app/account/layout.tsx (Server Component):
        - getServerSession(authOptions)
        - redirect('/login') if !session
        - Render <UserPanelNav user={session.user} /> + {children}
[ ] S3.2  Tạo src/app/account/page.tsx:
        - redirect('/account/profile')
[ ] S3.3  Tạo src/components/account/UserPanelNav.tsx (Client Component):
        - 3 nav items: /account/profile, /account/password, /account/security
        - Highlight active (usePathname)
        - Hiển thị firstName + avatar fallback initials
        - Lucide-react icons: User, Lock, Shield
        - Style: AdminLTE-compatible
```

**Exit criteria:**
- ✅ Truy cập /account/profile → layout render sidebar, không crash
- ✅ Sidebar highlight active link
- ✅ Mobile responsive (verified manually với DevTools)

**Estimated effort:** 1 giờ

---

### Step 4: ProfileForm

**Owner:** Tier 2 (frontend persona)

**Tasks:**
```
[ ] S4.1  Tạo src/app/account/profile/page.tsx (Server Component):
        - getServerSession()
        - prisma.user.findUnique({ where: { id: session.user.id } })
        - Render <ProfileForm user={user} />
[ ] S4.2  Tạo src/components/account/ProfileForm.tsx (Client Component):
        - useState cho form fields (7 fields)
        - useState cho avatar URL
        - useToast()
        - Field components (reusable)
        - Email + Username READ-ONLY với note
[ ] S4.3  handleSubmit:
        - e.preventDefault()
        - Call updateProfileAction()
        - Toast success/error
[ ] S4.4  handleAvatarUpload:
        - Separate step (Step 5)
```

**Exit criteria:**
- ✅ F1.1 → F1.11 PASS trong ACCEPTANCE

**Estimated effort:** 2 giờ

---

### Step 5: Avatar upload (wire Epic I)

**Owner:** Tier 2 (frontend persona)

**Pre-condition:**
- [x] Step 2 done (uploadAvatarAction exists)
- [ ] Epic I `/api/upload` đã deployed và test được

**Tasks:**
```
[ ] S5.1  Trong ProfileForm.tsx, complete handleAvatarUpload:
        - input type="file" accept="image/*"
        - File size validate client-side (≤1MB)
        - FormData('file', 'type=avatar', 'entityId=userId')
        - Call uploadAvatarAction(formData)
        - Loading overlay
        - Update preview URL on success
[ ] S5.2  Verify Epic I endpoint:
        - POST /api/upload với FormData
        - Service trả { ok: bool, url: string }
        - File accessible public (hoặc signed URL)
[ ] S5.3  Nếu Epic I chưa hỗ trợ type=avatar → ESCALATE
```

**Exit criteria:**
- ✅ F2.1 → F2.12 PASS trong ACCEPTANCE

**Estimated effort:** 1 giờ

---

### Step 6: ChangePasswordForm (security-critical)

**Owner:** Tier 2 (backend + frontend persona)

**Tasks:**
```
[ ] S6.1  Tạo src/app/account/password/page.tsx (Server Component):
        - Render <ChangePasswordForm />
[ ] S6.2  Tạo src/components/account/ChangePasswordForm.tsx (Client Component):
        - 3 fields: currentPassword, newPassword, confirmPassword
        - Client validation:
          * newPassword.length >= 8
          * newPassword === confirmPassword
          * newPassword !== currentPassword
        - Strength indicator (basic: length + hasNumber)
        - Show/hide password toggle
[ ] S6.3  handleSubmit:
        - Call changePasswordAction()
        - Toast success/error
        - Clear form on success
[ ] S6.4  SECURITY CHECK (Tier 2 tự verify):
        - bcrypt.compare() cho current password
        - bcrypt.hash(newPassword, 12)
        - User.passwordUpdatedAt = NOW() in DB
        - grep code → NO log of password value
```

**Exit criteria:**
- ✅ F3.1 → F3.18 PASS trong ACCEPTANCE (đặc biệt F3.15-F3.18)

**Estimated effort:** 2 giờ

**Note:** ChangePasswordForm xong → **MUST** gọi `security-reviewer` agent TRƯỚC khi merge.

---

### Step 7: SecurityInfoCard

**Owner:** Tier 2 (frontend persona)

**Tasks:**
```
[ ] S7.1  Tạo src/app/account/security/page.tsx (Server Component):
        - getServerSession()
        - prisma.user.findUnique()
        - Render <SecurityInfoCard user={user} />
[ ] S7.2  Tạo src/components/account/SecurityInfoCard.tsx:
        - Email (mask một phần: a***@g***.com)
        - Username
        - PasswordChangedAt (format vi-VN)
        - 2FA status (nếu user.twoFactorEnabled)
        - Sessions section (note "Sẽ có ở Phase 5")
        - KHÔNG hiển thị password hash
```

**Exit criteria:**
- ✅ F4.1 → F4.7 PASS trong ACCEPTANCE

**Estimated effort:** 1 giờ

---

### Step 8: Header menu integration

**Owner:** Tier 2 (frontend persona)

**Tasks:**
```
[ ] S8.1  Locate Header.tsx (hoặc tương đương)
[ ] S8.2  Add menu item "Profile" → /account/profile
[ ] S8.3  Icon: User from lucide-react
[ ] S8.4  Vị trí: trong user dropdown (giữa "Settings" và "Logout")
```

**Exit criteria:**
- ✅ I3.1 → I3.3 PASS

**Estimated effort:** 0.25 giờ

---

## 4. Cross-cutting

### TypeScript check (BEFORE merge)

```bash
cd "D:\IT-management"
npx tsc --noEmit
```

```
[ ] T1.1  0 type errors
```

### Build check

```bash
npx next build
```

```
[ ] B1.1  Build successful
```

### Security review (MUST for changePassword)

```
[ ] Sec1.1  Call security-reviewer subagent
        Input: "src/app/actions/account.ts (changePasswordAction section)
                + src/components/account/ChangePasswordForm.tsx"
        Expected output: No Critical/High
[ ] Sec1.2  Nếu Critical/High → fix NGAY trước khi merge
```

### Code review

```
[ ] Rev1.1  Call code-reviewer subagent
        Input: toàn bộ files mới (Step 2-8)
        Expected: No obvious bugs
```

---

## 5. Manual testing flow

Sau khi tất cả steps done, Tier 1 (hoặc manual tester) chạy flow:

```
1. Login as test user (đã seed sẵn)
2. Click "Profile" ở header → /account/profile
3. Sửa firstName, phone, address
4. Upload avatar (PNG 500KB)
5. Click Save → toast success → reload giữ giá trị
6. Navigate to /account/password
7. Nhập current = "wrong" → toast error
8. Nhập current = "password123" (seed default) → newPassword = "newPass123"
9. Click Save → success → toast
10. Logout → login với "newPass123" → OK
11. Login với "password123" → FAIL
12. Navigate to /account/security → info card hiển thị đúng
```

**Time estimate:** 20 phút manual test.

---

## 6. Rollback plan

Nếu User Panel gây regression:

```bash
# Revert commit
git revert <user-panel-commit-sha>
git push

# Hoặc xóa routes
rm -rf src/app/account
rm -rf src/components/account
# Header menu item đã thêm → xóa manually
```

Database KHÔNG bị thay đổi (chỉ update field đã có sẵn) → rollback an toàn.

---

## 2026-07-28 01:48 — Step 1 done
- By: Tier 2
- Changes: read prisma/schema.prisma + verified fields
- Verify:
  - ✅ phone, address, city, state, country, zip, avatar, password — đã có
  - ✅ zip (đã sẵn, dùng thay cho zipCode trong MSEW)
  - ✅ passwordChangedAt — **MISSING → vừa thêm vào schema line ~352**
  - ⚠️ adapted: zipCode (MSEW) → zip (schema convention)
- Issues: NONE
- Next: Step 1b (rate-limit helper) + Step 1c (upload stub) — vì Epic I /api/upload CHƯA có

```
## YYYY-MM-DD HH:MM — Step X done
- By: Tier 2
- Changes: list of files added/modified
- Verify: list of acceptance items passed
- Issues: any blocker hoặc observation
- Next: Step X+1
```

Example:

```
## 2026-07-28 14:30 — Step 1 done
- By: Tier 2
- Changes: read prisma/schema.prisma
- Verify: tất cả fields tồn tại ✅
- Issues: none
- Next: Step 2 (server actions)
```

Tier 2 sẽ append status updates vào section 7 này mỗi 30 phút.

---

## 8. Escalation triggers

Tier 2 ESCALATE Tier 1 ngay khi:

```
🚨 Block 1: Schema fields MISSING (Step 1 fails)
🚨 Block 2: Epic I /api/upload CHƯA support type=avatar
🚨 Block 3: bcrypt.compare() throws (có thể do password hash format)
🚨 Block 4: Security reviewer tìm Critical/High issue
🚨 Block 5: npx tsc --noEmit có errors KHÔNG liên quan đến code mới
```

Tier 2 KHÔNG cần escalate (tự fix):
```
🟢 Type errors do code mới (fix trước khi merge)
🟢 UI polish nhỏ (defer)
🟢 Doc comment thiếu (add nếu có thời gian)
```

---

## 9. Effort budget

| Step | Estimated | Actual | Variance |
|------|-----------|--------|----------|
| 1: Schema verify | 0.5h | | |
| 2: Server actions | 1.5h | | |
| 3: Layout + Sidebar | 1h | | |
| 4: ProfileForm | 2h | | |
| 5: Avatar upload | 1h | | |
| 6: ChangePassword | 2h | | |
| 7: SecurityInfo | 1h | | |
| 8: Header menu | 0.25h | | |
| Cross-cutting (review + test) | 1.5h | | |
| **Total** | **10.75h ≈ 1.4 ngày** | | |

**Buffer:** ~0.5 ngày cho fixes.

---

## 10. Final status

```
[ ] 🟡 Planning complete (4 scaffolding files done)
[ ] 🟡 Tier 2 coding in progress
[ ] 🔴 Final review pending
[ ] 🟢 Merged to main
[ ] 🟢 Deployed to production
```

Tier 1 sẽ update cuối cùng khi toàn bộ workflow xong.

---

**HẾT WORKFLOW-STATUS-user-panel.md**
