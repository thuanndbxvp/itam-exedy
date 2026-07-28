# ACCEPTANCE: Sprint R.2

**Tiêu chí nghiệm thu:**
- [ ] Schema Prisma được cập nhật đầy đủ Index và apply thành công xuống Database (không báo lỗi).
- [ ] Xóa thử 1 User đang có lịch sử ActionLog. Sau khi xóa, ActionLog của người đó vẫn hiển thị (nhưng bị gán tên hệ thống System) thay vì làm crash app.
- [ ] Tạo mới Thiết bị hoặc Bản quyền, cố tình điền `purchaseCost = -500`. Ứng dụng báo lỗi và không cho lưu.
- [ ] Quá trình giao/nhận thiết bị (Checkout/Checkin) không gặp lỗi biên dịch TS.
