# Kế hoạch Kiểm thử Bảo mật Tổng thể (ITAM System)

Kế hoạch này được thiết kế để bạn tự thực hiện việc rà soát và kiểm thử bảo mật cho hệ thống quản lý tài sản IT. Quá trình kiểm thử được chia thành 3 hướng tiếp cận chính.

---

## Hướng 1: Khảo sát mã nguồn (Code Audit / Trực tiếp trên Codebase)
*Mục tiêu: Tìm kiếm các lỗ hổng về kiến trúc, phân quyền và rò rỉ dữ liệu bằng cách đọc code.*

### 1.1. Kiểm tra Lỗ hổng Phân quyền & Cô lập dữ liệu (Tenant Isolation)
- **Rà soát `src/app/page.tsx` và các trang danh sách (`/assets`, `/licenses`):**
  - Đảm bảo có sử dụng `getServerSession()` để lấy thông tin user hiện tại.
  - Kiểm tra xem câu lệnh `prisma.findMany` có điều kiện lọc (`where`) bắt buộc giới hạn theo `userId` (hoặc `assignedUserId`) đối với những role có đặc quyền thấp (như `EMPLOYEE`) hay không.
  - **Dấu hiệu lỗi:** Truy vấn cơ sở dữ liệu lấy toàn bộ danh sách mà không kiểm tra role hoặc ID của user đang request.
- **Rà soát API Routes (`src/app/api/...`):**
  - Đảm bảo mọi API trả về dữ liệu danh sách hoặc thống kê đều phải phân tách rạch ròi kết quả dựa trên `session.user.role`.

### 1.2. Kiểm tra Insecure Direct Object Reference (IDOR)
- **Rà soát các trang Chi tiết (ví dụ: `/assets/[id]`, `/licenses/[id]`):**
  - Tìm kiếm các truy vấn `prisma.findUnique`.
  - **Dấu hiệu lỗi:** Nếu hệ thống chỉ tìm kiếm tài liệu theo `id` trên URL mà không có đoạn code nào kiểm tra xem `session.user.id` có phải là chủ sở hữu (hoặc có quyền quản trị) của tài liệu đó hay không. (Ví dụ: `if (role === 'EMPLOYEE' && asset.assignedUserId !== session.user.id) throw Error`).

### 1.3. Kiểm tra Server Actions (`src/app/actions/...`)
- **Rà soát Mass Assignment:**
  - Kiểm tra xem khi update một record (ví dụ User), hệ thống có nhận toàn bộ payload từ client (`...data`) và đưa thẳng vào Prisma hay không.
  - **Dấu hiệu lỗi:** Hacker có thể gửi kèm field `role: 'ADMIN'` trong payload cập nhật Profile và chiếm quyền. Đảm bảo sử dụng schema validation (Zod) để bóc tách chính xác các trường được phép sửa.

---

## Hướng 2: Tấn công Hộp đen (Black-box) - Không có User (Unauthenticated)
*Mục tiêu: Đóng vai tin tặc bên ngoài cố gắng khai thác hệ thống đang chạy trực tiếp trên `https://itam-exedy.vercel.app/` mà không có tài khoản.*

### 2.1. Authentication Bypass (Vượt rào xác thực)
- Sử dụng các công cụ như Postman hoặc cURL, gửi request trực tiếp đến các endpoint API nội bộ (ví dụ: `GET https://itam-exedy.vercel.app/api/users` hoặc `GET /api/reports/summary`) mà **không mang theo cookie Session**.
- **Kỳ vọng:** Trả về `401 Unauthorized` hoặc `403 Forbidden`.
- **Dấu hiệu lỗi:** API trả về dữ liệu nhạy cảm (200 OK) do lập trình viên quên bọc `getServerSession` trong route đó.
- Thử truy cập trực tiếp các URL giao diện như `/settings/general` qua trình duyệt ẩn danh.

### 2.2. Kiểm thử Cơ chế Đăng nhập (Brute Force & Rate Limiting)
- Tại trang `/login`, thử nhập sai mật khẩu liên tục 50-100 lần.
- **Kỳ vọng:** Hệ thống nên khóa tạm thời tài khoản hoặc chặn IP (Rate limit) để chống Brute force.
- **Dấu hiệu lỗi:** Vẫn cho phép thử mật khẩu vô hạn lần.

### 2.3. Khai thác Lỗ hổng XSS (Cross-Site Scripting) không xác thực
- Nếu trang web có các form công khai (ví dụ: Form liên hệ, hoặc trang đăng nhập có hiển thị lại username bị lỗi), hãy thử nhập payload: `<script>alert('XSS')</script>`.
- **Kỳ vọng:** Text được render dưới dạng chuỗi thông thường (Next.js mặc định chống XSS tốt).

---

## Hướng 3: Tấn công Nâng quyền (Grey-box) - Đã có User giới hạn
*Mục tiêu: Sử dụng tài khoản `EMPLOYEE` hoặc `IT_STAFF` để cố gắng truy cập dữ liệu và thực thi các hành động của `ADMIN`.*

### 3.1. Tấn công Nâng quyền Chiều dọc (Vertical Privilege Escalation)
- **Kịch bản:** Đăng nhập bằng tài khoản `EMPLOYEE`.
- **Thử nghiệm UI:** Dùng DevTools chỉnh sửa giao diện để hiện các nút bị ẩn (ví dụ: nút "Xóa User"), sau đó click thử.
- **Thử nghiệm API:** Sử dụng Postman (có copy Cookie của EMPLOYEE) để gửi lệnh `DELETE https://itam-exedy.vercel.app/api/settings/users/[id-nào-đó]`.
- **Kỳ vọng:** Dù có gọi được API, backend vẫn phải chặn lại và trả về `403 Forbidden` vì API đã verify role.
- **Dấu hiệu lỗi:** Nếu backend bị thiếu Guard, lệnh xóa hoặc chỉnh sửa (của Admin) sẽ bị thực thi thành công bởi Employee.

### 3.2. Tấn công IDOR (Nâng quyền Chiều ngang - Horizontal Privilege Escalation)
- **Kịch bản:** Đăng nhập bằng Nhân viên A.
- **Thử nghiệm URL:** Trên thanh địa chỉ, bạn đang xem ticket của mình: `/helpdesk/TKT-001`. Hãy tự ý đổi URL thành `/helpdesk/TKT-002` (là ticket của Nhân viên B, hoặc ticket bảo mật của Giám đốc).
- **Thử nghiệm API:** Thử bắt request lúc tạo Ticket (POST), và cố tình đổi trường `reporterId` thành ID của người khác, hoặc đổi `status` thẳng thành `RESOLVED`.
- **Kỳ vọng:** Trả về lỗi 403 hoặc 404 Không tìm thấy, và không lưu các trường dữ liệu trái phép.

### 3.3. Tấn công Kỹ thuật (Mass Assignment qua Update)
- **Kịch bản:** Dùng tài khoản `EMPLOYEE`.
- Tìm một chức năng cho phép cập nhật thông tin (ví dụ: Sửa profile cá nhân).
- Dùng công cụ chặn bắt request (như Burp Suite hoặc tab Network trong DevTools). Thêm vào payload JSON các trường nhạy cảm: `{"firstName": "Hacker", "role": "ADMIN", "customRoleId": "id-cua-admin"}`.
- Gửi request. Log xuất ra lại token, hoặc kiểm tra quyền.
- **Kỳ vọng:** Các trường bổ sung (`role`, `customRoleId`) bị API loại bỏ hoàn toàn (strip).
- **Dấu hiệu lỗi:** Tài khoản EMPLOYEE đột nhiên biến thành ADMIN.
