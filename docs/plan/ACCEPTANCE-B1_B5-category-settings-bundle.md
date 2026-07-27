# ACCEPTANCE: B1-B5 - Category & Settings CRUD Bundle

**Người lập:** Tier 1 (Planner)

## B1. Category
```
[ ] B1_1. Trang Edit/New Category có các trường `eulaText`, `checkinEmail`, `requireAcceptance`, `color`.
[ ] B1_2. Lưu thành công và hiển thị đủ các cột trên bảng danh sách.
```

## B2. Status Label
```
[ ] B2_1. Trang Edit/New Status Label có trường chọn `type` (Enum: deployable, pending, undeployable, archived).
[ ] B2_2. Lưu thành công, Status badge hiển thị màu sắc tương ứng theo type.
```

## B3. Location
```
[ ] B3_1. Trang Edit/New Location hiển thị đủ các input: `address`, `address2`, `city`, `state`, `country`, `zip`.
[ ] B3_2. Lưu dữ liệu thành công xuống DB.
```

## B4. Department
```
[ ] B4_1. Trang Edit/New Department có dropdown chọn `managerId`, `locationId`, `companyId`.
[ ] B4_2. Lưu dữ liệu thành công xuống DB.
```

## B5. Settings
```
[ ] B5_1. Trang Global Settings có các input để điền `siteName`, `brandLogo`, `supportEmail`.
[ ] B5_2. Nút Lưu Cấu hình hoạt động ổn định (cập nhật bản ghi duy nhất trong bảng Setting).
```
