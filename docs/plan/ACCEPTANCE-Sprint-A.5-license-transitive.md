# ACCEPTANCE: Sprint A.5 - License-Asset Transitive UI

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] A5_1. Vào trang chi tiết Tài sản bất kỳ, thấy có Tab "Bản quyền" kèm số lượng ở tiêu đề Tab.
[ ] A5_2. Bấm vào Tab "Bản quyền" của Tài sản, thấy nút "+ Gán bản quyền" (Chỉ Admin thấy).
[ ] A5_3. Bấm "+ Gán bản quyền", chọn phần mềm Office, modal gọi API `/seats?available=true` và hiện danh sách key trống. Bấm gán thành công.
[ ] A5_4. Vào trang chi tiết User, thấy Tab "Bản quyền".
[ ] A5_5. Trong Tab "Bản quyền" của User có 2 danh sách rõ ràng: (Trực tiếp) và (Qua thiết bị - Kèm tooltip giải thích).
[ ] A5_6. Đăng nhập bằng tài khoản Employee thường. Thử truy cập URL `/settings/users/[id_cua_thang_khac]/licenses` => Bị văng ra Not Found hoặc Cấm truy cập.
```

## Non-Functional
```
[ ] NF1. Dùng prisma Include / computed query để lấy dữ liệu thay vì sửa Database Schema, đảm bảo an toàn tuyệt đối cho cơ sở dữ liệu.
[ ] NF2. Filter `deletedAt: null` luôn được áp dụng trong mọi query để không gọi lên các bản quyền đã thu hồi (soft-delete).
```
