# CONTEXT: Sprint C.8 - Child Assets

**Bối cảnh:**
Mô hình dữ liệu của Prisma đang cho phép 1 Asset móc nối với 1 Asset khác thông qua quan hệ 1-N (trường `assignedAssetId` trỏ đến 1 Asset cha). Tuy nhiên, UI chưa hỗ trợ khai thác hết view của dữ liệu này, dẫn đến nhân viên phàn nàn "Tôi được IT giao cả bộ máy bàn gồm Màn hình, Bàn phím, Chuột, nhưng trong Dashboard chỉ thấy ghi mỗi cái PC".
Sprint này sẽ vá lỗ hổng UI đó.

**Rủi ro:**
- Đảm bảo khi trả về các thiết bị con ở API `my-assets`, định dạng dữ liệu (`id`, `assetTag`, `name`, `modelName`, `categoryName`) không bị `undefined` gây crash React Component.
