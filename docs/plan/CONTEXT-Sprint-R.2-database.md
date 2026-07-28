# CONTEXT: Sprint R.2 - Database & Integrity

**Bối cảnh:**
Khi dữ liệu công ty phình to hàng ngàn bản ghi, việc thiếu Index trên trường `deletedAt` (vốn được dùng để lọc ở 100% các câu query danh sách) sẽ gây ra tình trạng Full Table Scan, làm chậm toàn bộ hệ thống. Bên cạnh đó, các lỗi logic về dữ liệu mồ côi (Orphaned data) và kiểm tra số âm tuy nhỏ nhưng gây sai lệch báo cáo tài chính trầm trọng.

**Rủi ro:**
- Khi đẩy (Push) thay đổi của `schema.prisma` lên DB, hãy cẩn thận nếu database local có dữ liệu rác không tương thích với index.
- Việc đổi `findUnique` thành `findFirst` (để dùng chung với `deletedAt: null`) là bắt buộc theo cú pháp của Prisma.
