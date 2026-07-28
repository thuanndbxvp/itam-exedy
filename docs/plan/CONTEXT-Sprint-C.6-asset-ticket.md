# CONTEXT: Sprint C.6 - Asset-centric Tickets

**Bối cảnh:**
Thay vì bắt ép IT tạo Ticket hộ dưới danh nghĩa nhân viên, chúng ta chuyển khái niệm này thành "Work Order" (Lệnh bảo trì) nội bộ. IT Staff chính là Reporter, trực tiếp báo cáo và xử lý vấn đề trên máy chủ/switch/tài sản của công ty mà không cần liên kết với chủ sở hữu.

**Rủi ro:**
- Đảm bảo Dropdown tìm kiếm (Autocomplete) ở Frontend có `z-index` và `position: relative` bọc ngoài đủ chuẩn để khi danh sách thả xuống không bị che khuất bởi Form phía dưới hay các thành phần khác.
- Việc tái sử dụng State `myData` phải cẩn thận không làm sập logic tự động chọn Category `HARDWARE` hay `SOFTWARE` có sẵn ở `useEffect`.
