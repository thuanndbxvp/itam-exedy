# MSEW: C7-C9 - Integration & Enterprise Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Xây dựng cổng giao tiếp cho phép hệ thống quản lý IT này kết nối và gửi tín hiệu ra thế giới bên ngoài (Slack, Teams, HRMS, CRM).

## C7. Webhooks & API tokens
1. **API Tokens (Personal Access Token):** 
   - **Schema:** Bảng `ApiToken(id, userId, tokenHash, scopes, expiresAt)`.
   - **UI:** Thêm trang Cài đặt / API Key. Cho phép User tự tạo Token (chuỗi ngẫu nhiên 32 ký tự). Chỉ hiện 1 lần duy nhất lúc vừa tạo.
   - **Logic:** Viết 1 middleware `withApiAuth` để bảo vệ các route `/api/v1/assets`.
2. **Webhooks:**
   - **Schema:** Bảng `Webhook(id, targetUrl, events)`.
   - **Logic:** Mỗi khi có hành động lớn (Thêm tài sản mới, Giao tài sản cho nhân viên), gọi HTTP POST tới `targetUrl` của Webhook để báo cho server bên ngoài biết.

## C8. Email templates editor
1. **Ngữ cảnh:** IT Manager muốn tự sửa nội dung thư thông báo (vd: "Thêm logo cty vào đuôi email") mà không cần nhờ Dev sửa code.
2. **UI:** Tại trang Settings, thêm Tab "Email Templates".
3. **Thư viện:** Dùng một thư viện soạn thảo (như TipTap, React Quill hoặc thư viện kéo thả Email builder).
4. **Logic:** Lưu chuỗi HTML của Template vào DB. Hàm `sendEmail()` sẽ bọc nội dung động (biến) vào khung HTML này trước khi gửi qua SMTP.

## C9. SMS/Slack/Teams notification channels
1. **Ngữ cảnh:** Thay vì chỉ gửi Email, khi hệ thống sắp sập hoặc thiết bị đắt tiền bị hỏng (Priority = Critical), gửi thẳng tin nhắn chat cho sếp.
2. **UI:** Tại trang Cài đặt thông báo (Sprint B10 đã làm), bổ sung thêm các tùy chọn: "Gửi qua Slack", "Gửi qua Teams", "SMS (Twilio)". Cần các field nhập Webhook URL của Slack/Teams.
3. **Logic:** 
   - Bổ sung logic vào module Notification (`Epic H`). Nếu có trigger sự kiện, gọi hàm `sendSlackNotification(webhookUrl, message)`.
