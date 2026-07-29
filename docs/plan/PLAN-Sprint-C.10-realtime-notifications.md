# PLAN: Sprint C.10 - Real-time Notifications & Audio

## 1. Mục tiêu
Thiết lập hệ thống thông báo thời gian thực (Real-time) sử dụng Pusher Channels để đẩy thông báo trạng thái/cập nhật Ticket về cho trình duyệt của User ngay lập tức (không cần F5), kèm theo hiệu ứng âm thanh "Ting Ting" để gây chú ý.

## 2. Kiến trúc & Môi trường
- **Công nghệ lõi:** Pusher Channels (bên thứ 3) chuyên trị Real-time cho Serverless Next.js.
- **Biến môi trường (.env):**
  - `PUSHER_APP_ID="2181047"`
  - `NEXT_PUBLIC_PUSHER_KEY="a40457e19d92074cd9bb"`
  - `PUSHER_SECRET="addf0bb2969cb38be2fa"`
  - `NEXT_PUBLIC_PUSHER_CLUSTER="ap1"`

## 3. Các bước triển khai (Dành cho Tier 2)

### Bước 1: Khởi tạo Pusher Server & Client
1. Cài đặt dependency: `npm install pusher pusher-js`
2. Tạo file `src/lib/pusher.ts` chứa instance của Pusher (Server-side) dùng để `trigger` event.
3. Tạo file `public/ting-ting.mp3` (Tier 2 có thể tự tạo hoặc tải 1 file mp3 nhỏ gọn).

### Bước 2: Xây dựng `<RealtimeListener />` (Client Component)
- Nằm tại `src/components/RealtimeListener.tsx`.
- Lắng nghe channel `helpdesk-updates`.
- Bắt các event: `ticket-created`, `ticket-updated`.
- Khi có event:
  - Play âm thanh `ting-ting.mp3`.
  - Hiển thị Toast thông báo nội dung (ví dụ: "Ticket #123 vừa được tạo!").
  - Chạy `router.refresh()` để cập nhật lại danh sách trên giao diện.
- Gắn component này vào Root Layout (`src/app/layout.tsx`) để nhận thông báo ở mọi trang.

### Bước 3: Gắn Trigger vào Backend APIs
- Tại `src/app/api/tickets/route.ts`:
  - Trong hàm `POST` (Tạo ticket): Gọi `pusher.trigger('helpdesk-updates', 'ticket-created', { ticketId, title })`.
- Tại `src/app/api/tickets/[id]/route.ts`:
  - Trong hàm `PATCH` (Cập nhật ticket): Phát event `ticket-updated`.
- Tại `src/app/api/tickets/[id]/comments/route.ts`:
  - Trong hàm `POST` (Tạo comment): Phát event `ticket-updated` báo có comment mới.
