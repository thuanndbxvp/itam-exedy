# Phân bổ Kỹ năng (SKILL-ROUTING): Auth & Licenses

## 1. Chiến lược tổng thể (Overall Strategy)
- Tính năng này bao hàm thiết lập Authentication Flow (Backend + Middleware) và giao diện UI cho cả Login lẫn Danh sách Bản quyền.
- Yêu cầu sự kết hợp giữa kỹ năng Fullstack Next.js (cho Middleware/API Routes) và UI Styling (cho giao diện Tailwind).

## 2. Bảng Phân bổ theo Step (Per-step Mapping)
| MSEW Step | Tên Task | Primary Skill | Reference Skill | Lý do chỉ định tuyến |
| :--- | :--- | :--- | :--- | :--- |
| Step 1 | Environment Variables | `config-management` | `None` | Thiết lập bảo mật cho JWT NextAuth. |
| Step 2 | Cấu hình NextAuth | `backend-development` | `None` | Logic xác thực, custom Session Provider và JWT callback. |
| Step 3 | Trang Đăng nhập | `frontend-development` | `ui-styling` | Dựng Form UI bằng Tailwind, handle state. |
| Step 4 | Server Action (License)| `backend-development` | `databases` | Thực thi Prisma queries để Insert License, ActionLog. |
| Step 5 | UI Quản lý Bản quyền | `frontend-development` | `ui-styling` | Hiển thị bảng danh sách, Form thêm mới. |

## 3. Các kỹ năng xuyên suốt (Cross-cutting Skills)
- `debugging`: Sẽ được gọi nếu cấu hình NextAuth xảy ra lỗi (như lỗi secret hoặc mismatch Session token).
- `code-review`: Tầng 1 sẽ review cấu trúc trước khi merge, đảm bảo code tuân thủ nghiêm ngặt Next.js 15 App Router.
