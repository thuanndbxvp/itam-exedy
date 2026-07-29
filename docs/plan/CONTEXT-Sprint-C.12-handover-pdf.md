# CONTEXT: Sprint C.12 - Handover Documents & Transfer Workflow

## 1. Bối cảnh
Khi cấp phát máy tính đắt tiền cho nhân viên, phòng IT cần một biên bản bàn giao có chữ ký để ràng buộc trách nhiệm. Hiện tại hệ thống ITAM-PHP cũ có tính năng sinh PDF và chữ ký điện tử. Sếp muốn số hóa toàn bộ để bỏ giấy tờ.

## 2. Quyết định kỹ thuật
- **PDF Generation**: Sử dụng `@react-pdf/renderer` hoặc `jspdf` để render UI thành PDF. `@react-pdf/renderer` phù hợp với Next.js hơn vì nó build UI bằng các component `<View>`, `<Text>`.
- **E-Signature**: Thay vì bắt user vẽ tay lên màn hình (ít giá trị pháp lý nội bộ), ta sẽ áp dụng cơ chế "Xác nhận bằng tài khoản" (Click-to-sign). Khi nhận máy, User phải đăng nhập vào hệ thống ITAM bằng tài khoản của họ và ấn nút "Tôi xác nhận nhận thiết bị này". Hệ thống sẽ lưu lại IP, thời gian, và User ID để chốt vào DB.
- **Workflow**: Bảng `AssetAction` (Checkout) sẽ được dùng Enum `ActionType.ACCEPTED`.
