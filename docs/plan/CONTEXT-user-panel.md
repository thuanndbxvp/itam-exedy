# CONTEXT: USER PANEL — Self-service profile/password/avatar

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-28
**Phase:** 4.5 (chèn giữa Phase 4 và Phase 5)
**Status:** Scaffolding — chờ Tier 2 code

---

## 1. Tiểu sử (Background)

### 1.1 Hiện trạng

IT Management đã hoàn thành **Phase 1 → 3** (Schema, UI Core, Reports) và đang triển khai **Phase 4** (Epic H Notifications + Epic I File Storage). Trong báo cáo rà soát codebase ngày 2026-07-28, Tier 1 phát hiện:

- **`User` model có 14 fields nhưng `EditUserForm.tsx` chỉ show 7**
- **KHÔNG có `/profile` page** — user không thể tự sửa thông tin cá nhân
- **KHÔNG có UI đổi mật khẩu** — chỉ seed defaults, user phải nhờ admin
- **`User.avatar` field tồn tại** nhưng KHÔNG có UI upload → Epic I đã build `/api/upload` nhưng chưa wire vào user form
- **Không có forgot/reset password flow**

### 1.2 Tại sao cần làm

| Vấn đề | Impact |
|--------|--------|
| User phải nhờ admin đổi password | Tốn effort admin, security gap |
| Avatar mặc định cho mọi user | UX kém, không chuyên nghiệp |
| Không có self-service | Tăng support ticket, giảm autonomy |
| Phase 4.5 tận dụng Epic H+I sẵn có | **Effort chỉ ~1 ngày MVP** |

### 1.3 Tại sao Phase 4.5 (không phải Phase 5)

1. **Tận dụng Epic H (Notifications)**: forgot password cần email service → Epic H sẽ làm xong trước
2. **Tận dụng Epic I (File Storage)**: avatar upload cần upload API → Epic I đã có `/api/upload`
3. **Security gap**: không thể đợi Phase 5 (4-6 tháng) mà không có password change
4. **Effort nhỏ vì infra sẵn**: ~1 ngày MVP

---

## 2. Phạm vi MVP (1 ngày)

### 2.1 Trong scope (P0 — Phase 4.5 MVP)

| Feature | Mô tả | Effort |
|---------|-------|--------|
| **UP-1** | `/account/profile` — sửa firstName, lastName, phone, address, city, country, zipCode | 3 giờ |
| **UP-2** | Avatar upload — `User.avatar` field, reuse `/api/upload` từ Epic I | 1 giờ |
| **UP-3** | `/account/password` — đổi password (cần password cũ, bcrypt) | 2 giờ |
| **UP-4** | `/account/security` — xem thông tin session, last login, password changed date | 1 giờ |

**Tổng MVP:** ~7 giờ = 1 ngày

### 2.2 NGOÀI scope (defer Phase 5+)

| Feature | Lý do defer |
|---------|-------------|
| Forgot password (email reset link) | Cần mail server config — làm sau khi có production SMTP |
| Notification preferences (per-event toggle) | Cần wire Epic H notification triggers — Phase 5 |
| 2FA TOTP enrollment | Effort ~3-4 ngày — Phase 5 |
| Active sessions + revoke | Cần NextAuth session tracking đầy đủ |
| API tokens | Có `ApiToken` model concept nhưng chưa ưu tiên |
| Email change OTP | Effort ~1 ngày + SMS gateway |
| Account deletion (GDPR) | Effort ~2 ngày + audit trail |

---

## 3. Ảnh hưởng (Impact)

### 3.1 Files sẽ tạo mới

```
src/app/account/
├── layout.tsx                      # Sidebar nav
├── page.tsx                        # Redirect → /account/profile
├── profile/
│   └── page.tsx                    # Profile edit
├── password/
│   └── page.tsx                    # Change password
└── security/
    └── page.tsx                    # Security info

src/components/account/
├── UserPanelNav.tsx                # Sidebar
├── ProfileForm.tsx                 # Form + avatar
├── ChangePasswordForm.tsx          # Password form
└── SecurityInfoCard.tsx            # Read-only info

src/app/actions/account.ts          # 3 server actions
```

### 3.2 Files sẽ sửa

```
src/components/Header.tsx           # Thêm "Profile" menu item
prisma/schema.prisma                # Bổ sung fields (phone, address, ...) nếu thiếu
```

### 3.3 DB schema (verify trước khi code)

Fields đã có sẵn trong `prisma/schema.prisma` (verify Tier 2):
- ✅ `User.firstName`, `lastName`, `phone`, `address`, `city`, `state`, `country`, `zip`, `avatar`
- ✅ `User.password`, `passwordChangedAt`

Nếu **CHƯA CÓ** field nào → Tier 2 dừng lại + Escalate.

### 3.4 Dependencies

- **Epic I (File Storage)** đã có `/api/upload` endpoint với `type=avatar` support → dùng lại
- **Epic H (Notifications)** chưa cần cho MVP (forgot password defer)
- **bcryptjs** đã cài (Epic A1)
- **next-auth** đã có (Epic C)

### 3.5 Security implications

- **Password change**: bcrypt verify old + hash new (cost ≥12)
- **Rate limit**: 3 attempts/15min per user (in-memory OK cho MVP)
- **Avatar**: validate MIME (image/png|jpeg|webp) + size ≤1MB
- **CSRF**: Next.js Server Actions có built-in protection
- **Không cho đổi email**: phải qua admin (Phase 5 OTP)

---

## 4. Rủi ro

| Rủi ro | Mitigation |
|--------|-----------|
| User.avatar field migrate sai Epic I | Verify field tồn tại trước khi code |
| Forgot password deferred → user vẫn cần admin reset | Document trong UI: "Liên hệ admin để reset" |
| Rate limit in-memory không persist qua restart | Acceptable cho MVP, Redis ở Phase 5 |
| Session tracking chưa có → Security page chỉ show basics | Phase 5 sẽ expand |

---

## 5. Out of scope cho MVP

- ❌ Forgot password qua email
- ❌ 2FA
- ❌ Notification preferences
- ❌ Sessions management
- ❌ API tokens
- ❌ Email change OTP
- ❌ Account deletion

---

## 6. Liên kết

- **MSEW gốc:** `docs/plan/MSEW-user-panel.md`
- **CONTEXT:** `docs/plan/CONTEXT-user-panel.md` (file này)
- **Skill routing:** `docs/plan/SKILL-ROUTING-user-panel.md`
- **Acceptance criteria:** `docs/plan/ACCEPTANCE-user-panel.md`
- **Workflow status:** `docs/exec/WORKFLOW-STATUS-user-panel.md`

---

**HẾT CONTEXT-user-panel.md**
