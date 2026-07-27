# MSEW: C5-C6 - Saved Searches & Advanced Filter Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Nâng cấp hệ thống tìm kiếm cho các trang danh sách (Assets, Licenses, Users) để đáp ứng chuẩn phần mềm ERP.

## C5. Saved searches (Lưu bộ lọc tìm kiếm)
1. **Ngữ cảnh:** IT Manager thường xuyên phải lọc "Laptop cũ hỏng tại kho Hà Nội", mỗi lần lọc phải chọn lại 3, 4 Dropdown rất mệt.
2. **Schema:** Tạo bảng mới `SavedSearch(id, userId, name, entityType, queryParams)`.
3. **UI:** Bên cạnh thanh Filter hiện tại, thêm nút "Lưu bộ lọc". Bấm vào cho phép đặt tên (vd: "Laptop hỏng kho HN"). Thêm Dropdown "Bộ lọc của tôi" để gọi nhanh các bộ lọc đã lưu.
4. **Logic:** Lưu Query String hiện tại của URL vào Database và tải lại khi cần.

## C6. Advanced filter (Lọc đa tầng)
1. **Ngữ cảnh:** Thanh search hiện tại thường chỉ lọc được 1-2 trường (search text + status). Cần bộ lọc nâng cao (Advanced Filter Modal).
2. **UI:** Thêm nút Filter (icon phễu). Bấm vào mở Drawer (Trượt từ phải sang) hoặc Modal chứa hàng tá Dropdowns: 
   - Lọc theo Location
   - Lọc theo Manufacturer
   - Lọc theo Người đang giữ
   - Lọc theo Ngày mua (Date range)
   - Lọc theo Giá trị (Number range)
3. **Backend Prisma:** Trang `page.tsx` phải móc hết toàn bộ các `searchParams` này và ném vào câu lệnh `where` của Prisma. Phải xử lý tốt vấn đề logic AND/OR.
