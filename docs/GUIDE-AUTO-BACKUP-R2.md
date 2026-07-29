# Hướng dẫn Thiết lập Tự động Sao lưu (Auto-Backup) Database lên Cloudflare R2

Tài liệu này hướng dẫn cách gắn tính năng tự động backup dữ liệu (PostgreSQL) hàng ngày cho bất kỳ dự án Serverless nào (Next.js, Prisma, Neon DB) lưu trữ trên GitHub.

## Cơ chế hoạt động
- Sử dụng **GitHub Actions** để hẹn giờ chạy ngầm.
- Dùng **Docker** (chứa PostgreSQL client mới nhất) để chạy lệnh `pg_dump` nhằm tránh lỗi chênh lệch phiên bản (Version Mismatch).
- Tự động bóc tách tham số thừa của Prisma (như `uselibpqcompat=true`) và bóc `-pooler` khỏi Neon URL để ép kết nối trực tiếp (Direct Connection).
- Sử dụng **AWS CLI** có sẵn trên GitHub Runner để upload file nhị phân nén (`.dump`) sang Cloudflare R2 thông qua API chuẩn S3.

## Bước 1: Tạo file Workflow

Trong dự án mới, hãy tạo một file tại đường dẫn chính xác như sau:
`.github/workflows/db-backup.yml`

Copy toàn bộ đoạn mã sau dán vào file:

```yaml
name: Auto-Backup Database to R2

on:
  # Chạy tự động lúc 22:00 tối (giờ Việt Nam) mỗi ngày (15:00 UTC)
  schedule:
    - cron: '0 15 * * *'
  # Cho phép kích hoạt chạy thủ công trên GitHub UI
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Generate Backup Filename
        id: vars
        run: echo "DATE=$(date +'%Y-%m-%d_%H-%M-%S')" >> $GITHUB_ENV

      - name: Dump Database and Compress
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          set -e
          # 1. Bỏ toàn bộ tham số của Prisma sau dấu ?
          BASE_URL=$(echo "$DATABASE_URL" | cut -d'?' -f1)
          # 2. Xóa chữ -pooler để lấy Direct URL của Neon DB
          DIRECT_URL=$(echo "$BASE_URL" | sed 's/-pooler//g')
          # 3. Yêu cầu chứng chỉ SSL
          FINAL_URL="${DIRECT_URL}?sslmode=require"
          
          echo "Bắt đầu backup từ Direct URL sử dụng Docker Postgres (để tránh lỗi lệch phiên bản)..."
          docker run --rm -v $(pwd):/workspace -w /workspace postgres:latest pg_dump "$FINAL_URL" -F c -f "backup-${{ env.DATE }}.dump"
          ls -lh "backup-${{ env.DATE }}.dump"

      - name: Upload to Cloudflare R2
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: auto
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
        run: |
          # Không dùng thư viện cấu hình của aws-actions vì nó không hiểu region 'auto' của R2
          aws s3 cp "backup-${{ env.DATE }}.dump" \
            "s3://$R2_BUCKET/backup-${{ env.DATE }}.dump" \
            --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
```

## Bước 2: Cài đặt Biến bảo mật (Secrets)

Truy cập vào trang quản lý dự án trên **GitHub > Settings > Secrets and variables > Actions**. Bấm nút **New repository secret** và lần lượt khai báo 5 biến sau:

1. `DATABASE_URL`: Đường dẫn kết nối Database (Copy y hệt từ file `.env` của dự án).
2. `R2_ACCOUNT_ID`: Mã Account ID của Cloudflare (Lấy trên URL bảng điều khiển R2).
3. `R2_BUCKET`: Tên Bucket trên Cloudflare R2 (VD: `backup-appmoi`).
4. `R2_ACCESS_KEY_ID`: Tạo token trên Cloudflare R2 với quyền Object Read & Write.
5. `R2_SECRET_ACCESS_KEY`: Chuỗi bí mật đi kèm Token ở trên.

## Bước 3: Test và Nghiệm thu

- Vào tab **Actions** trên GitHub.
- Bấm vào workflow **Auto-Backup Database to R2**.
- Chọn **Run workflow** -> Chạy trên nhánh `main`.
- Đợi khoảng 20-30 giây, nếu workflow hiện dấu tích xanh (`Success`), vào R2 kiểm tra thấy file `.dump` là hoàn tất.

## Phục hồi dữ liệu (Restore)

File tải về từ R2 là file nhị phân chuẩn Custom-format của PostgreSQL. Không mở bằng phần mềm đọc Text.

Để khôi phục toàn bộ dữ liệu vào Database, chạy lệnh sau trên môi trường có cài `pg_restore`:

```bash
pg_restore -d "DATABASE_URL_MỚI" ten_file_tai_ve.dump
```
