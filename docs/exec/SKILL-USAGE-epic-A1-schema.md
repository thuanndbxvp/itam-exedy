# Nhật ký Sử dụng Skill (SKILL-USAGE) — epic-A1-schema

## Step 1: Backup
- **Skill được MSEW giao (Assigned):** (không chỉ định — step thuần file IO)
- **Skill gọi thực tế (Invoked):** (không gọi skill; chỉ chạy shell `Copy-Item`)
- **Thời gian (Timestamp):** 2026-07-25 23:28
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** Backup an toàn 3 file, không sửa logic. Workspace không phải git repo nên không chạy `git add -A && git commit`.

### Step 1 — CodeGraph Usage
- **Invoked tools:** (không dùng — step chỉ IO, không có symbol logic)
- **Purpose:** N/A
- **Result:** N/A

---

## Step 2: Rewrite prisma/schema.prisma
- **Skill được MSEW giao (Assigned):** databases (ref MSEW §BƯỚC 2 không chỉ định chính, ngầm định là databases)
- **Skill gọi thực tế (Invoked):** databases
- **Thời gian (Timestamp):** 2026-07-25 23:33
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** Copy-paste schema từ MSEW, sau đó Prisma 7 báo 4 lỗi back-relation thiếu + `url` không còn trong `datasource`. Sửa tối thiểu (không thay đổi invariant nghiệp vụ, chỉ thêm relation name "CompanyMember" cho User.company, loại bỏ `Category.assets`/`Manufacturer.assets` vì Asset không có FK trực tiếp, bỏ `url` khỏi datasource vì prisma.config.ts đã có). Validate PASS.

### Step 2 — CodeGraph Usage
- **Invoked tools:** (không dùng — schema là data model, không có call graph)
- **Purpose:** N/A
- **Result:** N/A

---

## Step 3: Generate migration / db push
- **Skill được MSEW giao (Assigned):** databases
- **Skill gọi thực tế (Invoked):** databases
- **Thời gian (Timestamp):** 2026-07-25 23:37
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** `npx prisma migrate dev` phát hiện drift (DB cũ chưa có migration history), fallback `db push --force-reset --accept-data-loss` theo đúng PLAN §9.1 Q2. Prisma 7 yêu cầu explicit consent cho lệnh nguy hiểm → set env var PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION với text consent từ PLAN. Result: reset Neon OK, sync 25.95s. Sau đó `prisma generate` PASS 1.54s.

### Step 3 — CodeGraph Usage
- **Invoked tools:** (không dùng)
- **Purpose:** N/A
- **Result:** N/A

---

## Step 4: CHECK constraints
- **Skill được MSEW giao (Assigned):** databases
- **Skill gọi thực tế (Invoked):** databases
- **Thời gian (Timestamp):** 2026-07-25 23:39
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** Prisma 7 đã bỏ `--schema` flag của `db execute` → chạy không có flag, vẫn OK vì `prisma.config.ts` đã có datasource URL. Verify bằng custom script `scripts/verify-check-constraints.ts` (dùng pg query `pg_constraint`) → cả 2 CHECK constraint đã apply đúng. Có 15 tables trong schema public (14 model chính + CompanyUser pivot).

### Step 4 — CodeGraph Usage
- **Invoked tools:** (không dùng)
- **Purpose:** N/A
- **Result:** N/A

---

## Step 5: Rewrite seed.ts
- **Skill được MSEW giao (Assigned):** databases, backend-development
- **Skill gọi thực tế (Invoked):** databases, backend-development
- **Thời gian (Timestamp):** 2026-07-25 23:42
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** Cài `bcryptjs @types/bcryptjs` trước (đã có sẵn user consent Q3). Copy-paste nguyên văn seed.ts từ MSEW. Dùng đúng `seats: { create: [...] }` (không phải `seatsRel` để tránh bug MSEW cũ). Run `npx tsx prisma/seed.ts` PASS 41.2s, insert đủ 14 model + 5 LicenseSeat + 1 ActionLog.

### Step 5 — CodeGraph Usage
- **Invoked tools:** (không dùng)
- **Purpose:** N/A
- **Result:** N/A

---

## Step 6: Verify data (post-seed)
- **Skill được MSEW giao (Assigned):** databases
- **Skill gọi thực tế (Invoked):** databases
- **Thời gian (Timestamp):** 2026-07-25 23:44
- **Độ hiệu quả (Effectiveness):** HIGH
- **Ghi chú (Notes):** Thay vì Prisma Studio (cần GUI), tôi viết `scripts/verify-epic-A1-data.ts` dùng pg query thẳng vào Neon → 14 model + 5 LicenseSeat + 1 ActionLog + 3 User đều PASS, đếm COUNT từng bảng, hiển thị data mẫu.

### Step 6 — CodeGraph Usage
- **Invoked tools:** (không dùng)
- **Purpose:** N/A
- **Result:** N/A

