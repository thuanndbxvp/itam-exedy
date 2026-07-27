# Bug Report: Cannot delete User — Foreign key constraint violated

**Reporter:** User (via screenshot)
**Ngày:** 2026-07-28 03:18 UTC+7
**Severity:** High — chặn thao tác quản trị quan trọng (GDPR/cleanup)
**Repro:** 100% (dựa trên evidence)

---

## 1. Tóm tắt lỗi

Khi Admin cố xóa một User qua UI `DELETE /api/settings/users/[id]`, Prisma ném ra ngoại lệ:

```
PrismaClientKnownRequestError: 
  Invalid `prisma.user.delete()` invocation:
  
  Foreign key constraint violated: `Ticket_assignedToId_fkey`

  → An operation failed because it depends on one or more records that were required but not found.
  
  details: {
    fields: ('assignedToId'),
    where: ('id' = 'cmfr0p5kp000210mn3z6z3zbh'),
    model: 'Ticket'
  }
```

**Câu hỏi sếp:** "có phải do liên quan đến lịch sử cấp phát tài sản?"

**Đáp án: KHÔNG.** Asset đã có `onDelete: SetNull` nên tự động clear FK. Lỗi là do **Ticket** — user bị xóa đang giữ FK ở **Ticket (có thể là `assigneeId` hoặc `assignedToId` nếu schema cũ)**. Đây là bằng chứng rằng user đã từng nhận ticket hoặc tạo ticket.

---

## 2. Root Cause — Phân tích kỹ thuật

### 2.1 Code DELETE user hiện tại

**File:** `src/app/api/settings/users/[id]/route.ts:189-209`

```typescript
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.delete')
    const { id } = await params
    if (id === 'system') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Không thể xóa tài khoản hệ thống.' },
        { status: 400 },
      )
    }
    const existing = await prisma.user.findUnique({ where: { id } })
    await prisma.user.delete({ where: { id } })      // ← Hard delete, không pre-check FK
    if (existing) {
      const name = [existing.firstName, existing.lastName].filter(Boolean).join(' ')
      await recordAudit(actor.id, 'DELETE', 'USER', id, `Xóa người dùng "${name}"`)
    }
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}
```

**Vấn đề:**
1. ❌ **Không pre-check** các bảng phụ thuộc trước khi xóa
2. ❌ **Không soft-delete** (User model có `deletedAt` nhưng DELETE API không dùng)
3. ❌ **Không thông báo cho admin** biết user này còn ràng buộc ở đâu
4. ❌ **Trả raw Prisma error** cho client (P2003) → UX kỹ thuật, không thân thiện

### 2.2 Schema FK mapping (evidence từ `prisma/schema.prisma`)

**Các model có FK trỏ về User, phân tích theo `onDelete` behavior:**

| Model | Field | Type | onDelete | Xóa user có safe? | Impact |
|-------|-------|------|----------|-------------------|--------|
| **Ticket.reporterId** | `User` (NOT NULL) | **Restrict** | ❌ **BLOCK** | User đã tạo ticket → không xóa được |
| **Ticket.assigneeId** | `User?` | SetNull | ✅ | Auto set NULL (theo line 696) |
| **Ticket.closedById** | `User?` | SetNull | ✅ | Auto set NULL |
| **TicketComment.authorId** | `User` (NOT NULL) | **Restrict** | ❌ **BLOCK** | User đã comment → không xóa được |
| **TicketAttachment.uploaderId** | `User` (NOT NULL) | **Restrict** | ❌ **BLOCK** | User đã upload file → không xóa được |
| **ActionLog.userId** | `User` (NOT NULL) | **Restrict** | ❌ **BLOCK** | Audit log immutable |
| Asset.assignedUserId | `User?` | SetNull | ✅ | Asset history giữ nguyên |
| LicenseSeat.assignedUserId | `User?` | SetNull | ✅ | |
| AssetMaintenance.createdById | `User?` | SetNull | ✅ | |
| Location.managerId | `User?` | SetNull | ✅ | |
| Department.managerId | `User?` | SetNull | ✅ | |
| Team.leadId | `User?` | SetNull | ✅ | |
| TeamMember.userId | `User` | Cascade | ✅ | Tự xóa theo |
| CompanyUser.userId | `User` | Cascade | ✅ | Tự xóa theo |
| UserManager (self) | `User?` | SetNull | ✅ | |
| HelpdeskNotification.userId | `User` | Cascade | ✅ | Tự xóa theo |
| UserPermission.userId | `User` | Cascade | ✅ | Tự xóa theo |
| CompanyUsers (junction) | `User` | Cascade | ✅ | Tự xóa theo |

### 2.3 Conflict với ảnh error

Ảnh error nói field `assignedToId` nhưng schema hiện tại có `assigneeId`. Có 2 khả năng:

**Khả năng A — DB đang chạy schema cũ:**
- BRAINSTORM-ARCHITECTURE.md (line 120-121) đang dùng `assignedToId` (legacy)
- DB có thể đã chạy từ version cũ, chưa migrate sang `assigneeId`
- Prisma mismatch → Prisma vẫn map đúng nếu cùng FK concept, nhưng error trả về field name gốc của DB

**Khả năng B — DB có cả 2 field (migrate không hoàn chỉnh):**
- Schema cũ có `assignedToId` (giữ lại qua DROP COLUMN thất bại)
- Schema mới add `assigneeId`
- Cả 2 cùng enforce FK constraint

→ Recommend **check live DB schema** trước khi fix:

```sql
-- Verify field names
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Ticket' 
  AND column_name IN ('assignedToId', 'assigneeId', 'reporterId', 'closedById');

-- List current FK constraints on Ticket
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint 
WHERE conrelid = 'Ticket'::regclass 
  AND contype = 'f';
```

---

## 3. Tại sao KHÔNG phải do lịch sử cấp phát tài sản

Để confirm, tôi đã kiểm tra cả asset FK chain:

### 3.1 Asset.assignedUserId

```prisma
// prisma/schema.prisma:408-409
assignedUserId     String?
assignedUser       User?     @relation("AssetAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
```

**`onDelete: SetNull`** → xóa User → Prisma tự động set `Asset.assignedUserId = NULL`. **KHÔNG gây lỗi FK.**

Asset trước đó có gán cho user X (tức là lịch sử cấp phát) → user X bị xóa → FK tự động clear → asset chuyển về trạng thái "chưa cấp phát". Asset row KHÔNG bị xóa, audit log vẫn còn trong `ActionLog`.

### 3.2 ActionLog.userId — vẫn giữ lịch sử

```prisma
// prisma/schema.prisma:619
user       User        @relation("ActionLogActor", fields: [userId], references: [id], onDelete: Restrict)
```

**Nếu user đã từng được log trong ActionLog** (CHECKOUT, CHECKIN, CREATE, UPDATE) → FK Restrict **chặn xóa**.

→ Đây là điểm mấu chốt: **Audit log có Restrict** vì lý do compliance/audit trail. Tuy nhiên hiện tại **KHÔNG thể xóa user có lịch sử audit log** → conflict giữa 2 yêu cầu (GDPR "right to be forgotten" vs audit trail retention).

### 3.3 Kết luận

```
Lỗi KHÔNG phải do:
  ❌ Asset.assignedUserId (SetNull → safe)
  ❌ LicenseSeat.assignedUserId (SetNull → safe)
  ❌ Asset history (audit log chỉ là insert, không block)

Lỗi CÓ THỂ do (4 model có Restrict):
  ❓ Ticket.reporterId ← NGHI VẤN CHÍNH (theo ảnh error)
  ❓ TicketComment.authorId
  ❓ TicketAttachment.uploaderId
  ❓ ActionLog.userId
```

---

## 4. Repro steps

```bash
# 1. Login admin → bấm xóa user có ID 'cmfr0p5kp000210mn3z6z3zbh'
# 2. Frontend call: DELETE /api/settings/users/cmfr0p5kp000210mn3z6z3zbh
# 3. Backend gọi prisma.user.delete({ where: { id } })
# 4. Postgres phát hiện Ticket có FK trỏ về user này (Restrict) → throw P2003
# 5. API trả error thô cho client
```

**Visual repro:** Xem ảnh trong ticket (screenshot Prisma error).

---

## 5. Impact

| Impact | Mô tả |
|--------|-------|
| **Blocked operation** | Admin không thể dọn dẹp user cũ (nghỉ việc, xóa test account, GDPR request) |
| **Data leakage risk** | User không bị xóa → thông tin cá nhân (email, phone, address) vẫn trong DB |
| **Compliance** | Vi phạm GDPR Article 17 (Right to Erasure) nếu user yêu cầu xóa |
| **Security** | Audit log immutable + không xóa được user = có thể có account "zombie" với permissions cũ |

---

## 6. Recommendation fix — 4 approaches

### Approach A — Soft-delete (Recommend) ⭐

**Idea:** Cho User có `deletedAt` column (đã có sẵn trong schema, line 349 với `deletedAt DateTime?` nhưng chưa được dùng cho User). Convert DELETE API sang soft-delete.

```typescript
// src/app/api/settings/users/[id]/route.ts:189-209
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.delete')
    const { id } = await params
    if (id === 'system') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Không thể xóa tài khoản hệ thống.' },
        { status: 400 },
      )
    }

    // Anonymize PII (GDPR Article 17 — right to be forgotten)
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // Optional: thay thế thông tin cá nhân bằng placeholder
        firstName: '[deleted]',
        lastName: null,
        email: `deleted-${id}@removed.local`,
        phone: null,
        mobile: null,
        username: `deleted_${id}`,
        avatar: null,
        activated: false,
      },
    })

    invalidatePermissionCache(id)
    
    const name = `[deleted user ${id}]`
    await recordAudit(actor.id, 'DELETE', 'USER', id, `Xóa người dùng "${name}" (soft-delete)`)
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}
```

**Cập nhật tất cả queries** để filter `deletedAt: null`:

```typescript
// Prisma middleware hoặc extension
prisma.$extends({
  query: {
    user: {
      findMany: ({ args, query }) => {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      findUnique: ({ args, query }) => {
        // Cần check cả findUnique → dùng findFirst thay
        return query(args)
      },
    },
  },
})
```

**Effort:** XS (0.5 ngày) — 1 file API + middleware.

**Trade-offs:**
- ✅ KHÔNG cần schema change
- ✅ KHÔNG trigger FK constraint
- ✅ Audit log giữ nguyên (recordAudit vẫn ghi được)
- ✅ GDPR compliant (PII anonymized)
- ⚠️ Cần update TẤT CẢ queries để filter `deletedAt: null`
- ⚠️ User "deleted" vẫn tồn tại trong DB (size impact: ~1KB/user)

---

### Approach B — Cascade hóa các Restrict FK ⭐⭐ (Best long-term)

**Idea:** Đổi `Restrict` → `SetNull` cho các FK có thể nullable (TicketComment.authorId phải đổi sang nullable).

**Schema changes:**

```prisma
// prisma/schema.prisma:619 — ActionLog.userId
// Hiện: userId String (NOT NULL) → Restrict
// Đổi:
userId     String?                                    // ← nullable
user       User?       @relation("ActionLogActor", fields: [userId], references: [id], onDelete: SetNull)

// prisma/schema.prisma:692 — Ticket.reporterId
// Reporter comment nói "KHÔNG đổi" → cần re-think:
// Option 1: Đổi sang SetNull + cho phép nullable + thêm "anonymous reporter" sentinel
reporterId String?                                    // ← nullable
reporter   User?   @relation("TicketReporter", fields: [reporterId], references: [id], onDelete: SetNull)

// prisma/schema.prisma:735 — TicketComment.authorId
authorId   String                                     // ← đổi nullable
author     User?     @relation(fields: [authorId], references: [id], onDelete: SetNull)

// prisma/schema.prisma:753 — TicketAttachment.uploaderId
uploaderId String                                     // ← đổi nullable
uploader   User?     @relation(fields: [uploaderId], references: [id], onDelete: SetNull)
```

**Migration:**

```bash
# Make all columns nullable + SetNull
npx prisma migrate dev --name make_user_fks_nullable_setnull
```

**SQL tự động sinh:**

```sql
-- Ticket
ALTER TABLE "Ticket" ALTER COLUMN "reporterId" DROP NOT NULL;
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_reporterId_fkey";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reporterId_fkey" 
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL;

-- TicketComment
ALTER TABLE "TicketComment" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "TicketComment" DROP CONSTRAINT "TicketComment_authorId_fkey";
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL;

-- TicketAttachment
ALTER TABLE "TicketAttachment" ALTER COLUMN "uploaderId" DROP NOT NULL;
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_uploaderId_fkey";
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploaderId_fkey" 
  FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL;

-- ActionLog
ALTER TABLE "ActionLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "ActionLog" DROP CONSTRAINT "ActionLog_userId_fkey";
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
```

**Effort:** S (1 ngày) — schema change + 1 migration + verify null handling trong UI.

**Trade-offs:**
- ✅ Hard-delete hoạt động (giải quyết triệt để)
- ✅ Audit log giữ nguyên (chỉ set NULL cho userId)
- ⚠️ Schema change + migration risk
- ⚠️ UI cần handle NULL: "Reporter: [deleted user]" / "Unknown user"
- ⚠️ Loss of referential integrity cho historical records (trade-off compliance vs accuracy)

---

### Approach C — Reassign trước khi xóa (Admin workflow)

**Idea:** Trước khi xóa, chuyển các record sang user "system" hoặc user khác.

```typescript
// src/app/api/settings/users/[id]/route.ts:189-209 (refactored)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.delete')
    const { id } = await params
    if (id === 'system') {
      return NextResponse.json(...)
    }

    // Reassign FKs sang "system" user
    const SYSTEM_USER_ID = 'system'
    
    // 1. Tickets where user is reporter → soft-archive (mark reporterId = null)
    await prisma.ticket.updateMany({
      where: { reporterId: id },
      data: { 
        // Option A: Set reporter = system (giữ audit)
        // reporterId: SYSTEM_USER_ID,
        // Option B: Archive ticket
        status: 'ARCHIVED',
      },
    })

    // 2. Tickets where user is assignee → unassign
    await prisma.ticket.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: null },
    })

    // 3. Comments → keep but anonymize
    await prisma.ticketComment.updateMany({
      where: { authorId: id },
      data: { 
        // Set author to a "deleted user" sentinel — or NULL if FK allows
        // authorId: 'deleted-sentinel',
        content: '[Comment by deleted user]',
      },
    })

    // 4. Attachments → keep file but unlink uploader
    await prisma.ticketAttachment.updateMany({
      where: { uploaderId: id },
      data: { uploaderId: null },  // Requires FK nullable
    })

    // 5. ActionLog → can't reassign, must soft-delete
    // ...

    await prisma.user.delete({ where: { id } })
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}
```

**Effort:** M (1.5 ngày) — nhiều query + transaction + UI hiển thị "reassigned to system".

**Trade-offs:**
- ✅ Không schema change
- ✅ Có thể giữ audit trail bằng "system" user
- ⚠️ Phức tạp — phải handle từng model
- ⚠️ Race condition nếu concurrent writes
- ⚠️ Vẫn bị ActionLog block (Restrict)

---

### Approach D — Hybrid: Soft-delete cho User + Pre-check cho hard-delete ⭐⭐⭐

**Idea:** Soft-delete mặc định (Approach A), nhưng cho admin force hard-delete với pre-check + transaction.

```typescript
export async function DELETE(req: NextRequest, { params }) {
  const { force } = await req.json().catch(() => ({}))  // body: { force: boolean }
  
  if (force) {
    // Pre-check FKs
    const [ticketsAsReporter, comments, attachments, actionLogs] = await Promise.all([
      prisma.ticket.count({ where: { reporterId: id } }),
      prisma.ticketComment.count({ where: { authorId: id } }),
      prisma.ticketAttachment.count({ where: { uploaderId: id } }),
      prisma.actionLog.count({ where: { userId: id } }),
    ])

    if (ticketsAsReporter || comments || attachments || actionLogs) {
      return NextResponse.json({
        ok: false,
        code: 'FOREIGN_KEY_VIOLATION',
        message: `User có ${ticketsAsReporter} tickets, ${comments} comments, ${attachments} attachments, ${actionLogs} audit logs. Không thể hard-delete.`,
        details: { ticketsAsReporter, comments, attachments, actionLogs },
      }, { status: 409 })
    }

    await prisma.user.delete({ where: { id } })
  } else {
    // Soft-delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), activated: false, /* PII anonymize */ },
    })
  }
  
  invalidatePermissionCache(id)
  return okResponse(undefined)
}
```

**Effort:** S (1 ngày) — extend DELETE + thêm query + UI confirm.

**Trade-offs:**
- ✅ Best UX: admin chọn soft-delete (mặc định) hoặc hard-delete (rare case)
- ✅ Error message rõ ràng cho admin biết user còn ràng buộc ở đâu
- ✅ Không mất audit trail (soft-delete giữ nguyên FK)
- ⚠️ UI cần thêm confirm modal "Force hard-delete?"

---

## 7. Recommendation cuối cùng

| Approach | Effort | Risk | Recommend | Note |
|----------|--------|------|-----------|------|
| A. Soft-delete | XS (0.5d) | Low | ✅ **Short-term** | Giải quyết nhanh |
| B. Cascade FK | S (1d) | Medium | ✅ **Long-term** | Schema change 1 lần |
| C. Reassign | M (1.5d) | Medium | ⚠️ | Phức tạp, không giải ActionLog |
| D. Hybrid | S (1d) | Low | ✅ **Best UX** | Soft-delete mặc định + force hard-delete |

**Khuyến nghị cuối:** **Hybrid (D) ngắn hạn + Cascade FK (B) dài hạn**.

**Roadmap:**
1. **Ngay bây giờ (1 ngày):** Implement D — soft-delete mặc định + pre-check FK error. Fix được bug + admin hiểu rõ vấn đề.
2. **Sau Sprint A (1 ngày):** Implement B — cascade SetNull cho 4 FK Restrict. Long-term clean.

**Tại sao KHÔNG recommend C:** Approach C phức tạp nhất, vẫn bị ActionLog block, không giải quyết tận gốc.

---

## 8. Acceptance criteria

```
[ ] DELETE user với activated=false → soft-delete thành công
[ ] User sau soft-delete: deletedAt NOT NULL, PII anonymized
[ ] List users filter bỏ soft-deleted (UI không hiển thị)
[ ] Login bằng soft-deleted user → fail
[ ] Permission cache invalidated sau delete
[ ] Audit log vẫn ghi được (recordAudit vẫn chạy với actorId=admin)
[ ] Pre-check FK trả error 409 với message rõ ràng
[ ] Force hard-delete: cleanup tickets/comments/attachments/actionLogs theo policy
[ ] Test integration: tạo user → tạo ticket → xóa user → assert success
[ ] Test edge case: user có audit log → xóa cứng → assert error 409 với message
[ ] UI confirm modal: "User có X tickets. Bạn có chắc muốn xóa cứng?"
[ ] GDPR: sau soft-delete 30 ngày → job tự động anonymize PII còn sót
```

---

## 9. Files sẽ tạo/sửa

### Approach D (Hybrid) — Recommend short-term

```
src/app/api/settings/users/[id]/route.ts          (MODIFY, +20 dòng pre-check + soft-delete)
src/lib/prisma.ts                                  (MODIFY, +15 dòng extension filter deletedAt)
src/app/settings/users/page.tsx                    (MODIFY, +5 dòng filter deletedAt)
src/app/settings/users/[id]/page.tsx               (MODIFY, +5 dòng ẩn nút delete nếu đã soft-deleted)
src/components/users/DeleteUserDialog.tsx          (NEW, ~80 dòng modal confirm + show FK details)
tests/integration/users-soft-delete.test.ts        (NEW, ~150 dòng test soft-delete flow)
tests/integration/users-hard-delete.test.ts        (NEW, ~150 dòng test hard-delete with pre-check)
docs/admin/user-deletion-policy.md                (NEW, ~50 dòng policy cho admin)
```

### Approach B (Cascade FK) — Recommend long-term

```
prisma/schema.prisma                               (MODIFY, 4 dòng Restrict → SetNull + nullable)
prisma/migrations/20260728_make_user_fks_nullable_setnull/migration.sql  (AUTO-GENERATED)
src/app/tickets/[code]/page.tsx                    (MODIFY, +10 dòng handle NULL reporter)
src/components/tickets/TicketHeader.tsx            (MODIFY, +10 dòng show "[Reporter đã xóa]")
src/components/tickets/CommentItem.tsx             (MODIFY, +10 dòng show "[User đã xóa]")
src/components/tickets/AttachmentList.tsx          (MODIFY, +10 dòng show "[Uploader đã xóa]")
src/app/admin/audit/page.tsx                       (MODIFY, +10 dòng show "[Actor đã xóa]")
tests/integration/tickets-null-reporter.test.ts    (NEW, ~100 dòng test NULL handling)
```

**Total effort:**
- Approach D: ~1 ngày
- Approach B: ~1.5 ngày (nhiều UI touch)

---

## 10. Open questions cần sếp quyết

| # | Question | Recommend |
|---|----------|-----------|
| 1 | Soft-delete hay hard-delete mặc định? | **Soft-delete** (an toàn, GDPR) |
| 2 | Có cho force hard-delete? | **Có** — admin workflow (Approach D) |
| 3 | Sau soft-delete 30 ngày → có auto hard-delete? | **Có** — GDPR compliance |
| 4 | Khi force hard-delete, có reassign ticket sang "system" user? | **Có** — giữ audit trail |
| 5 | ActionLog user_id set NULL → có ảnh hưởng audit? | Set NULL + show "[Deleted user]" trong UI |
| 6 | Có backup DB trước khi hard-delete? | **Có** — snapshot vào storage 30 ngày |
| 7 | UI hiển thị FK conflicts (tickets, comments) trước khi confirm? | **Có** — UX minh bạch |
| 8 | Có block xóa nếu user còn quyền admin/IT? | **Có** — transfer role trước |

---

**HẾT BÁO CÁO**

Next step: Sếp chọn approach (recommend D short-term + B long-term), sau đó tôi scaffold code ngay.