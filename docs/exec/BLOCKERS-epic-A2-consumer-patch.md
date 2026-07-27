# Báo cáo Điểm nghẽn (BLOCKERS) — epic-A2-consumer-patch

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-25
**Mục đích:** Ghi nhận các ambiguity Tier 2 PHẢI hỏi lại hoặc tự quyết trước khi thi công MSEW-epic-A2-consumer-patch.md.

---

## Blocker #1 — Session có sẵn hay chưa khi gọi server action từ `/assets/new`?

- **Phát hiện tại Workflow Step:** BƯỚC 2 (patch `src/app/actions/asset.ts`)
- **Loại Blocker (Type):** [ Ambiguous MSEW — chưa rõ session lifecycle ]
- **Mô tả chi tiết (Description):**

  MSEW-epic-A2 dùng `getServerSession(authOptions)` trong `createAsset` / `createLicense` / `checkoutAsset` / `checkinAsset` để lấy `session.user.id` cho `ActionLog.userId`. Tuy nhiên:

  1. Hiện tại KHÔNG có middleware check session (xác nhận qua `src/app/layout.tsx` chỉ import `AppShell`, không import middleware).
  2. Route `/assets/new` chưa được protected — bất kỳ ai cũng có thể truy cập và submit form, kể cả khi chưa login.
  3. Khi user gọi `createAsset` qua form action mà CHƯA login → `getServerSession` trả `null` → `getActorUserId(null)` fallback query User `'system'`.

  → **Hậu quả:** Log `CREATE ASSET` sẽ ghi actor là user `system` (không phải user thật). UX nhầm lẫn: nếu sếp muốn log chính xác actor, Phase 2 cần middleware enforce login.

- **Decision Tier 1 đã đưa ra trong MSEW:**

  > Dual-path an toàn: ưu tiên `getServerSession`, fallback User `'system'`. Không chặn request — Phase 2 sẽ enforce login ở middleware.

- **Tại sao KHÔNG chặn ngay ở A2:**

  - A2 chỉ patch 7 file consumer để `tsc --noEmit` PASS — không thay đổi auth flow.
  - Việc enforce middleware thuộc Epic C (Auth thật).
  - User `'system'` placeholder là FK anchor an toàn cho ActionLog — Phase 1 không cần distinguish actor.

- **Tier 2 cần làm gì:**

  - Không cần hỏi lại. Tier 2 cứ copy-paste code trong MSEW.
  - Trong báo cáo kết thúc, **ghi rõ** "ActionLog.userId hiện dùng User 'system' vì chưa có middleware" để Phase 2 biết cần enhance.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT trong MSEW — Tier 2 chỉ cần áp dụng code, không cần hỏi lại.

---

## Blocker #2 — Form `/assets/new` giữ "text input" cho `modelId` thay vì dropdown chọn AssetModel?

- **Phát hiện tại Workflow Step:** BƯỚC 5 (patch `src/app/assets/new/page.tsx`)
- **Loại Blocker (Type):** [ Ambiguous UX — UI debt cho Phase sau ]
- **Mô tả chi tiết (Description):**

  Schema mới có `AssetModel` riêng — Phase 1 chỉ có 1 AssetModel `MacBook Pro M2` (do seed tạo). Nếu đổi form sang dropdown AssetModel:
  - Phải thêm `await prisma.assetModel.findMany()` ở page.
  - User phải chọn từ dropdown.
  - Trải nghiệm tốt hơn nhưng Phase 1 chỉ có 1 model → dropdown chỉ hiển thị 1 option.

  Tôi (Tier 1) quyết định **giữ text input** vì:
  1. MVP tập trung schema + seed PASS trước.
  2. Dropdown AssetModel đầy đủ thuộc Epic D (UI Polish).
  3. User có thể nhập `model-mbp-m2` (id do seed tạo) — hoạt động thật.

- **Tại sao KHÔNG chặn ở A2:**

  - User nhập sai `modelId` → Prisma `SetNull` onDelete → asset vẫn tạo được, chỉ là không gắn model — không crash.
  - Test thủ công: nhập `model-mbp-m2` để test FK working.

- **Tier 2 cần làm gì:**

  - Không cần hỏi lại. Cứ dùng `<input name="modelId">` như MSEW đã viết.
  - Phase 2 có thể nâng cấp thành dropdown.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT trong MSEW.

---

## Blocker #3 — Dropdown `Danh mục (Category)` bị bỏ ở `/assets/new` — có phá UX không?

- **Phát hiện tại Workflow Step:** BƯỚC 5 (patch `src/app/assets/new/page.tsx`)
- **Loại Blocker (Type):** [ Ambiguous UX — feature gap ]
- **Mô tả chi tiết (Description):**

  Form cũ có dropdown Category với 4 hard-coded option (`laptop`/`desktop`/`monitor`/`phone`). Schema PLAN-A1 gốc KHÔNG có `categoryId` trực tiếp trên Asset — chỉ qua `AssetModel.categoryId`. NHƯNG schema thực tế (đã verify PASS) lại CÓ `Asset.categoryId` nullable (FK trực tiếp tới Category, dạng MVP đơn giản — xem `prisma/schema.prisma:327-330`).

  → **Mâu thuẫn nhỏ giữa PLAN-A1 gốc và schema thực tế.**

- **Decision Tier 1 đưa ra:**

  Schema thực tế (đã verify PASS) là nguồn ground truth. Asset trực tiếp có `categoryId` nullable (FK trực tiếp) — Phase 1 chấp nhận đơn giản hóa này.

  → **MSEW-A2 SẼ KHÔI PHỤC dropdown Category** ở `/assets/new`, binding với `Asset.categoryId` qua Prisma.

- **Hành động đã làm:**

  - Đã sửa `MSEW-epic-A2-consumer-patch.md` BƯỚC 2 (signature `createAsset` thêm `categoryId`).
  - Đã sửa BƯỚC 5 (handleSubmit + JSX — load categories từ DB, dropdown bind `name="categoryId"`).
  - Xem chi tiết sửa trong section "PATCH-NOTE-1 (APPLIED)" bên dưới.

- **Tier 2 cần làm gì:**

  - Đọc lại BƯỚC 5 của MSEW (đã có patch-note-1) trước khi code.
  - Không cần hỏi lại. Cứ copy-paste code đã sửa.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — đã áp dụng PATCH-NOTE-1 vào MSEW-A2.

---

## <a id="patch-note-1"></a>PATCH-NOTE-1 (APPLIED): Bổ sung dropdown Category vào `/assets/new`

> **Đã apply vào `MSEW-epic-A2-consumer-patch.md` BƯỚC 2 + BƯỚC 5.**
> Section này giữ lại làm lịch sử — Tier 2 đọc code trong MSEW là đủ.

Trước đây (MSEW bản nháp đầu), BƯỚC 5 bỏ dropdown Category. Sau khi xác nhận schema thực tế có `Asset.categoryId`, MSEW đã được sửa:

**Trong `src/app/assets/new/page.tsx`:**
- Load `categories` ở page (cùng Promise.all với statuses).
- JSX dropdown Category load từ `categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)`.
- Form gửi `formData.get('categoryId')` → truyền vào `createAsset({ categoryId })`.

**Trong `src/app/actions/asset.ts` (BƯỚC 2):**
- Signature thêm `categoryId?: string`.
- Prisma create gán `categoryId: data.categoryId ?? null`.

---

## Tổng kết tình trạng (cập nhật 2026-07-25)

| # | Blocker | Phát hiện tại Step | Trạng thái |
|---|---------|---------------------|-----------|
| 1 | Session lifecycle (dual-path) | BƯỚC 2 | ✅ ĐÃ GIẢI — dual-path an toàn với `getActorUserId()` helper |
| 2 | Form `modelId` text vs dropdown | BƯỚC 5 | ✅ ĐÃ GIẢI — text input MVP, Phase D sẽ nâng cấp dropdown |
| 3 | Form Category dropdown | BƯỚC 2 + BƯỚC 5 | ✅ ĐÃ GIẢI — đã áp dụng PATCH-NOTE-1 vào MSEW-A2 (Asset.categoryId nullable) |

→ **Tất cả 3 blockers đã giải.** Tier 2 chỉ cần đọc MSEW-epic-A2-consumer-patch.md và copy-paste code theo từng BƯỚC.
