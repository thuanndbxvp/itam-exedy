# SKILL ROUTING — EPIC F: Settings Page

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Primary Skill

| Skill | Trọng số | Lý do |
|-------|-----------|--------|
| **backend-development** | 90% | Prisma schema, raw queries, server actions |

---

## 2. Secondary Skills

| Skill | Trọng số | Lý do |
|-------|-----------|--------|
| **databases** | 80% | PostgreSQL, Prisma migrations, raw SQL |
| **frontend-development** | 70% | Next.js pages, React components, Tailwind |
| **typescript-pro** | 60% | Type safety, generic types |

---

## 3. Step-by-step Skill Mapping

### Bước 0: Pre-Audit
- **Skill:** backend-development
- **Công việc:** Verify tsc + jest baseline

### Bước 1: Prisma Schema (`Setting` model)
- **Skill:** databases
- **Tools:** Prisma migrate, Prisma Studio
- **Notes:** Dùng raw query thay vì Prisma standard vì `@ignore`

### Bước 2: Migrate
- **Skill:** databases
- **Tools:** `npx prisma migrate dev`

### Bước 3: Seed
- **Skill:** backend-development
- **Tools:** `npx prisma db seed`

### Bước 4: Settings lib
- **Skill:** backend-development
- **Tools:** Prisma raw queries, TypeScript

### Bước 5: Settings actions
- **Skill:** backend-development
- **Tools:** Next.js Server Actions, RBAC

### Bước 6: Settings layout
- **Skill:** frontend-development
- **Tools:** Next.js nested layout, AppShell

### Bước 7: SettingsSidebar
- **Skill:** frontend-development
- **Tools:** React, Tailwind, lucide-react icons

### Bước 8-9: General page + SettingsForm
- **Skill:** frontend-development + typescript-pro
- **Tools:** react-hook-form, zod, Tailwind

### Bước 10-11: Status page + StatusLabelTable
- **Skill:** frontend-development + backend-development
- **Tools:** Modal, Toast, Fetch API

### Bước 12: Proxy update
- **Skill:** backend-development
- **Tools:** Next.js middleware config

### Bước 13: Final verify
- **Skill:** backend-development
- **Tools:** tsc, jest, playwright

---

## 4. CodeGraph Integration

### Symbols cần verify trước

| Symbol | Công cụ | Mục đích |
|--------|---------|-----------|
| `requireRole` | `codegraph_callers` | Đếm số caller — verify không break |
| `CommandResult` | `codegraph_node` | Xem signature hiện tại |
| `prisma` | `codegraph_node` | Xem import path |

### Impact analysis sau khi code

| Symbol | Công cụ | Expected impact |
|--------|---------|----------------|
| `proxy.ts` | `codegraph_impact` | Thêm `/settings/:path*` vào matcher |
| `auth-guard.ts` | `codegraph_callers` | +3 callers mới (settings actions) |

---

## 5. External Skills / MCP

### Không cần
- Git MCP — không có git operations phức tạp
- Database MCP — dùng Prisma CLI

---

## 6. Estimated Skill Usage

| Skill | % thời gian |
|-------|-------------|
| backend-development | 55% |
| frontend-development | 35% |
| databases | 8% |
| typescript-pro | 2% |

---

**HẾT SKILL-ROUTING-epic-F-settings-page.md**
