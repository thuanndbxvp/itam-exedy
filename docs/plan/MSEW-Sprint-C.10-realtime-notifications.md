# MAKE SURE EVERYTHING WORKS (MSEW): Sprint C.10 - Real-time Notifications

## Checklist Kiểm thử (Test Cases)

### 1. Kiểm tra Môi trường (Environment)
- [ ] Xác nhận các biến `PUSHER_...` đã được nạp thành công vào process Node.js.
- [ ] Chạy `npm install` thành công, project build (`npm run build`) không báo lỗi liên quan đến thư viện `pusher` hay `pusher-js`.

### 2. Kiểm tra Kết nối Pusher Client
- [ ] Mở trình duyệt, mở tab Network/WS (WebSockets), f5 lại trang.
- [ ] Xác nhận trình duyệt có một kết nối WebSocket mở tới `ws-ap1.pusher.com` và trạng thái kết nối là "Connected".

### 3. Kiểm thử Âm thanh & Giao diện (Event Subscription)
- [ ] Test tạo Ticket mới (từ tab Ẩn danh hoặc account khác).
- [ ] Tab hiện tại đang mở hệ thống phải phát ra âm thanh "Ting Ting" thành công.
- [ ] Phải xuất hiện Toast thông báo "Có ticket mới...".
- [ ] Bảng danh sách Ticket (nếu đang ở trang /helpdesk) phải tự động xuất hiện dòng Ticket mới mà không cần thao tác F5.

### 4. Các kịch bản mở rộng (Edge Cases)
- [ ] Trình duyệt chặn Auto-play Audio: Trình duyệt ngày nay thường chặn âm thanh phát tự động nếu User chưa từng tương tác với trang (click chuột/bấm phím). Tier 2 phải test xem âm thanh có chạy được không, nếu bị chặn thì Toast vẫn phải hiển thị bình thường chứ không được crash app.
- [ ] Thêm comment vào một ticket: Phải nảy Toast "Có phản hồi mới".
- [ ] Đổi trạng thái ticket: Phải nảy Toast thông báo "Trạng thái ticket thay đổi".
