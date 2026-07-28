# CONTEXT: Sprint R.1 - Security

**Bối cảnh:**
Hệ thống vừa bị phát hiện các lỗi bảo mật nghiêm trọng bởi Security Auditor Agent. Những lỗ hổng này có nguy cơ làm rò rỉ dữ liệu chéo giữa các nhân sự (IDOR) và chiếm quyền hệ thống.

**Lưu ý quan trọng:**
1. Tất cả các hàm `requirePermissionApi` có thể trả về một object `NextResponse` nếu bị lỗi phân quyền, nên cần check kỹ `if (actor instanceof NextResponse) return actor` hoặc tùy theo logic đang có sẵn trong file.
2. Thao tác trên Database (Prisma) ở bước 1 phải đảm bảo không phá vỡ logic update setting hàng loạt hiện tại.
