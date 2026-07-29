# CONTEXT: Sprint C.10 - Real-time Notifications & Audio

## 1. Bối cảnh
Người dùng mong muốn nhận được thông báo ngay lập tức (kèm âm thanh) khi có Ticket mới hoặc Ticket thay đổi trạng thái, nhằm tăng tốc độ phản hồi của team IT Helpdesk. Giao diện cũng cần tự động làm mới danh sách mà không yêu cầu người dùng phải bấm F5 thủ công.

## 2. Vấn đề kiến trúc
- Ứng dụng đang được deploy trên nền tảng Serverless (Vercel).
- Serverless Functions có giới hạn thời gian thực thi (timeout 10-60s), do đó việc duy trì các kết nối WebSocket hoặc Server-Sent Events (SSE) dài hạn bằng Node.js thuần là không khả thi.

## 3. Quyết định kỹ thuật (Technical Decision)
- **Công nghệ được chọn:** Pusher Channels.
- **Lý do:** Pusher cung cấp giải pháp Pub/Sub WebSocket được quản lý hoàn toàn (fully managed), rất phù hợp với kiến trúc Serverless. Next.js backend chỉ đóng vai trò "Trigger" (phát tín hiệu) tới Pusher thông qua một API HTTP ngắn hạn. Pusher server sẽ đảm nhiệm việc giữ kết nối WebSocket liên tục với trình duyệt của User và truyền tải event.
- **Thư viện:**
  - `pusher`: Server SDK dùng trong Server Actions để trigger events.
  - `pusher-js`: Client SDK dùng trong React Components để subscribe và nhận events.
- **UI & Trải nghiệm:** Sử dụng thẻ `<audio>` ẩn kết hợp với Toast (`react-hot-toast` hoặc Toast custom đang dùng) để hiển thị Popup, và gọi `router.refresh()` để reload lại dữ liệu RSC (React Server Components).
