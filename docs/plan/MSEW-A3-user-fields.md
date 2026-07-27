# MSEW: A3 - User form bổ sung fields

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Mở rộng API endpoint để lưu trữ toàn bộ các trường thông tin của bảng User, sau đó thiết kế lại Form để người dùng có thể nhập liệu.

## Các bước thực thi chi tiết (Dành cho Tier 2)

### Bước 1: Mở rộng API whitelist (`src/app/api/settings/users/[id]/route.ts`)
- Mở file API, tìm đoạn `const { firstName, lastName, ... } = body`.
- Bổ sung thêm các biến sau vào whitelist: `username, employeeNum, phone, mobile, address, city, state, country, zip, notes, avatar, activated, companyId, locationId, managerId, remote, vip, autoassignLicenses`.
- Trong cục `await prisma.user.update(...)`, truyền tất cả các trường mới này vào object `data`.
- **Lưu ý Cực Kỳ Quan Trọng**: Tuyệt đối không nhét `password`, `twoFactorSecret` hay bất kỳ field nhạy cảm nào chưa được cấp phép vào whitelist.
- Làm tương tự (hoặc cẩn thận hơn) cho POST `/api/settings/users/route.ts` (API tạo user mới).

### Bước 2: Bổ sung Unique Validation (Tuỳ chọn nhưng nên có)
- Trước khi gọi `update`, nên có khối try-catch hoặc kiểm tra tay: nếu user cố đổi `username` hoặc `employeeNum` sang một giá trị đã tồn tại của user khác, trả về lỗi 400.

### Bước 3: Nâng cấp `EditUserForm.tsx` & `NewUserForm.tsx`
- Do form nay đã có tới hơn 20 trường, bạn nên chia UI thành các Tab hoặc Section rõ ràng (VD: Dùng Grid 2 cột hoặc bọc bằng thẻ `<fieldset>` có `<legend>`):
  1. **Thông tin cơ bản**: Username, Name, Avatar (chỉ cần input text URL tạm thời hoặc nút upload giả), Notes.
  2. **Liên hệ**: Phone, Mobile, Address, City, State, v.v.
  3. **Tổ chức**: Company, Location, Manager (dropdown hoặc text ID), Department.
  4. **Quyền & Trạng thái**: Role, Activated (Toggle/Switch), VIP, Remote...
- Cập nhật hàm gọi fetch `/api/settings/users/[id]` lúc ban đầu để đảm bảo load đủ các trường này vào State.

### Bước 4: Sửa bảng danh sách `UsersTable.tsx`
- Bổ sung thêm 2 cột: **Ảnh đại diện** (Avatar dạng hình tròn nhỏ 32x32) và **Mã NV / SĐT** (EmployeeNum / Phone).

### Bước 5: Kiểm thử
- Tạo 1 user mới với đầy đủ tất cả các trường (vào form New).
- Edit lại user vừa tạo, đổi SĐT, chuyển `activated` thành `false`.
- Quay lại bảng xem các cột mới có hiển thị đúng thông tin không.
