# MSEW: B1-B5 - Category & Settings CRUD Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Bổ sung các trường dữ liệu còn thiếu vào các trang Quản lý Danh mục (Settings/Categories, Statuses, Locations, Departments) để khớp với Schema Database.

## Các bước thực thi chi tiết (Dành cho Tier 2)

**Lưu ý chung:** Toàn bộ code nằm trong thư mục `src/app/settings/`. Bạn chỉ cần bổ sung các Input vào file Form/Modal và bổ sung các trường đó vào file API (nếu có dùng route) hoặc Server Action (nếu form dùng server actions).

### B1. Bổ sung trường cho Category (`settings/categories`)
- **Mở form:** Tìm component Form tạo/sửa Category.
- **Thêm trường:**
  - `requireAcceptance` (Checkbox)
  - `checkinEmail` (Checkbox)
  - `eulaText` (Textarea)
  - `color` (Input type="color" hoặc string regex `#hex`)
- **Update:** Server action lưu Category phải parse và lưu các trường này. Bảng danh sách Category có thể show thêm chấm màu (Color).

### B2. Bổ sung trường cho Status Label (`settings/statuses`)
- **Mở form:** Tìm component Form tạo/sửa Status Label.
- **Thêm trường:** `type` (Select Dropdown chọn 1 trong các giá trị: `deployable`, `pending`, `undeployable`, `archived`).
- **Update UI:** Ở file table danh sách Status, dùng màu badge khác nhau tuỳ vào `type`.

### B3. Bổ sung trường cho Location (`settings/locations`)
- **Mở form:** Component tạo/sửa Location.
- **Thêm trường (Text inputs):** `address`, `address2`, `city`, `state`, `country`, `zip`.
- **Lưu ý:** DB schema đã có sẵn các trường này, chỉ cần lôi ra nhét vào UI.

### B4. Bổ sung trường cho Department (`settings/departments`)
- **Mở form:** Component tạo/sửa Department.
- **Thêm trường (Dropdowns):**
  - `managerId` (Fetch danh sách User đổ vào)
  - `locationId` (Fetch danh sách Location đổ vào)
  - `companyId` (Fetch danh sách Company đổ vào)
- **Update:** Chắc chắn API lưu/cập nhật Department có lưu các FK này. Bảng danh sách hiển thị tên Manager, tên Location.

### B5. Hoàn thiện bảng System Settings (`settings`)
- **Mở form:** Thường nằm ở `src/app/settings/page.tsx` hoặc một tab General riêng.
- **Thêm trường:** `siteName`, `supportEmail`, `language` (Select: vi, en), `currency` (Select: VND, USD).
- **Lưu ý:** Bảng Setting thường chỉ có đúng 1 row duy nhất trong Database (id = '1'). Logic khi bấm Lưu là `upsert` hoặc `update` row đó. Cần đảm bảo UI lấy đúng data lên để hiển thị.
