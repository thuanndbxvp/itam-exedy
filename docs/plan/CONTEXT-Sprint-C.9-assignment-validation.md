# CONTEXT: Sprint C.9 - Asset & License Assignment Validation

## Hiện trạng (Current State)
- Frontend (AssetsList, AssetDetail, LicenseSeats) hiện đang render nút "Cấp phát" (Checkout) cho tất cả các thiết bị/bản quyền rảnh rỗi (chưa gán cho ai).
- Lỗ hổng: Nút Checkout không hề quan tâm đến trạng thái (status) của thiết bị. Thiết bị "Đang sửa chữa" (deployable=false) hoặc "Đã thanh lý" vẫn hiện nút Checkout, gây nhầm lẫn cho người dùng.
- Backend: Khi click Checkout, Backend mới chửi lỗi bằng `InvalidStateError`. Điều này gây trải nghiệm UX rất tệ.
- Target Asset: Khi cấp phát 1 Linh kiện hoặc Bản quyền vào một Thiết bị khác (Target Asset), Backend hiện tại hoàn toàn KHÔNG kiểm tra trạng thái của Target Asset. (Có thể gán RAM mới vào 1 cái Laptop đã đem đi bán đồng nát).

## Mong muốn (Desired State)
- Frontend: Cần truyền dữ liệu `status: { deployable: boolean }` xuống UI và dùng nó để disable nút Checkout hoặc ẩn đi nếu trạng thái không cho phép cấp phát.
- Backend: Phải thắt chặt Command `checkoutAssetToAsset` và `checkoutLicenseSeatToAsset` để đảm bảo Target Asset KHÔNG ĐƯỢC ở trạng thái đã bị thanh lý (Archived = true). Cần thông báo rõ lỗi "Không thể gán vào thiết bị đã thanh lý".
