# PLAN: Sprint C.12 - Handover PDF & E-Sign

## 1. Mục tiêu
- Sinh file PDF Biên bản bàn giao thiết bị chuẩn form.
- Luồng ký nhận điện tử (E-Sign) cho người dùng cuối.

## 2. Các bước triển khai (Dành cho Tier 2)

### Bước 1: Setup thư viện PDF
- Cài đặt dependency: `npm install @react-pdf/renderer`
- Tạo template PDF tại `src/components/pdf/HandoverTemplate.tsx`. Đảm bảo load đúng font Arial hoặc Roboto hỗ trợ Tiếng Việt.

### Bước 2: Bổ sung nút In Biên bản
- Tại màn hình Chi tiết Tài sản (`AssetDetailClient.tsx`), tab "Lịch sử cấp phát" (Checkout History).
- Cạnh mỗi dòng lịch sử cấp phát, thêm một nút bấm có icon máy in (In Biên bản). Bấm vào sẽ mở tab mới render ra file PDF.

### Bước 3: Luồng Xác nhận E-Sign
- Trang cá nhân của User (`src/app/my-assets/page.tsx`) đã có (Sprint C.3).
- Ở đó liệt kê các thiết bị User đang giữ.
- Bổ sung nút "Xác nhận nhận tài sản" cho các thiết bị mới checkout.
- Bấm vào sẽ gọi API `/api/assets/accept` để ghi log `ActionType.ACCEPTED` vào bảng DB.
