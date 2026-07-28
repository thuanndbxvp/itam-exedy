# MSEW: Sprint C.9 - Asset & License Assignment Validation

## Metrics
- Giảm số lượng lỗi 400 (InvalidStateError) do người dùng click nhầm vào các tài sản đang hỏng.
- Trải nghiệm người dùng (UX) khi quản lý tài sản mượt mà hơn, trực quan hơn (nhìn là biết tài sản nào cho mượn được, cái nào không).

## Stakeholders
- **System Admin**: Đỡ bực mình vì UI rối rắm.
- **IT Manager & IT Staff**: Không bị lừa click vào các thiết bị đang hỏng hóc để rồi nhận lỗi 400 vào mặt.

## Execution
- **Role**: Tier 2 (Backend/Frontend Dev)
- **Tooling**: Next.js, Prisma, React, TailwindCSS.

## Workflow (Hành vi mong đợi)
- Người dùng vào trang Danh sách Thiết bị.
- Thiết bị "Đang sửa chữa" (Sửa chữa là trạng thái có `deployable: false`) sẽ hiển thị Nút "Cấp phát" bị MỜ (disabled).
- Hover vào nút đó sẽ hiện Tooltip: "Trạng thái thiết bị không cho phép cấp phát".
- Nếu người dùng xài Postman gọi API cấp phát RAM vào một Server đã bị đánh dấu "Đã thanh lý", hệ thống văng lỗi 400 "Không thể gán vào thiết bị đã thanh lý".
