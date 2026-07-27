# MSEW-Sprint-C.1: Báo cáo Chi phí IT (IT Costs Report)

## Mục tiêu
Tạo một trang Báo cáo Tổng hợp các khoản chi phí liên quan đến IT cho ban giám đốc và IT Manager.
Người dùng có thể xem được dòng tiền IT đã chi cho các hạng mục:
1. Chi phí mua mới thiết bị / tài sản (`Asset.purchaseCost`)
2. Chi phí mua bản quyền phần mềm (`License.purchaseCost`)
3. Chi phí bảo trì, sửa chữa, thay mực (`AssetMaintenance.cost`)

Đồng thời hỗ trợ bộ lọc linh hoạt theo thời gian (Tháng, Quý, Năm, Custom Range).

## Yêu cầu Nghiệp vụ (Business Requirements)
- **Roles được xem:** Chỉ những người có quyền `reports.view` (thường là ADMIN và IT_MANAGER).
- **Bộ lọc thời gian:** Giao diện có Date Range Picker, kèm theo các tùy chọn nhanh:
  - Tháng này (This Month)
  - Tháng trước (Last Month)
  - Quý này (This Quarter)
  - Năm nay (This Year)
  - Tùy chọn khoảng ngày (Custom)
- **Thống kê Tổng (Summary Cards):**
  - Tổng chi phí Mua thiết bị mới.
  - Tổng chi phí Mua bản quyền.
  - Tổng chi phí Bảo trì/Sửa chữa.
  - Tổng chi phí IT (Cộng 3 khoản trên).
- **Bảng chi tiết (Data Table):**
  - Trình bày danh sách hỗn hợp (hoặc tách 3 tab riêng biệt, nhưng tốt nhất là 1 bảng hỗn hợp sort theo ngày giảm dần).
  - Cột hiển thị: Ngày chi (Date), Loại (Type: Asset / License / Maintenance), Mô tả (Description/Name), Số tiền (Cost).

## Chi tiết Triển khai kỹ thuật (Technical Specs)

### 1. API Endpoint (`src/app/api/reports/it-costs/route.ts`)
Tạo mới file này. API chỉ hỗ trợ phương thức `GET`.

**Input (Query Params):**
- `startDate`: chuỗi ngày chuẩn ISO (ví dụ: `2026-07-01T00:00:00.000Z`)
- `endDate`: chuỗi ngày chuẩn ISO (ví dụ: `2026-07-31T23:59:59.999Z`)

**Quyền truy cập:**
```typescript
import { requirePermissionApi } from '@/utils/api-session'

const user = await requirePermissionApi('reports.view')
```

**Logic truy vấn cơ sở dữ liệu (Prisma):**
Dùng `Promise.all` để truy vấn song song từ 3 bảng trong khoảng thời gian `startDate -> endDate`:
1. **Asset:**
   - Điều kiện: `deletedAt: null`, `purchaseDate: { gte: startDate, lte: endDate }`, `purchaseCost: { not: null }`
   - Select: `id, name, assetTag, purchaseDate, purchaseCost`
2. **License:**
   - Điều kiện: `deletedAt: null`, `purchaseDate: { gte: startDate, lte: endDate }`, `purchaseCost: { not: null }`
   - Select: `id, name, purchaseDate, purchaseCost`
3. **AssetMaintenance:**
   - Điều kiện: `deletedAt: null`, `completionDate: { gte: startDate, lte: endDate }`, `cost: { not: null }` (hoặc nếu completionDate null thì kiểm tra `startDate`). Để đơn giản hóa, nên dùng `startDate` của Maintenance làm mốc ghi nhận chi phí.
   - Select: `id, title, startDate, cost, asset: { select: { name, assetTag } }`

**Chế biến Dữ liệu trả về (JSON Response):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "assetCost": 15000000,
      "licenseCost": 5000000,
      "maintenanceCost": 1500000,
      "totalCost": 21500000
    },
    "details": [
      {
        "id": "m1",
        "date": "2026-07-28T00:00:00.000Z",
        "type": "MAINTENANCE",
        "description": "Thay RAM laptop (AS-001)",
        "amount": 1500000
      }
    ]
  }
}
```
*Chú ý chuyển đổi `Prisma.Decimal` sang `number` khi tính toán và serialize trả về.*

### 2. Giao diện Frontend (`src/app/reports/costs/page.tsx` và Server Component)
- **Thư mục:** Tạo thư mục `src/app/reports/costs`.
- **`page.tsx`:** Là Server Component làm nhiệm vụ bọc (layout). Xác thực quyền bằng `await requirePermission('reports.view')` sau đó render một `<ItCostsClient />`.
- **`ItCostsClient.tsx` (Client Component):**
  - State: `startDate`, `endDate`, `loading`, `data`.
  - Có các Preset Buttons: "Tháng này", "Quý này", "Năm nay". Bấm vào tự động tính toán lại `startDate` và `endDate` bằng thư viện Date (hoặc JS thuần) -> Gây trigger useEffect gọi API lấy dữ liệu.
  - Sử dụng TailwindCSS / Lucide Icons. Thể hiện 4 ô Card tổng (Giống bên Báo cáo tổng quan).
  - Thể hiện một Chart đơn giản nếu có thể (Dùng `recharts` có sẵn trong dự án: `ResponsiveContainer, PieChart, Pie, Cell`). Vẽ biểu đồ tròn so sánh tỷ trọng 3 loại chi phí.
  - Vẽ Table liệt kê chi tiết các chi phí (Lấy từ `data.details`), format tiền tệ VNĐ (ví dụ dùng hàm `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)`).

### 3. Tích hợp Sidebar (`src/components/Sidebar.tsx`)
Thay vì nhét nó giấu kín vào góc, chúng ta nên update `Sidebar.tsx` để menu "Báo cáo" biến thành Menu dạng thả xuống (Dropdown/Submenu) như phần "Cài đặt":
```typescript
  {
    name: 'Báo cáo (Reports)',
    href: '/reports',
    icon: BarChart3,
    allowedRoles: ['ADMIN', 'IT_MANAGER'],
    permissionKey: 'reports.view',
    children: [
      { label: 'Tổng quan', href: '/reports', icon: BarChart3 },
      { label: 'Chi phí IT', href: '/reports/costs', icon: DollarSign }, // nhớ import DollarSign từ lucide-react
    ]
  },
```

## Yêu cầu dành cho Tier 2 (Agent)
1. Đọc kỹ file này và xem các Model `Asset`, `License`, `AssetMaintenance` trong `prisma/schema.prisma`.
2. Tạo API `GET /api/reports/it-costs` cẩn thận với kiểu dữ liệu `Decimal` của Prisma. (Gợi ý: Dùng `Number(item.cost)`).
3. Tạo Client component có Date Range logic chạy đúng trên Client-side. Gợi ý: JS Date object.
4. Đảm bảo giao diện theo chuẩn thiết kế (vibrant colors, padding chuẩn).
5. Cuối cùng, update `Sidebar.tsx` để user có thể click vào Menu "Chi phí IT".
6. Luôn nhớ dùng `git commit` và `git push` sau khi test thành công.
