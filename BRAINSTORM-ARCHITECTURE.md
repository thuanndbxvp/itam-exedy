# IT Asset Management — Architecture & Roadmap (Snipe-IT Inspired)

**Ngày:** 2026-07-24
**Mục tiêu:** Xây dựng hệ thống quản lý tài sản IT nội bộ cho công ty (100-500 nhân sự), kế thừa nghiệp vụ xuất sắc của Snipe-IT nhưng đơn giản hoá và hiện đại hoá bằng Next.js.
**Quyết định chiến lược:** Xây dựng mới hoàn toàn (Fullstack Monolith) thay vì phụ thuộc vào backend GLPI cũ.

---

## 1. Kiến trúc Tổng thể (Tech Stack)

Hệ thống được thiết kế theo hướng **Fullstack Monolith**, tận dụng tối đa hệ sinh thái React/Next.js để phát triển nhanh, duy trì dễ dàng bằng một ngôn ngữ duy nhất (TypeScript).

| Thành phần | Công nghệ lựa chọn | Lý do |
|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | Xử lý cả Frontend UI lẫn Backend API (Server Actions/Route Handlers). |
| **Ngôn ngữ** | **TypeScript** | Type-safety từ DB đến UI (End-to-End Type Safety). |
| **Database** | **PostgreSQL** | Relational DB mạnh mẽ, phù hợp với data model phức tạp của quản lý tài sản. |
| **ORM** | **Prisma** (hoặc Drizzle) | Thao tác DB dễ dàng, tự sinh TypeScript types. |
| **UI Library** | **Tailwind CSS v4 + shadcn/ui** | Copy-paste UI components, xây dựng giao diện xịn xò cực nhanh. |
| **State & Fetching** | **TanStack Query (React Query)** | Quản lý server state, optimistic updates (UI phản hồi ngay lập tức). |
| **Tables & Forms** | **TanStack Table + React Hook Form + Zod** | Xử lý bảng dữ liệu hàng ngàn dòng, validate form nghiêm ngặt. |
| **Auth** | **NextAuth.js (Auth.js)** | Hỗ trợ đăng nhập Email/Password hoặc Google/Microsoft SSO nội bộ. |

---

## 2. Mô hình Nghiệp vụ cốt lõi (Domain Models)

Kế thừa tư duy phân loại của Snipe-IT, hệ thống chia vật phẩm IT thành 5 loại có tính chất vòng đời khác nhau, nhưng sẽ được phát triển theo từng giai đoạn.

1. **Assets (Tài sản cứng):** Có định danh duy nhất (Asset Tag, Serial). Vd: Laptop, Server.
2. **Licenses (Bản quyền):** Quản lý theo số lượng (Seats). Vd: Office 365, Windows.
3. **Accessories (Phụ kiện):** Quản lý theo số lượng tổng, có thể thu hồi. Vd: Bàn phím.
4. **Consumables (Tiêu hao):** Quản lý theo số lượng tổng, xuất ra là mất. Vd: Mực in.
5. **Components (Linh kiện):** Gắn vào trong Asset. Vd: RAM.

Các thực thể phụ trợ dùng chung:
- **Users:** Nhân sự mượn thiết bị.
- **Locations / Departments:** Vị trí vật lý và phòng ban.
- **Status Labels:** Trạng thái tài sản (Sẵn sàng, Đang cấp phát, Báo hỏng, Thanh lý).
- **Action Logs:** Bảng lịch sử bất biến (Audit Trail) ghi lại mọi hành động (Check-in, Check-out).

---

## 3. Lộ trình Phát triển (Phased Roadmap)

Để đảm bảo dự án không bị lan man và team có thể sử dụng được ngay, hệ thống được chia thành 4 Phase. **Phase 1 là trọng tâm hiện tại.**

### 📍 Phase 1: Core MVP (Tài sản & Bản quyền)
*Mục tiêu: Đưa hệ thống vào sử dụng ngay lập tức để quản lý thiết bị đắt tiền.*

- **Thiết lập Base:** Cấu hình Next.js, Postgres, Prisma, Auth.
- **Quản lý Danh mục (Master Data):** Users, Locations, Departments, Categories, Status Labels.
- **Quản lý Assets:** Thêm, Sửa, Xóa thiết bị cứng (Laptop, Màn hình, v.v.).
- **Quản lý Licenses:** Thêm, Sửa, Xóa bản quyền phần mềm, số lượng key.
- **Luồng Cấp phát (Check-out) / Thu hồi (Check-in):**
  - Cấp phát Asset cho User (hoặc Location).
  - Cấp phát License cho User (hoặc Asset).
- **Action Logs (Lịch sử):** Tự động ghi log khi có thao tác Check-in/Check-out.
- **Dashboard:** Thống kê tổng quan số lượng tài sản, trạng thái.

### 📍 Phase 2: Phụ kiện & Vật tư tiêu hao (Accessories & Consumables)
*Mục tiêu: Quản lý các thiết bị lặt vặt trong kho.*

- **Quản lý Accessories:** Nhập kho số lượng lớn (VD: 100 con chuột), cấp phát và thu hồi theo số lượng.
- **Quản lý Consumables:** Nhập kho mực in, giấy in. Cấp phát là trừ thẳng vào kho (không có luồng thu hồi).
- **Cảnh báo tồn kho:** Báo động khi số lượng vật tư xuống thấp.

### 📍 Phase 3: Linh kiện & Bảo trì (Components & Maintenance)
*Mục tiêu: Quản lý sâu vào cấu hình máy và lịch sử sửa chữa.*

- **Quản lý Components:** Nhập kho RAM, Ổ cứng. Check-out linh kiện **vào một Asset cụ thể** (vd: Nâng cấp RAM cho Laptop A).
- **Quản lý Sửa chữa (Maintenances):** Tạo phiếu gửi tài sản đi bảo hành, ghi nhận chi phí và ngày dự kiến trả.

### 📍 Phase 4: Nâng cao & Audit (Advanced)
*Mục tiêu: Tối ưu quy trình và kiểm kê.*

- **In tem nhãn (Barcodes/QR Codes):** Tự sinh QR code cho từng Asset để dán lên thiết bị.
- **Quét QR Code:** Dùng điện thoại quét tem để xem thông tin hoặc check-in/out nhanh.
- **Audit (Kiểm kê định kỳ):** Chế độ quét hàng loạt để xác nhận tài sản vẫn còn ở công ty.
- **Import/Export:** Xuất nhập Excel/CSV hàng loạt.

---

## 4. Thiết kế Database Sơ bộ (Cho Phase 1)

Dưới đây là ý tưởng thiết kế các bảng chính (Prisma schema concept) để làm nền tảng cho Phase 1:

```prisma
// Người dùng hệ thống & Nhân viên
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  role        Role     @default(EMPLOYEE)
  departmentId String?
  locationId   String?
  assets      Asset[]  // Tài sản đang giữ
  licenses    LicenseSeat[] 
}

// Trạng thái tài sản
model StatusLabel {
  id          String   @id @default(cuid())
  name        String   // Deployable, Pending, Broken, Archived
  type        StatusType 
  assets      Asset[]
}

// Tài sản cứng
model Asset {
  id          String   @id @default(cuid())
  assetTag    String   @unique // Mã tài sản (vd: LAP-001)
  name        String
  serial      String?
  model       String
  categoryId  String
  statusId    String
  
  // Assignment (Ai đang giữ)
  assignedToId String?
  assignedTo   User?   @relation(fields: [assignedToId], references: [id])
  
  // Lịch sử
  logs        ActionLog[]
}

// Bản quyền
model License {
  id          String   @id @default(cuid())
  name        String
  productKey  String?
  seatsTotal  Int      // Tổng số key
  seats       LicenseSeat[]
}

// Từng "ghế" của bản quyền được cấp cho ai
model LicenseSeat {
  id          String   @id @default(cuid())
  licenseId   String
  assignedToId String?
}

// Lịch sử thao tác (Không bao giờ sửa/xóa)
model ActionLog {
  id          String   @id @default(cuid())
  actionType  ActionType // CHECKOUT, CHECKIN, CREATE, UPDATE
  itemId      String     // ID của Asset hoặc License
  itemType    ItemType   // 'ASSET', 'LICENSE'
  targetId    String?    // ID của User nhận (nếu checkout)
  userId      String     // Admin người thực hiện thao tác
  notes       String?
  createdAt   DateTime   @default(now())
}
```

## Bước tiếp theo (Thực thi Phase 1)
1. Dọn dẹp thư mục hiện tại (xóa code liên quan đến GLPI nếu có, thiết lập Next.js sạch).
2. Setup Postgres & Prisma, đẩy Schema cơ bản.
3. Làm module Authentication cơ bản (NextAuth).
4. Tiến hành code CRUD cho Users, Locations, Status Labels.
5. Chuyển sang code logic cốt lõi: Assets, Licenses và luồng Check-out/Check-in.
