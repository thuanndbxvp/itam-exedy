# ACCEPTANCE CRITERIA: Sprint C.10 - Real-time Notifications

Tất cả các tiêu chí sau phải được đánh dấu hoàn thành trước khi chốt lại Sprint C.10.

1. **Hiệu suất & Ổn định:**
   - Ứng dụng không bị crash khi mạng chập chờn. Thư viện `pusher-js` tự động reconnect khi có mạng lại.
   - Thư viện Pusher Server chỉ chạy lúc có sự kiện phát sinh, không làm treo các endpoint API khác của Next.js (không rò rỉ bộ nhớ).

2. **Chức năng "Ting Ting":**
   - Đảm bảo file `.mp3` load đúng đường dẫn tĩnh (`/ting-ting.mp3`).
   - Nếu Browser chặn Auto-play (rất phổ biến), phải có một khối `catch(error)` để chặn lỗi văng ra Console đỏ lòm, không làm sập giao diện React.

3. **Giao diện làm mới tự động:**
   - Đảm bảo lệnh `router.refresh()` chỉ được gọi khi cần thiết để tránh tình trạng reload thừa thãi. Việc gọi lệnh này phải kích hoạt Next.js kéo lại dữ liệu từ Server mà không bị dính cache cũ.

4. **Kịch bản thực tế:**
   - Khi Nhân viên (Employee A) submit tạo 1 Ticket mới.
   - Admin IT đang ngồi xem trang `/helpdesk`.
   - Admin IT phải nghe tiếng "Ting Ting", thấy popup bật lên, và dòng Ticket của Employee A tự động chui vào đầu bảng danh sách Ticket mà không cần đụng tay vào phím F5.
