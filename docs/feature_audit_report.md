# Báo cáo Rà soát Tính năng (Feature Audit)

Theo yêu cầu của bạn, tôi đã tiến hành rà soát toàn bộ mã nguồn (đặc biệt là Database Schema `prisma/schema.prisma` và các trang giao diện chi tiết) để kiểm tra trạng thái của 4 tính năng bạn đề cập. Dưới đây là kết quả chi tiết:

---

## 1. Lịch sử người sử dụng đối với tài sản và license
- **Trạng thái:** 🟡 Có hỗ trợ lưu trữ ở Backend, nhưng chưa có giao diện (UI) hiển thị.
- **Chi tiết:** 
  - **Backend:** Cơ sở dữ liệu đã có bảng `ActionLog` lưu lại mọi thao tác `CHECKOUT` (cấp phát) và `CHECKIN` (thu hồi) kèm theo thông tin `userId` (người được cấp) và mốc thời gian. Điều này áp dụng cho cả `ItemType.ASSET` và `ItemType.LICENSE_SEAT`.
  - **Frontend:** Hiện tại trang Chi tiết Tài sản (`/assets/[id]`) và Chi tiết Bản quyền (`/licenses/[id]`) **chưa có tab "Lịch sử cấp phát"**. Chúng ta đang chỉ hiển thị người đang sử dụng hiện tại, chứ chưa cho phép xem lại danh sách những người đã từng mượn tài sản/license này trong quá khứ.

## 2. Lịch sử sửa chữa, nâng cấp đối tài sản
- **Trạng thái:** 🔴 Chưa có tính năng này (Missing feature).
- **Chi tiết:**
  - **Backend:** Trong sơ đồ dữ liệu (Schema) hoàn toàn **không có bảng nào** (như `Maintenance`, `AssetRepair`) để lưu trữ thông tin về bảo trì, sửa chữa hay nâng cấp.
  - Các thông tin quan trọng như: Đối tác sửa chữa, chi phí sửa, ngày bảo trì, nội dung bảo trì... hiện không có nơi lưu trữ chuyên biệt (chỉ có thể viết tạm vào trường `notes` dạng text của tài sản, rất khó quản lý và thống kê).
  - Cần phải thiết kế thêm Model `AssetMaintenance` vào cơ sở dữ liệu nếu muốn làm tính năng này.

## 3. Cảnh báo hết hạn đối với các license
- **Trạng thái:** 🟡 Đã làm một nửa (Chỉ cảnh báo thụ động).
- **Chi tiết:**
  - **Backend:** Bảng `License` đã có trường `expirationDate` để lưu ngày hết hạn.
  - **Frontend:** Trong trang chi tiết License (`/licenses/[id]/page.tsx`), hệ thống đã có logic kiểm tra và hiển thị huy hiệu (badge) màu đỏ **ĐÃ HẾT HẠN** nếu ngày hiện tại vượt quá ngày hết hạn.
  - **Thiếu sót:** Hệ thống **chưa có Cảnh báo chủ động (Proactive Alerts)**. Không có widget trên trang chủ Dashboard để báo cáo "Các license sắp hết hạn trong 30 ngày tới", và cũng chưa có tiến trình ngầm (Cron job) để gửi Email thông báo tự động cho IT Manager khi license sắp hết hạn.

## 4. Cảnh báo máy móc, tài sản quá cũ, cần nâng cấp
- **Trạng thái:** 🟡 Có trường dữ liệu, nhưng chưa làm logic cảnh báo.
- **Chi tiết:**
  - **Backend:** Bảng `Asset` có lưu `purchaseDate` (ngày mua) và `assetEolDate` (Ngày kết thúc vòng đời - End of Life). Bảng `AssetModel` cũng có trường `eol` (số tháng vòng đời).
  - **Frontend:** Hệ thống hoàn toàn **chưa có giao diện hay báo cáo nào** để liệt kê và cảnh báo các tài sản đã quá hạn EOL, hoặc quá cũ cần thanh lý/nâng cấp. 
  - (Cũng tương tự mục 3, cần bổ sung một widget "Tài sản cần nâng cấp/thanh lý" lên Dashboard hoặc tạo một trang Báo cáo riêng).

---

### Đề xuất Kế hoạch triển khai (Next Steps)
Nếu bạn muốn bổ sung các tính năng này để hệ thống ITAM hoàn thiện hơn, chúng ta có thể chia làm 2 giai đoạn:
1. **Giai đoạn 1 (Dễ - Làm ngay):**
   - Viết UI hiển thị tab "Lịch sử" trong trang Chi tiết Tài sản và License (truy xuất từ `ActionLog`).
   - Thêm các Widget cảnh báo "License sắp hết hạn" và "Tài sản đã đến hạn EOL" lên màn hình Dashboard của Admin/IT.
2. **Giai đoạn 2 (Cần thiết kế Database):**
   - Tạo mới bảng `AssetMaintenance` để quản lý chuyên sâu quy trình Sửa chữa / Nâng cấp / Bảo dưỡng tài sản (quản lý chi phí, nhà cung cấp dịch vụ).
