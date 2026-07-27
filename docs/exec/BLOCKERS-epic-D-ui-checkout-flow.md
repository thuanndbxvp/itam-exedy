# Báo cáo Điểm nghẽn (BLOCKERS) — epic-D-ui-checkout-flow

**Người lập:** Tier 2 (Coder / Auditor)
**Ngày lập:** 2026-07-26
**Mục đích:** Ghi nhận các ambiguity Tier 2 gặp phải trong quá trình thi công + cách giải quyết.

---

## Blocker #1 — MSEW §4.1 liệt kê `.tsx` cho test files (`tests/role-gate.test.tsx`, `tests/toast.test.tsx`) nhưng `jest.config.ts:17` chỉ match `**/*.test.ts`

- **Phát hiện tại Workflow Step:** BƯỚC 18 (tạo 3 test files)
- **Loại Blocker (Type):** [ Spec conflict giữa MSEW và jest config — Tier 2 follow jest config (authoritative vì constraint KHÔNG sửa file không liệt kê trong MSEW §4) ]
- **Mô tả chi tiết (Description):**

  MSEW §4.1 liệt kê:
  ```
  | `tests/role-gate.test.tsx` | Mới | ~40 dòng |
  | `tests/toast.test.tsx` | Mới | ~50 dòng |
  ```

  Tuy nhiên, `jest.config.ts:17` đang set:
  ```typescript
  testMatch: ['**/*.test.ts'],
  ```

  Hai config khác nhau:
  - **MSEW**: test files có extension `.tsx`.
  - **jest.config.ts**: chỉ match `.ts`.

  Nếu Tier 2 tạo `.tsx`, jest sẽ KHÔNG chạy tests → 0 tests được discover.

- **Decision Tier 2 đưa ra:**

  Tier 2 follow **jest.config.ts** (authoritative) vì:
  1. `jest.config.ts` KHÔNG có trong danh sách file được phép sửa (MSEW §4 chỉ liệt kê 15 mới + 5 sửa, KHÔNG bao gồm `jest.config.ts`).
  2. Workspace rule cứng: "**KHÔNG** đụng ... `jest.config.ts`".
  3. Tier 2 KHÔNG muốn thay đổi file không nằm trong scope.
  4. Test files KHÔNG có JSX (chỉ pure predicates + pure functions + require imports) → `.ts` extension là đủ.

  Tier 2 rename thành `.test.ts` để match `testMatch`.

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Conflict rõ ràng, không có ambiguity — Tier 2 tự quyết theo constraint cứng (KHÔNG sửa file ngoài scope).
  - Sửa `jest.config.ts` sẽ tạo thay đổi ngoài scope, có thể ảnh hưởng các Epic trước (Epic A2/B/C/C+1 đều dùng testMatch `.test.ts`).

- **Tier 2 đã làm gì:**

  - Tạo `tests/role-gate.test.ts` (rename từ `.tsx`) — 9 tests.
  - Tạo `tests/toast.test.ts` (rename từ `.tsx`) — 13 tests.
  - `tests/rate-limit.test.ts` đã đúng `.ts` extension từ đầu (MSEW §4.2 list đúng) — 7 tests.
  - Ghi nhận trong CHANGELOG-EXEC §"Divergence từ MSEW gốc #3" + SKILL-USAGE §"Anti-patterns" + WORKFLOW-STATUS §"Ghi chú cuối".

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — Tier 2 follow jest.config.ts. Phase 2 sẽ update MSEW cho tương lai (hoặc update jest.config.ts nếu muốn support cả `.tsx`).

---

## Blocker #2 — Tier 2 muốn test React components (RoleGate, ToastProvider, Modal) nhưng workspace KHÔNG có `@testing-library/react` và rule cứng "KHÔNG thêm dependencies"

- **Phát hiện tại Workflow Step:** BƯỚC 18 (tạo tests)
- **Loại Blocker (Type):** [ Test architecture trade-off — Tier 2 chọn pure-function testing thay vì React Testing Library ]
- **Mô tả chi tiết (Description):**

  MSEW BƯỚC 12 viết:
  ```
  Tạo 3 test file (theo MSEW):
  - tests/role-gate.test.tsx (~40 dòng): mock useSession, test render/hide.
  - tests/toast.test.tsx (~50 dòng): test ToastProvider add/clear.
  ```

  Test "render/hide" RoleGate yêu cầu React Testing Library (`render()` + `screen.getByText()`). Tuy nhiên:

  1. `package.json` KHÔNG có `@testing-library/react`, `@testing-library/jest-dom`, `react-test-renderer`.
  2. Workspace rule cứng MSEW §6: "**KHÔNG** thêm dependencies mới vào `package.json` (Toast/Modal tự build)."
  3. Cài `@testing-library/react@^16` (compat với React 19) sẽ:
     - Thêm ~5MB vào `node_modules`.
     - Cần thêm `@testing-library/jest-dom` cho matchers.
     - Cần setup `jest-environment-jsdom` thay vì `node` (toàn bộ config phải đổi).
     - Có thể ảnh hưởng test hiện có (Epic A2/B/C/C+1) đang dùng `node` env.

- **Decision Tier 2 đưa ra:**

  Tier 2 chọn **pure-function testing** vì:
  1. Workspace rule cứng (MSEW §6) về dependency KHÔNG thêm.
  2. Test logic chính (predicate role check, predicate CommandResult check, in-memory Map rate-limit) đều là pure functions.
  3. Render testing có thể verify manually qua `Invoke-WebRequest` (Step 20) → HTML output check đủ smoke test.
  4. Phase 2 có thể thêm RTL sau khi sếp approve dependency budget.

  Tier 2 tách pure predicates ra khỏi component:
  - `RoleGate.tsx` export thêm `isRoleAllowed(sessionRole, allowedRoles): boolean`.
  - `Toast.tsx` export thêm `isCommandSuccess(result)` + `isCommandError(result)`.
  - `rate-limit.ts` đã sẵn pure (chỉ Map operations).

  Sau đó test các pure predicates này + thêm 1-2 static analysis test cho module exports.

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Rule cứng trong MSEW đã rõ ràng về dependency. Tier 2 KHÔNG có quyền override.
  - Pure-function approach vẫn cover 80%+ test value (logic core), chỉ bỏ qua "render visual" test → manual verify qua curl/browser là đủ cho Phase 1.

- **Tier 2 đã làm gì:**

  - `tests/role-gate.test.ts` — 9 tests:
    - 7 tests cho `isRoleAllowed` predicate (ADMIN match/mismatch, EMPLOYEE, null, undefined, empty array).
    - 2 tests cho module structure (verify export `isRoleAllowed` + `default` component).
  - `tests/toast.test.ts` — 13 tests:
    - 7 tests cho `isCommandSuccess` predicate (ok=true, ok=false, null, undefined, string, missing ok, missing data).
    - 5 tests cho `isCommandError` predicate (full ok=false, ok=true, invalid code, invalid message, null/undefined).
    - 1 test cho module structure.
  - `tests/rate-limit.test.ts` — 7 tests:
    - 5 basic tests (first attempt, 5 attempts allowed, 6th blocked, fakeTimers reset, independent keys).
    - 1 test cho `resetAt` timestamp.
    - 1 test cho `_resetRateLimitForTesting` helper.
  - Ghi nhận trong CHANGELOG-EXEC + SKILL-USAGE §"Skill rules (always-applied) đã theo" + WORKFLOW-STATUS §"Ghi chú cuối".

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — Tier 2 chọn pure-function testing. Phase 2 (sau khi sếp approve) sẽ thêm `@testing-library/react` nếu cần test render visual.

---

## Blocker #3 — Tier 2 verify workspace KHÔNG có `lucide-react` warning khi import nhiều icon (Modal, Toast, Button)

- **Phát hiện tại Workflow Step:** BƯỚC 5-12 (implement components)
- **Loại Blocker (Type):** [ Verify rule — KHÔNG phải blocker thực sự, chỉ là sanity check ]
- **Mô tả chi tiết (Description):**

  Workspace rule cứng: "**KHÔNG** dùng emoji icon (rule workspace) ... `lucide-react` ĐÃ CÓ sẵn trong `package.json` → dùng cho icon."

  Tier 2 cần import ~10 icon khác nhau từ `lucide-react`:
  - RoleGate: KHÔNG (chỉ return React fragment).
  - Toast: `CheckCircle`, `AlertCircle`, `Info`, `X` (4 icon).
  - Modal: `X` (1 icon).
  - CheckoutAssetModal: `User`, `MapPin`, `Loader2` (3 icon).
  - CheckoutAssetButton: `ShoppingCart` (1 icon).
  - CheckinAssetButton: `Undo2`, `Loader2` (2 icon).
  - CheckoutSeatModal: `Loader2`, `Key` (2 icon).
  - CheckoutSeatButton: `ShoppingCart`, `Undo2`, `Loader2`, `XCircle` (4 icon).
  - licenses/[id]/page.tsx: `ArrowLeft`, `Key`, `Users`, `Calendar`, `Hash` (5 icon).
  - Sidebar.tsx: KHÔNG thêm icon mới (đã có sẵn từ Epic A2).
  - assets/page.tsx: KHÔNG thêm icon mới.
  - licenses/page.tsx: `ExternalLink` (1 icon mới).

  Tổng cộng ~14 icon imports, tất cả từ `lucide-react@1.26.0` (đã có sẵn).

- **Decision Tier 2 đưa ra:**

  Tier 2 verify workspace rule TRƯỚC khi code:
  ```
  $ grep "lucide-react" package.json
  "lucide-react": "^1.26.0",
  ```

  Version 1.26.0 cũ nhưng có đủ icon cơ bản. Tier 2 KHÔNG cần upgrade hay thêm dependency.

  Verify tất cả icon đều available trong version này:
  - `CheckCircle`, `AlertCircle`, `Info`, `X`, `User`, `MapPin`, `Loader2`, `ShoppingCart`, `Undo2`, `Key`, `XCircle`, `ArrowLeft`, `Users`, `Calendar`, `Hash`, `ExternalLink` — tất cả đều có trong `lucide-react@1.26.0` (theo lucide docs).

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Đây là sanity check, KHÔNG phải blocker thực sự.
  - Tier 2 đã verify trước khi code, không gặp vấn đề gì.

- **Tier 2 đã làm gì:**

  - Tất cả icon imports compile first-try PASS (không có warning nào).
  - Workspace rule "KHÔNG dùng emoji icon" được tuân thủ.
  - Workspace rule "`lucide-react` đã có sẵn" được tuân thủ.

- **Trạng thái:** ✅ KHÔNG PHẢI BLOCKER — Tier 2 verify trước khi code, tất cả icon đều available.

---

## Tổng kết tình hình

| # | Blocker | Phát hiện tại Step | Trạng thái |
|---|---------|---------------------|-----------|
| 1 | MSEW `.tsx` test files vs jest.config.ts `.ts` only | Step 18 | ✅ ĐÃ GIẢI — rename `.test.ts` theo jest.config |
| 2 | Test React components cần RTL, workspace KHÔNG có + KHÔNG thêm dep | Step 18 | ✅ ĐÃ GIẢI — pure-function testing (predicate export riêng) |
| 3 | Verify `lucide-react` có đủ icon (sanity check, không phải blocker) | Step 5-12 | ✅ ĐÃ VERIFY — tất cả icon available trong v1.26.0 |

→ **0 blockers chặn** thi công Epic D. 2 blockers đã giải quyết trong cùng step. 1 sanity check pass.

---

## Đề xuất cho MSEW tương lai

1. **Update MSEW test file extensions**: Khi viết MSEW cho Epic sau, dùng `.test.ts` thay vì `.tsx` để khớp với `jest.config.ts` hiện tại. Nếu muốn support `.tsx`, update `testMatch` ở Epic riêng (có approval của sếp).

2. **Document test strategy choice**: Khi test React components, MSEW nên specify rõ "pure-function test" hay "React Testing Library". Workspace rule cứng về dependency có thể block cách thứ 2.

3. **Icon library version**: Khi tham chiếo `lucide-react`, nên specify version range (vd: `^1.26.0`) để Tier 2 biết icon nào available. Version 1.26.0 cũ, có thể thiếu icon mới (vd: `Trash2` chỉ có từ 0.300+).