# Báo cáo Điểm nghẽn (BLOCKERS) — epic-C+1-rbac

**Người lập:** Tier 2 (Coder / Auditor)
**Ngày lập:** 2026-07-26
**Mục đích:** Ghi nhận các ambiguity Tier 2 gặp phải trong quá trình thi công + cách giải quyết.

---

## Blocker #1 — MSEW gốc dùng `requireRole(['ADMIN'])` (array) + return `{id, role}`, nhưng Tier 2 prompt yêu cầu `requireRole('ADMIN')` (string) + return `void`

- **Phát hiện tại Workflow Step:** BƯỚC 2 (thiết kế `requireRole`)
- **Loại Blocker (Type):** [ Spec conflict giữa MSEW và Tier 2 prompt — Tier 2 chọn Tier 2 prompt (authoritative) ]
- **Mô tả chi tiết (Description):**

  MSEW BƯỚC 2 viết:
  ```typescript
  export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; role: Role }> {
    // ...
    if (!allowedRoles.includes(session.user.role)) {
      throw new ForbiddenError(...);
    }
    return { id: session.user.id, role: session.user.role };
  }
  ```

  Tuy nhiên, Tier 2 prompt (chat instruction) yêu cầu:
  ```typescript
  export async function requireRole(role: Role): Promise<void> {
    // ...
    if (session.user.role !== role) {
      throw new ForbiddenError(...);
    }
  }
  ```

  Hai spec khác nhau:
  - **MSEW**: array input (multi-role), return value (id + role).
  - **Tier 2 prompt**: single string input (single role), return void.

- **Decision Tier 2 đưa ra:**

  Tier 2 chọn **Tier 2 prompt** (authoritative) vì:
  1. Tier 2 prompt là instruction trực tiếp từ user cho task này (chat message từ user).
  2. Test cases Tier 2 cũng confirm single-role: "requireRole('ADMIN') với role EMPLOYEE → throw".
  3. Phase 1 chỉ có 2 role, không cần multi-role.
  4. API đơn giản hơn (void return → caller không cần destructure).

  Signature cuối cùng Tier 2 implement:
  ```typescript
  export async function requireRole(role: Role): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.role) {
      throw new ForbiddenError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.', { requiredRole: role });
    }
    if (session.user.role !== role) {
      throw new ForbiddenError(
        `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${role} — Role hiện tại: ${session.user.role}.`,
        { requiredRole: role, currentRole: session.user.role, userId: session.user.id }
      );
    }
  }
  ```

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Tier 2 prompt được viết bởi chính Tier 1 (hoặc người quản lý) cho task này.
  - Tier 2 chỉ cần chọn spec nào authoritative → Tier 2 prompt thắng vì là tasking gần nhất.
  - Phase 2 sẽ refactor sang array version nếu cần multi-role.

- **Tier 2 đã làm gì:**

  - Implement `requireRole(role: Role): Promise<void>` thay vì `requireRole(allowedRoles: Role[]): Promise<...>`.
  - Test cases update để match: `requireRole('ADMIN')` thay vì `requireRole(['ADMIN'])`.
  - Ghi nhận trong CHANGELOG-EXEC §"Divergence từ MSEW gốc #1" + SKILL-USAGE §"Anti-patterns" + WORKFLOW-STATUS §"Ghi chú cuối".

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — Tier 2 implement theo Tier 2 prompt. Phase 2 sẽ refactor sang array nếu cần.

---

## Blocker #2 — MSEW liệt kê 5 functions trong license.ts nhưng file thực tế chỉ có 4

- **Phát hiện tại Workflow Step:** BƯỚC 4 (wire `requireRole` vào license.ts)
- **Loại Blocker (Type):** [ MSEW count mismatch với source code — Tier 2 follow source code (authoritative) ]
- **Mô tả chi tiết (Description):**

  MSEW BƯỚC 4 + Phụ lục A viết "5 server actions trong license.ts" và "wire requireRole vào 5 functions". Tuy nhiên đọc `src/app/actions/license.ts` chỉ có 4 exported functions:
  1. `createLicense`
  2. `checkoutLicenseSeatCmd`
  3. `checkinLicenseSeatCmd`
  4. `expireLicenseSeatCmd`

  Tier 2 prompt cũng list 4 functions (match với source code). MSEW có thể đã count nhầm `runCommand` helper là 1 function riêng.

- **Decision Tier 2 đưa ra:**

  Tier 2 follow **source code** (authoritative) — wire 4 requireRole calls trong license.ts. Verify bằng grep:
  ```
  $ grep -c "requireRole('ADMIN')" src/app/actions/license.ts
  4
  ```

  Tổng 8 requireRole calls (4 asset + 4 license) match với số protected server actions thực tế.

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Source code là ground truth, không có cách nào wire 5 calls khi chỉ có 4 functions.
  - Tier 2 prompt (authoritative) cũng list 4.
  - Ghi nhận trong CHANGELOG-EXEC §"Divergence từ MSEW gốc #2" để Tier 1 update MSEW cho tương lai.

- **Tier 2 đã làm gì:**

  - Wire đúng 4 requireRole calls vào 4 functions có thật trong `src/app/actions/license.ts`.
  - KHÔNG tạo function mới để match MSEW count.
  - Ghi nhận trong CHANGELOG-EXEC.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — wire đúng số functions có thật. Tier 1 nên update MSEW sau này.

---

## Tổng kết tình hình

| # | Blocker | Phát hiện tại Step | Trạng thái |
|---|---------|---------------------|-----------|
| 1 | MSEW array signature vs Tier 2 prompt string signature | Step 2 | ✅ ĐÃ GIẢI — implement theo Tier 2 prompt |
| 2 | MSEW count 5 functions vs source code 4 functions | Step 4 | ✅ ĐÃ GIẢI — follow source code (4 calls) |

→ **0 blockers chặn** thi công Epic C+1. 2 blockers đã giải quyết trong cùng step. 0 blockers ngoài scope phát sinh.
