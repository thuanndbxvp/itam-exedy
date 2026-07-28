# PLAN: Sprint C.9 - Asset & License Assignment Validation

## 1. Mục tiêu
Siết chặt quy trình cấp phát (Checkout) thiết bị và bản quyền dựa trên trạng thái (status). Hiện tại UI cho phép click "Cấp phát" với mọi thiết bị dù chúng đang hỏng, sửa chữa hoặc chờ thanh lý. Mục tiêu là vô hiệu hóa nút Checkout và bổ sung kiểm tra Backend chặt chẽ để đảm bảo tính nhất quán của dữ liệu.

## 2. Quy tắc nghiệp vụ (Business Rules)
1. **Thiết bị (Asset):** Chỉ được cấp phát nếu `status.deployable == true`, VÀ KHÔNG bị `pending`, KHÔNG bị `archived`.
2. **Bản quyền (License Seat):** Chỉ được cấp phát nếu chưa hết hạn (`expirationDate > now`) HOẶC có thể tái sử dụng (`reassignable == true`).
3. **Thiết bị Đích (Target Asset):** Khi cấp phát Linh kiện/Bản quyền vào Thiết bị Đích, Thiết bị Đích KHÔNG ĐƯỢC ở trạng thái "Đã thanh lý" (`archived == true`), nhưng không bắt buộc phải `deployable == true`.

## 3. Danh sách thay đổi
### Frontend
- `src/app/assets/AssetsPageClient.tsx`: Disable nút CheckoutAssetButton nếu `!asset.status.deployable`.
- `src/app/assets/[id]/AssetDetailClient.tsx`: Tương tự.
- `src/app/licenses/[id]/LicenseSeatsClient.tsx`: Disable nút CheckoutSeatButton nếu License hết hạn & không thể tái gán.

### Backend
- `src/lib/commands/asset.ts`: Bổ sung kiểm tra Target Asset không được là `archived` trong `checkoutAssetToAsset`.
- `src/lib/commands/license.ts`: Bổ sung kiểm tra Target Asset không được là `archived` trong `checkoutLicenseSeat`.
