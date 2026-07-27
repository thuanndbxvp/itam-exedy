# CONTEXT — EPIC F: Settings Page

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27
**Epic cha:** Phase 2 — Admin Settings
**Phụ thuộc:** A1 · A2 · B · C · C+0.5 · C+1 · D · E · E+1

---

## 1. Tổng quan dự án

### Project: IT-Management System
- **Stack:** Next.js 16 · Prisma 7 · PostgreSQL · NextAuth v4.24 · Tailwind CSS 4
- **Kiểu:** Admin dashboard cho IT asset management (fork từ Snipe-IT)
- **Phase hiện tại:** Phase 2 — Admin Settings

### Mục tiêu Epic F
Cung cấp giao diện Settings để admin có thể:
- Thay đổi cấu hình hệ thống (company name, currency, timezone)
- CRUD Status Labels, Categories, Companies, Users
- Xem Audit Log
- Cấu hình Branding, Security, Email, Depreciation

---

## 2. Domain entities liên quan

| Entity | Mô tả | Nơi định nghĩa |
|--------|--------|-----------------|
| `Setting` | Singleton record cho system config | Phải tạo mới |
| `StatusLabel` | Nhãn trạng thái (Sẵn sàng, Chờ duyệt...) | `prisma/schema.prisma` |
| `Category` | Danh mục tài sản | `prisma/schema.prisma` |
| `Company` | Công ty (FMCS) | `prisma/schema.prisma` |
| `User` | Người dùng hệ thống | `prisma/schema.prisma` |
| `Depreciation` | Quy tắc khấu hao | `prisma/schema.prisma` |
| `ActionLog` | Nhật ký hành động | `prisma/schema.prisma` |

---

## 3. Tech stack đã dùng trong dự án

### Backend
| Tech | Version | Vai trò |
|------|---------|---------|
| Next.js | 16.2.11 | App Router, Server Components |
| Prisma | 7.9.0 | ORM, Schema, Migrations |
| PostgreSQL | - | Database |
| NextAuth | 4.24.15 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| pg | 8.22.0 | PostgreSQL driver |

### Frontend
| Tech | Version | Vai trò |
|------|---------|---------|
| React | 19.2.4 | UI Library |
| Tailwind CSS | 4 | Styling |
| Lucide React | 1.26.0 | Icons |
| react-hook-form | **MỚI** | Form state |
| zod | **MỚI** | Validation |

### Testing
| Tech | Version | Vai trò |
|------|---------|---------|
| Jest | 29.7.0 | Unit/Integration tests |
| Playwright | 1.62.0 | E2E tests |

---

## 4. Existing patterns để reuse

### Server Actions
- `src/app/actions/asset.ts` — pattern `runCommand` + `CommandResult`
- `src/app/actions/license.ts` — pattern tương tự

### UI Components
- `src/components/ui/Modal.tsx` — modal wrapper (reusable)
- `src/components/Toast.tsx` — toast notifications
- `src/components/assets/CheckoutAssetModal.tsx` — form pattern cho modal CRUD

### Auth/RBAC
- `src/lib/auth-guard.ts` — `requireRole('ADMIN')`
- `src/proxy.ts` — route protection

---

## 5. Schema hiện tại (phần liên quan)

### Models đã có trong `prisma/schema.prisma`
- `StatusLabel` ✅
- `Category` ✅
- `Company` ✅
- `User` ✅
- `Depreciation` ✅
- `ActionLog` ✅

### Models cần tạo mới
- `Setting` — **MỚI** (singleton, lưu system config)

---

## 6. Routing structure

### Existing routes
```
/login           — Auth page
/                — Dashboard
/assets          — Asset list
/assets/[id]     — Asset detail
/licenses        — License list
```

### Routes cần tạo
```
/settings                — Redirect /settings/general
/settings/general       — F-1: General settings
/settings/branding       — F-2: Branding
/settings/security      — F-3: Security
/settings/companies     — F-4: Company CRUD
/settings/users         — F-5: User CRUD
/settings/statuses      — F-6: Status Labels CRUD
/settings/categories    — F-7: Category CRUD
/settings/depreciation  — F-8: Depreciation
/settings/email         — F-9: Email SMTP
/settings/audit-log     — F-10: Audit log viewer
```

---

## 7. Biến môi trường liên quan

| Variable | Mô tả |
|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT secret |
| `NEXTAUTH_URL` | Base URL |

---

## 8. Assumptions & Constraints

### Assumptions
1. Admin luôn là `ADMIN` role — không có super-admin riêng
2. Settings là system-wide, không per-company (multi-tenant defer Phase 3)
3. Logo chỉ URL, không upload file (S3 defer Phase 3)
4. Email chỉ mock, không gửi thật (SMTP defer Phase 2.2)

### Constraints
1. `Setting` model dùng `@ignore` vì Prisma không generate singleton tốt
2. Phải dùng raw query cho Setting operations
3. EMPLOYEE role không được truy cập settings

---

**HẾT CONTEXT-epic-F-settings-page.md**
