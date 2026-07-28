# ACCEPTANCE: Sprint R.4

**Tiêu chí nghiệm thu:**
- [ ] Truy cập `http://localhost:3000/settings/integrations`. Chuyển qua lại giữa 3 tab API, Email, Notification mượt mà, không lỗi React. Code đã được chẻ thành 3 file vật lý.
- [ ] Mở Dashboard (`/`). Quan sát Network Tab (F12) KHÔNG còn thấy trình duyệt bắn 3 request `/api/reports/...` ngay khi vừa vào trang nữa (vì đã load server-side). Dashboard hiện ra tức thì không bị nháy.
- [ ] Vào trang Quản lý Tài sản, gõ nhanh chữ vào ô Tìm kiếm (Filter Panel). Quan sát thấy UI không bị đơ giật do debounce đã chặn việc gọi state liên tục, chỉ chạy filter sau 300-500ms ngừng gõ phím.
