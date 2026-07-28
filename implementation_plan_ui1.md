# MASTER ROADMAP: BẢN ĐỒ THỰC THI KIỂM TOÁN (ITAM)

Dựa trên kết quả trả về từ 2 báo cáo `TECHNICAL-AUDIT` và `SECURITY-AUDIT`, cộng với các vấn đề UX/UI sếp đã vạch ra, tôi đã quy hoạch lại toàn bộ thành một Lộ trình thi công (Roadmap) thống nhất. Mức độ ưu tiên được xếp từ Sống còn (Security) đến Kiến trúc (Tech Debt) và cuối cùng là Trải nghiệm (UX/UI).

---

## 🚀 SPRINT 1: SECURITY HOTFIXES (Khẩn cấp - Vá lỗ hổng Sống còn)
*Ưu tiên dập lửa các lỗ hổng CRITICAL có thể bị khai thác ngay lập tức.*

1. **Vá lỗ hổng SQL Injection & XSS (Tier 1 Priority)**
   - Thay thế `prisma.$executeRawUnsafe` trong `updateSettings()` bằng typed update.
   - Xóa bỏ việc lưu `permissions` dưới dạng plaintext trong `sessionStorage` (Chuyển sang Server-side fetch ở Sidebar).
2. **Vá lỗ hổng Phân quyền & IDOR (CRITICAL)**
   - Sửa 6 APIs `GET /api/reports/*`: Bắt buộc check quyền `reports.view` (Ngăn chặn Auth Bypass).
   - Sửa API `GET /api/assets/[id]/history`: Chặn Employee xem lịch sử mượn trả của người khác.
   - Sửa API `POST /api/assets/[id]/maintenances`: Chặn Employee tự ý tạo lịch sử bảo trì.
3. **Chống Brute-force (HIGH)**
   - Bổ sung Rate Limiting cho API Login và 2FA OTP.

---

## 🚀 SPRINT 2: DATA INTEGRITY & DATABASE OPTIMIZATION (Độ tin cậy)
*Giải quyết các vấn đề rò rỉ dữ liệu do Soft-delete và Tối ưu tốc độ truy vấn.*

1. **Lỗ hổng Soft-delete (Data Leak)**
   - Bổ sung filter `deletedAt: null` vào các API Queries (đặc biệt là Check-out Asset và License commands).
2. **Database Indexes (Performance)**
   - Bổ sung Index cho trường `deletedAt` trên TẤT CẢ các bảng master data.
   - Bổ sung các Composite Indexes cực kỳ quan trọng: `(assignedUserId, deletedAt)`, `(expirationDate, deletedAt)`.
3. **Logic Bugs**
   - Xử lý ActionLog bị mồ côi (orphaned) khi xóa User (Gán lại cho System).
   - Sửa lỗi không validate số âm cho `purchaseCost` và `warrantyMonths`.

---

## 🚀 SPRINT 3: UX/UI REFACTOR (Trải nghiệm Người dùng - Đã gom từ trước)
*Tập trung dọn dẹp giao diện Sidebar và điều hướng.*

1. **Cấu trúc Menu & Thẩm mỹ**
   - Đẩy "Chi phí IT" ra thành mục độc lập, gỡ dropdown của Menu "Báo cáo".
   - Đổi 4 Icon của nhóm Danh mục thành `FolderOpen`, `Box`, `Factory`, `Package`.
2. **Dọn dẹp & Phân cấp Sidebar**
   - Xóa bỏ hoàn toàn khối User Profile & Logout bên trái.
   - Thêm `margin`, làm mờ chữ, và kẻ vạch ngang (`border-t`) để phân tầng rõ rệt các Group Headers (TỔNG QUAN, TÀI SẢN...).

---

## 🚀 SPRINT 4: TECHNICAL DEBT & COMPONENT REFACTOR (Kiến trúc)
*Tái cấu trúc mã nguồn để chuẩn bị cho việc scale up hệ thống.*

1. **Chẻ nhỏ Fat Components**
   - Tách file `IntegrationsClient.tsx` (881 dòng) thành 3 Tabs Components riêng biệt.
   - Chuẩn hóa lại việc gọi chung một `ConfirmModal.tsx` trên toàn hệ thống.
2. **Tối ưu Hiệu năng Client (React)**
   - Sửa Dashboard: Chuyển 3 API calls sang Server-side rendering để tránh Waterfall load.
   - Thêm Debounce cho ô Search trong `FilterPanel.tsx`.
   - Lazy Load các Alert Widgets không nằm trong khung hình đầu tiên.
3. **Centralized Utilities & Zod**
   - Xây dựng thư mục `src/lib/utils/` cho `formatCurrency`, `formatDate`.
   - Xây dựng Zod schemas chuẩn mực cho Asset, License và User.

---

> [!IMPORTANT]
> Sếp hãy review Roadmap trên. Chúng ta nên triển khai theo nguyên tắc Cuốn chiếu (Cuốn xong Sprint nào, QA test ngay Sprint đó). 
> 
> Nếu sếp đồng ý với chiến lược này, hãy bấm **Proceed**. Tôi sẽ bắt đầu soạn file Kế hoạch (PLAN) và Thi công chi tiết (MSEW) cho **SPRINT 1 (Security Hotfixes)** trước tiên để giao cho Tier 2!
