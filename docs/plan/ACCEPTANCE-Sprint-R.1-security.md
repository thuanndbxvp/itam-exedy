# ACCEPTANCE: Sprint R.1

**Tiêu chí nghiệm thu (Dành cho QA / Tier 1):**
- [ ] Tính năng Update Settings ở giao diện Admin (General/Security/Branding) vẫn hoạt động bình thường, ghi dữ liệu chuẩn vào DB.
- [ ] Sidebar vẫn phân quyền đúng, mở Console F12 (Application -> SessionStorage) KHÔNG còn thấy key lưu Permissions nữa.
- [ ] Đăng nhập bằng acc EMPLOYEE, tự ý gõ URL call API `/api/reports/summary` sẽ bị trả về lỗi 403 Forbidden.
- [ ] Đăng nhập bằng acc EMPLOYEE, không thể call API tạo Maintenance Record hoặc xem History thiết bị của giám đốc.
- [ ] Spam API `/api/auth/login` quá 5 lần trong 15 phút sẽ bị trả về lỗi 429 Too Many Requests.
