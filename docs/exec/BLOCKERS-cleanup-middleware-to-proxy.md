# Báo cáo Điểm nghẽn (BLOCKERS) — epic-C+0.5-cleanup-middleware-to-proxy

**Người lập:** Tier 2 (Coder / Auditor)
**Ngày lập:** 2026-07-26
**Mục đích:** Ghi nhận các ambiguity Tier 2 gặp phải trong quá trình thi công Epic C+0.5 + cách giải quyết.

---

## Tóm tắt nhanh

Epic C+0.5 đã hoàn thành **0 blockers chặn**, với **1 retry trong Step 7** (không tính là blocker) và **1 divergence từ MSEW** (chỉ là về estimate, không ảnh hưởng plan). Blocker #2 Epic C (Next.js 16 middleware deprecation warning) đã được Epic C+0.5 giải quyết → status đổi từ ⏸️ CHƯA GIẢI → ✅ ĐÃ GIẢI.

---

## Blocker #1 — Dev server cũ (PID 22320) còn cache `src/middleware.ts` sau khi xóa

- **Phát hiện tại Workflow Step:** Step 7 (verify dev server + curl 4 routes)
- **Loại Blocker (Type):** [ Transient state — fix trong cùng step ]
- **Mô tả chi tiết (Description):**

  Workspace có dev server cũ (PID 22320, port 3000) chạy từ Epic B/C đang serve cached `src/middleware.ts` (đã xóa ở Step 3). Khi Tier 2 chạy `curl -I http://localhost:3000/` lần đầu tiên → server TRẢ VỀ 307 (vẫn gate routes) nhưng dựa trên file đã xóa, KHÔNG phải `src/proxy.ts` mới. Đây là kết quả **không hợp lệ** vì không chứng minh được rename hoạt động đúng.

- **Decision Tier 2 đưa ra:**

  Stop dev server cũ + clear Next.js cache (`.next/`) + start fresh dev server (port 3000, PID mới). Sau đó curl 4 routes sẽ thực sự exercise file `src/proxy.ts` mới.

  ```powershell
  Stop-Process -Id 22320 -Force -ErrorAction SilentlyContinue
  Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
  npm run dev > _audit_dev_server.log 2>&1  # PID mới: 19312
  ```

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Đây là transient runtime issue, không phải design ambiguity.
  - Tier 1 đã document trong MSEW Quy ước §5.2 rằng dùng "copy + delete" thay vì `git mv` — nhưng KHÔNG đề cập về cache invalidation. Đây là chi tiết PowerShell/Node.js runtime mà Tier 2 phải tự xử lý.
  - Sửa trong cùng Step 7 (KHÔNG tính retry chính thức).

- **Tier 2 đã làm gì:**

  - Stop PID 22320 (dev server cũ).
  - `Remove-Item .next -Recurse -Force` (clear Turbopack cache + filesystem cache).
  - Start dev server mới (PID 19312, port 3000).
  - Re-curl 4 routes → tất cả match expected (2×307 + 2×200 + `/api/auth/session` returns `{}`).
  - Verify dev log KHÔNG còn "middleware deprecated" warning.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — không cần escalate.

---

## Blocker #2 — Epic C Blocker #2 (Next.js 16 middleware deprecation) — ĐÃ GIẢI Ở EPIC C+0.5

- **Phát hiện tại Workflow Step:** (carry-over từ Epic C)
- **Loại Blocker (Type):** [ Carry-over blocker đã giải ]
- **Mô tả chi tiết (Description):**

  Epic C ghi nhận trong `BLOCKERS-epic-C-auth-middleware.md` Blocker #2:
  - Next.js 16.2.11 log warning `"The 'middleware' file convention is deprecated. Please use 'proxy' instead."`
  - Tier 2 Epic C chưa fix vì KHÔNG thuộc scope (Epic C chỉ focus gate logic).
  - Đề xuất ở WORKFLOW-STATUS Epic C: "Epic Cleanup (Next.js 16) sẽ rename `src/middleware.ts` → `src/proxy.ts`".

  → **Epic C+0.5 chính là epic đó**. Tier 2 đã rename file + verify log KHÔNG còn deprecation warning → blocker đã đóng.

- **Tier 2 đã làm gì:**

  - Tạo `src/proxy.ts` (copy nguyên logic + mở rộng JSDoc).
  - Xóa `src/middleware.ts`.
  - Verify `npm run dev` startup log KHÔNG có warning.
  - Verify request serving KHÔNG ảnh hưởng (4 routes 307/200 đúng expected).

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — Epic C+0.5 hoàn thành nhiệm vụ chính.

---

## Divergence (không phải blocker) — MSEW estimate sai

- **Phát hiện tại Workflow Step:** Step 1 (Read `src/middleware.ts`)
- **Loại:** [ Documentation estimate error — không ảnh hưởng plan ]
- **Mô tả:**

  `docs/plan/MSEW-cleanup-middleware-to-proxy.md` estimate `src/middleware.ts` khoảng **25 dòng**. Tier 2 verify bằng `Get-Content src/middleware.ts | Measure-Object -Line` → **53 dòng**.

- **Tier 2 đã làm gì:**

  - Read toàn bộ file (53 dòng) thay vì assume ngắn.
  - Copy nguyên nội dung sang `src/proxy.ts`.
  - Mở rộng JSDoc đầu file từ 12 dòng (middleware) → 18 dòng (proxy) — không ảnh hưởng logic.

- **Trạng thái:** 🟡 GHI NHẬN — Tier 1 nên update MSEW estimate cho accuracy trong tương lai (file convention Epic C là 49 dòng theo WORKFLOW-STATUS Epic C, nhưng thực tế là 53 dòng sau comment edits).

---

## Tổng kết tình trạng

| # | Blocker / Divergence | Phát hiện tại Step | Trạng thái |
|---|---------------------|---------------------|-----------|
| 1 | Dev server cũ cache middleware.ts | Step 7 | ✅ ĐÃ GIẢI — stop PID 22320 + clear `.next` + start fresh PID 19312 |
| 2 | Epic C Blocker #2 (middleware deprecation) | (carry-over Epic C) | ✅ ĐÃ GIẢI — Epic C+0.5 rename xong, log KHÔNG còn warning |
| D1 | MSEW estimate 25 dòng vs thực tế 53 dòng | Step 1 | 🟡 GHI NHẬN — không ảnh hưởng, Tier 2 đã verify trước khi copy |

→ **0 blockers chặn** thi công Epic C+0.5. 1 transient state (Blocker #1) đã giải trong cùng Step 7. Blocker carry-over Epic C (Blocker #2) đã đóng. 1 documentation divergence (D1) chỉ ghi nhận, không ảnh hưởng.
