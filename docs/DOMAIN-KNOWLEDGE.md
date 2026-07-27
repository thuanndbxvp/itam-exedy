# Domain Knowledge: Hệ thống Quản lý Tài sản IT (IT Asset Management - ITAM)

> **Bảo mật:** Tầng 1 dùng để thiết kế. Tầng 3 dùng để kiểm định logic. Cấm Tầng 2 (Thợ gõ) đọc file này để tránh bị quá tải thông tin nghiệp vụ (Overthinking).

## 1. Định vị Hệ thống (Core Identity)
- **Lĩnh vực (Domain):** Quản trị Doanh nghiệp (Enterprise Asset Management / ITAM).
- **Chân dung Khách hàng (User Persona):** 
  - **IT Admin/Manager:** Quản lý toàn bộ vòng đời thiết bị, thích giao diện dashboard nhiều số liệu, cần thao tác gán/thu hồi (Checkout/Checkin) cực nhanh và chính xác.
  - **Nhân viên (Employee):** Người được cấp phát thiết bị, thỉnh thoảng đăng nhập để xác nhận đã nhận thiết bị hoặc báo hỏng.
- **Giá trị cốt lõi:** Quản lý tập trung mọi tài sản phần cứng, bản quyền phần mềm, phụ kiện... để chống thất thoát, kiểm soát vòng đời và khấu hao tài sản.

## 2. Hóa thân Chuyên gia (Expertise Personas)

### Chuyên gia 1: Trưởng phòng IT (IT Manager)
- **Tư duy cốt lõi:** Mọi thiết bị mua về đều phải có mã định danh (Asset Tag). Không bao giờ được phép có 1 thiết bị thuộc về 2 người trong cùng một thời điểm.
- **Thuật ngữ (Jargons):** Asset Tag (Mã tài sản định danh), Checkout (Cấp phát), Checkin (Thu hồi), Deployable (Sẵn sàng cấp), Deployed (Đang sử dụng), Broken (Báo hỏng), Audit (Kiểm kê).
- **Định hướng thiết kế (UI/UX & Logic):** Giao diện cần dạng bảng (Table) dày đặc thông tin nhưng phải dễ tìm kiếm (Search), sắp xếp (Sort). Màu sắc Trạng thái phải nổi bật (Xanh = Sẵn sàng, Đỏ = Hỏng, Vàng = Đang cấp).

### Chuyên gia 2: Chuyên gia Kiểm toán Tài sản (Asset Auditor)
- **Tư duy cốt lõi:** Lịch sử là bất biến. Một khi đã thao tác (cấp phát, thu hồi), hệ thống BẮT BUỘC phải ghi log lại (Ai làm, lúc nào, với tài sản nào).
- **Thuật ngữ (Jargons):** Action Log, Lifecycle, Audit Trail, Depreciation (Khấu hao).
- **Định hướng thiết kế:** Mọi thay đổi state của Asset đều phải trigger một bản ghi ActionLog (History).

## 3. Chốt chặn Nghiệp vụ (Dành cho Tầng 3 - QA/Auditor)
- **Logic sống còn 1:** KHÔNG cho phép Checkout (Cấp phát) một tài sản đang có trạng thái `Deployed` hoặc `Broken` cho một người khác. Chỉ được cấp tài sản `Deployable`.
- **Logic sống còn 2:** Action Log là BẤT BIẾN. Cấm xóa hay sửa lịch sử (Update/Delete ActionLog).
- **Logic sống còn 3:** Khi một tài sản bị Checkin (Thu hồi), trường `assignedToId` phải chuyển về `null` ngay lập tức.
- **Logic sống còn 4:** Số lượng Seats của License cấp ra KHÔNG ĐƯỢC vượt quá tổng số Seats đã mua (`seatsTotal`). Mọi logic Checkout License phải đếm số lượng đang cấp phát.
