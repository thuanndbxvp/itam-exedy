# Tiêu chí Nghiệm thu (ACCEPTANCE): Auth & Licenses

## 1. Tiêu chuẩn Chức năng (Functional Criteria)
- [ ] Giao diện Đăng nhập (`/login`) hiển thị form yêu cầu nhập Email.
- [ ] Gõ email `admin@congty.com` (Đã được tạo trong Seed data) sẽ đăng nhập thành công và chuyển hướng về trang `/assets`.
- [ ] Truy cập `/assets` hoặc `/licenses` từ trình duyệt ẩn danh (Incognito) phải bị văng ngược về trang `/login` ngay lập tức.
- [ ] Truy cập trang `/licenses` hiển thị được danh sách Bản quyền (nếu có dữ liệu).
- [ ] Submit form tạo mới Bản quyền thành công, redirect về lại trang `/licenses` và hiển thị thêm Bản quyền vừa tạo trong Table.

## 2. Tiêu chuẩn Phi chức năng (Non-functional)
- **Bảo mật:** Không để lộ `NEXTAUTH_SECRET` lên frontend (không để prefix `NEXT_PUBLIC_`).
- **Giao diện:** Form đăng nhập và form thêm bản quyền phải nằm ngay ngắn giữa màn hình, hiển thị tốt, responsive trên chuẩn Desktop/Tablet.
- **Trải nghiệm:** Server Action chạy mượt không cần reload lại layout gốc (tận dụng Next.js Cache Revalidation).

## 3. Các bước Manual Verification (Windows)
(Dành cho Tầng 3 Auditor hoặc người dùng tự test bằng trình duyệt)
```powershell
# Bước 1: Khởi động app
npm run dev

# Bước 2: Truy cập trang
Start-Process "http://localhost:3000/assets"
# Hệ thống PHẢI chặn bạn và đẩy về "http://localhost:3000/login"

# Bước 3: Đăng nhập
# Nhập Email: admin@congty.com -> Submit. Đợi redirect về /assets.

# Bước 4: Tạo License
Start-Process "http://localhost:3000/licenses/new"
# Điền dữ liệu và nhấn lưu, sau đó kiểm tra trang danh sách /licenses.
```
