# MSEW-Sprint-C.7: Thực thi Vá lỗ hổng Phân quyền

## BƯỚC 1: RÚT QUYỀN CẤP CAO KHỎI EMPLOYEE
- **File:** `src/lib/permissions/catalog.ts`
- **Hành động:** 
  Tìm đến biến object `SYSTEM_ROLE_PERMISSIONS`. 
  Ở key `EMPLOYEE`, hãy xóa đi các chuỗi `'assets.read'`, `'licenses.read'`, `'users.read'`.
  
  **Đoạn code MỚI phải là:**
  ```typescript
  EMPLOYEE: [
    'helpdesk.view',
    'helpdesk.create_ticket',
    'helpdesk.comment',
  ],
  ```

## BƯỚC 2: CẬP NHẬT GIAO DIỆN KIỂM TRA (Tùy chọn)
- Không có bước 2. Sự thay đổi quyền ở file catalog sẽ tự động áp dụng (Dynamic Resolve) vào hệ thống sau khi user reload trang (do cache permission được clear). Không cần can thiệp logic Database.
