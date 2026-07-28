# Phân bổ Kỹ năng (SKILL-ROUTING): Sprint C.4 - Nâng cấp UX & Security

## 1. Chiến lược tổng thể (Overall Strategy)
Sprint C.4 tập trung chủ yếu vào giao diện (Frontend) và bảo mật luồng API (Backend Security). Do đó, nhóm kỹ năng (skills) cốt lõi cần huy động là `frontend-development` để thao tác với React/Next.js/TailwindCSS, kết hợp với `backend-development` để xử lý logic mật khẩu (bcrypt) ở tầng API. Thêm vào đó, kỹ năng `ui-styling` được ưu tiên để đảm bảo tính thẩm mỹ khi dàn layout (Grid) và làm Tooltip.

## 2. Bảng Phân bổ theo Step (Per-step Mapping)

| MSEW Step | Task ID / Tên | Primary Skill | Reference Skill | Fallback Skill | Lý do định tuyến |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Step 1 | API Security & Xóa | `backend-development` | `security` | `frontend-development` | Xử lý logic bcrypt và truyền API từ Modal. |
| Step 2 | Hệ thống Toast | `frontend-development` | `ui-styling` | `None` | Cài đặt thư viện và gắn Provider `<Toaster />`. |
| Step 3 | Dọn dẹp Alert/Confirm | `frontend-development` | `code-review` | `None` | Refactor hàng loạt Component sang Custom Modal. |
| Step 4 | Form UX & Tooltips | `ui-styling` | `frontend-development` | `aesthetic` | Chia layout Grid 2 cột, CSS cho Tooltip và text. |

## 3. Các kỹ năng xuyên suốt (Cross-cutting Skills)
- Những skill có thể gọi ở bất kỳ step nào nếu gặp rủi ro:
  - `debugging`: Chắc chắn sẽ dùng tới khi lệnh `npx tsc --noEmit` báo lỗi do sửa nhầm interface hoặc import sai thư viện.
  - `code-review`: Khi hoàn tất các màn refactor (Step 3) để đảm bảo không gõ sai logic gốc của ứng dụng.
