# Plan: Review Bug Report "Delete User FK Constraint"

**Người lập:** Tier 2 (Reviewer)
**Ngày:** 2026-07-28 04:07 UTC+7
**Mục đích:** Review bug report `bug-report-delete-user-fk-constraint.md` để xác minh root cause + quyết approach fix

---

## 1. Mục tiêu review

Bug report hiện đang có các giả thuyết cần verify:

| # | Giả thuyết | Cần verify |
|---|------------|-----------|
| G1 | Lỗi FK do 1 trong 4 model: Ticket.reporter, TicketComment.author, TicketAttachment.uploader, ActionLog.user | Check live DB schema |
| G2 | Field name `assignedToId` (ảnh error) ≠ `assigneeId` (schema hiện tại) | Inspect production DB |
| G3 | User model đã có `deletedAt` column nhưng API không dùng | Read schema + API |
| G4 | Asset.assignedUserId + LicenseSeat.assignedUserId đều là SetNull → safe | Confirm bằng repro test |
| G5 | Đề xuất 4 approaches (A/B/C/D) — sếp chọn approach | Sếp decision |

---

## 2. Phạm vi review (6 verification steps)

### Step 1: Verify schema hiện tại vs live DB

**Mục đích:** Xác minh field name thực tế (`assignedToId` vs `assigneeId`).

**Action:**
```bash
# 1. Đọc schema.prisma để confirm field name
Read: prisma/schema.prisma (Ticket model, line 680-720)

# 2. Connect live DB để verify actual columns
# Cần sếp cấp quyền truy cập DB hoặc chạy query thông qua tooling
psql $DATABASE_URL -c "
  SELECT column_name, is_nullable, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'Ticket' 
    AND column_name IN ('assignedToId', 'assigneeId', 'reporterId', 'closedById')
  ORDER BY column_name;
"

# 3. List FK constraints trên Ticket
psql $DATABASE_URL -c "
  SELECT conname, pg_get_constraintdef(c.oid) AS definition
  FROM pg_constraint c
  WHERE conrelid = '\"Ticket\"'::regclass 
    AND contype = 'f'
  ORDER BY conname;
"
```

**Expected output:**
- 1 trong 2: `assignedToId` HOẶC `assigneeId` (KHÔNG cả 2)
- 4 FK: Ticket_reporterId_fkey (Restrict), Ticket_assigneeId_fkey (SetNull), Ticket_closedById_fkey (SetNull), Ticket_teamId_fkey (SetNull)

**Verification criteria:**
- [ ] Confirm tên field đúng
- [ ] Confirm constraint name
- [ ] Confirm onDelete behavior

---

### Step 2: Reproduce lỗi trong test environment

**Mục đích:** Chứng minh 100% reproducible.

**Action:**
```bash
# 1. Tạo seed data
psql $DATABASE_URL <<EOF
INSERT INTO "User" (id, email, "firstName", role, "createdAt", "updatedAt")
VALUES ('test-user-fk-block', 'testfk@example.com', 'FK Test User', 'EMPLOYEE', NOW(), NOW());

INSERT INTO "Ticket" (id, code, title, description, status, priority, "reporterId", "createdAt", "updatedAt")
VALUES ('test-ticket', 'TKT-TEST-001', 'Test ticket', 'Test desc', 'NEW', 'MEDIUM', 'test-user-fk-block', NOW(), NOW());
EOF

# 2. Try delete user
psql $DATABASE_URL -c "DELETE FROM \"User\" WHERE id = 'test-user-fk-block';"

# Expected:
# ERROR:  foreign key constraint "Ticket_reporterId_fkey" on table "Ticket" violates...

# 3. Cleanup
psql $DATABASE_URL <<EOF
DELETE FROM "Ticket" WHERE id = 'test-ticket';
DELETE FROM "User" WHERE id = 'test-user-fk-block';
EOF
```

**Verification criteria:**
- [ ] Reproduce được error message giống ảnh
- [ ] Confirm FK name chính xác (`Ticket_reporterId_fkey` hoặc `Ticket_assignedToId_fkey`)
- [ ] Cleanup thành công

---

### Step 3: Audit code DELETE user API

**Mục đích:** Verify bug report mô tả đúng về code hiện tại.

**Action:**
```bash
# 1. Read DELETE handler
Read: src/app/api/settings/users/[id]/route.ts (line 189-209)

# 2. Check có middleware xử lý FK error không
grep -rn "P2003\|ForeignKeyViolation" src/

# 3. Check có pre-check FK trước khi delete không
grep -A 30 "async function DELETE" src/app/api/settings/users/[id]/route.ts
```

**Expected findings:**
- [ ] API chỉ gọi `prisma.user.delete` thẳng, không pre-check
- [ ] Không có P2003 error handler → trả raw error cho client
- [ ] Không có soft-delete pattern ở API
- [ ] User.deletedAt column tồn tại nhưng không được dùng

---

### Step 4: Verify "không phải do lịch sử cấp phát tài sản"

**Mục địch:** Chứng minh asset FK chain là SetNull → safe.

**Action:**
```bash
# 1. Repro: tạo user + asset assigned cho user + delete user
psql $DATABASE_URL <<EOF
INSERT INTO "User" (id, email, "firstName", role, "createdAt", "updatedAt")
VALUES ('test-asset-user', 'testasset@example.com', 'Asset User', 'EMPLOYEE', NOW(), NOW());

INSERT INTO "Asset" (id, "assetTag", name, "statusId", "assignedUserId", "createdAt", "updatedAt")
VALUES ('test-asset', 'TEST-001', 'Test Laptop', 'some-status-id', 'test-asset-user', NOW(), NOW());

DELETE FROM "User" WHERE id = 'test-asset-user';
-- Expected: SUCCESS (no FK violation)

SELECT "assetTag", "assignedUserId" FROM "Asset" WHERE id = 'test-asset';
-- Expected: assignedUserId IS NULL

DELETE FROM "Asset" WHERE id = 'test-asset';
EOF
```

**Verification criteria:**
- [ ] User delete thành công (không FK error)
- [ ] Asset.assignedUserId auto-set NULL
- [ ] Asset row vẫn còn trong DB
- [ ] Audit log giữ nguyên (ActionLog rows)

**Repeat for LicenseSeat:**
- [ ] Tạo user + licenseSeat.assignedUserId = userId → delete user → success + licenseSeat.assignedUserId = NULL

---

### Step 5: Đánh giá 4 approaches

**Mục đích:** Compare A/B/C/D về effort, risk, trade-off để sếp quyết.

**Action:** Review bảng so sánh ở bug-report section 7. Đặc biệt check:

| Approach | Verify |
|----------|--------|
| A. Soft-delete | [ ] User.deletedAt đã có sẵn trong schema? (line 349) |
| B. Cascade FK | [ ] 4 FK constraints trên live DB có Restrict? (xác nhận bằng Step 1) |
| C. Reassign | [ ] Có "system" sentinel user chưa? (xem `WHERE id = 'system'` ở route.ts:193) |
| D. Hybrid | [ ] Đã có UI modal confirm chưa? (xem `DeleteUserDialog.tsx`) |

---

### Step 6: Decision matrix cho sếp

**Mục đích:** Đưa ra recommendation rõ ràng với trade-off explicit.

**Action:** Tổng hợp từ Step 1-5, recommend approach tối ưu.

---

## 3. Files sẽ đụng (verification)

| File | Action | Lý do |
|------|--------|-------|
| `prisma/schema.prisma` | READ | Verify FK onDelete behavior + User.deletedAt |
| `src/app/api/settings/users/[id]/route.ts` | READ | Verify DELETE handler không pre-check |
| `BRAINSTORM-ARCHITECTURE.md` | READ | Check legacy schema có `assignedToId` |
| `prisma/sql/phase1_check_constraints.sql` | READ | Check có logic FK riêng không |
| `prisma/seed*.ts` | READ | Check có seed user "system" không |

**Live DB queries (cần sếp cấp access):**
- `INFORMATION_SCHEMA.COLUMNS` cho Ticket table
- `pg_constraint` cho FK constraints
- Repro script (Step 2)

---

## 4. Tiêu chí review xong (Done criteria)

```
Evidence verification
[ ] G1 verified — biết chính xác 4 FK nào có Restrict
[ ] G2 verified — biết chính xác field name (assignedToId vs assigneeId)
[ ] G3 verified — User.deletedAt column có tồn tại không
[ ] G4 verified — Asset FK chain thực sự safe

Code analysis
[ ] API DELETE handler mô tả đúng (không pre-check, không soft-delete)
[ ] P2003 error không được handle riêng → UX kỹ thuật

Approaches evaluation
[ ] A. Soft-delete — effort, risk đã đánh giá
[ ] B. Cascade FK — schema change đã phân tích
[ ] C. Reassign — có user "system" sentinel?
[ ] D. Hybrid — UI confirm modal có sẵn?

Decision
[ ] Recommend approach rõ ràng cho sếp
[ ] Roadmap ngắn hạn vs dài hạn
[ ] Files cần sửa + effort estimate
```

---

## 5. Effort review

| Phase | Effort | Note |
|-------|--------|------|
| Step 1: Schema + DB verify | XS (0.5h) | Đọc schema + query DB |
| Step 2: Repro test | XS (0.5h) | SQL script 5 phút |
| Step 3: Code audit | XS (0.25h) | Đã đọc khi khảo sát |
| Step 4: Asset FK verify | XS (0.25h) | SQL script |
| Step 5: Compare 4 approaches | XS (0.5h) | Tổng hợp bảng có sẵn |
| Step 6: Decision matrix | XS (0.25h) | Recommend A+D combo |
| **Total review** | **~2h** | |

---

## 6. Risk của review

| Risk | Mitigation |
|------|-----------|
| DB không accessible từ dev env | Sếp chạy query gửi kết quả, hoặc dùng Prisma Studio local |
| Test data trong DB production khác với giả thuyết | Confirm bằng Step 1 query trước |
| 4 approaches có overlap với sprint khác | Check roadmap MSEW-epic-* trước |

---

## 7. Output của review

Sau khi review xong, file output sẽ chứa:

1. **Verified root cause** — chính xác FK nào block, vì sao
2. **Field name confirmed** — assignedToId hay assigneeId
3. **Recommended approach** — chọn 1 trong A/B/C/D với lý do
4. **Implementation roadmap** — sprint nào, files nào, bao lâu
5. **Open questions** — list câu cần sếp quyết

---

## 8. Sequence thực hiện

```
[Step 1: Schema + DB verify]    (0.5h)
        ↓
[Step 2: Repro test]            (0.5h)
        ↓
[Step 3: Code audit]            (0.25h)
        ↓
[Step 4: Asset FK verify]       (0.25h)
        ↓
[Step 5: Compare approaches]    (0.5h)
        ↓
[Step 6: Decision matrix]       (0.25h)
        ↓
[Output: Verified report]       (0.25h)
        ↓
[Sếp review + decision]
```

**Total: ~2.5h** (bao gồm output writing)

---

## 9. Câu hỏi cần sếp confirm trước khi review

1. **Sếp có quyền truy cập live DB** (qua psql hoặc Prisma Studio) không? → Nếu không, tôi sẽ review dựa trên schema + code analysis only.
2. **Sếp muốn review ngay hay có thêm verify steps** (vd: integration test trên staging)?
3. **Sếp muốn recommend approach ngay** trong output, hay để sếp tự chọn sau khi đọc verified report?

---

## 10. Next step sau review

Sau khi sếp approve approach (recommend D short-term + B long-term):

1. **Ngay:** Implement Approach D — soft-delete + pre-check FK
   - File: `src/app/api/settings/users/[id]/route.ts` (MODIFY)
   - File: `src/components/users/DeleteUserDialog.tsx` (NEW)
   - Effort: ~1 ngày

2. **Sprint sau:** Implement Approach B — cascade SetNull
   - File: `prisma/schema.prisma` (MODIFY)
   - Migration tự động
   - Effort: ~1.5 ngày

3. **Test integration:**
   - `tests/integration/users-soft-delete.test.ts` (NEW)
   - `tests/integration/users-hard-delete.test.ts` (NEW)

---

**HẾT PLAN**

Plan này ready để sếp review. Approve thì tôi chạy Step 1-6.