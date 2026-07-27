# MSEW: MIGRATE TỪ VERCEL+NEON VỀ SELF-HOSTED (Internal Server)

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27
**Mục đích:** Hướng dẫn migrate Epic H+I (Notifications + File Storage) từ Vercel+Neon+Resend+Vercel Blob sang self-hosted stack

---

## 1. Stack mapping

| Vercel Stack (cloud) | Self-hosted Equivalent |
|----------------------|------------------------|
| **Vercel** (Next.js hosting) | **Docker + Node.js 20+ + Nginx** |
| **Neon** (Postgres) | **PostgreSQL 16+** (cài local) |
| **Vercel Blob** (file storage) | **MinIO** (S3-compatible) hoặc **local disk** |
| **Resend** (email) | **Postfix + SMTP** (gửi email nội bộ) hoặc **Mailgun/SES** |
| **Vercel Cron** (scheduled tasks) | **systemd timer** hoặc **cron daemon** |
| **Upstash Redis** (rate limiting) | **Redis 7+** (cài local) |

---

## 2. Kiến trúc Self-hosted

```
┌─────────────────────────────────────────────────────────────┐
│                       INTERNAL SERVER                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Nginx     │  │  Next.js   │  │  Worker    │             │
│  │ (reverse   │→ │  (port 3000)│  │ (cron +    │             │
│  │  proxy)    │  │            │  │  queue)    │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│        ↓               ↓              ↓                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ PostgreSQL │  │  MinIO     │  │  Redis     │             │
│  │ 16+        │  │ (S3)       │  │            │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Postfix SMTP (outbound email)               │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Hardware requirements

### 3.1 Minimum (cho team <50 users)

| Resource | Spec |
|----------|------|
| **CPU** | 4 cores |
| **RAM** | 8GB |
| **Disk** | 100GB SSD (50GB cho Postgres, 30GB cho files, 20GB OS/logs) |
| **Network** | 100Mbps internal LAN |
| **OS** | Ubuntu 22.04 LTS hoặc RHEL 9 |

### 3.2 Recommended (cho team 50-200 users)

| Resource | Spec |
|----------|------|
| **CPU** | 8 cores |
| **RAM** | 16GB |
| **Disk** | 500GB SSD (RAID 1 mirror) |
| **Network** | 1Gbps LAN |
| **Backup** | NAS riêng (rsync nightly) |

---

## 4. Infrastructure Setup

### 4.1 Cài PostgreSQL 16

```bash
# Ubuntu
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Tạo database + user
sudo -u postgres psql

CREATE DATABASE itmanagement;
CREATE USER itadmin WITH ENCRYPTED PASSWORD 'CHANGE_ME_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE itmanagement TO itadmin;
\q
```

### 4.2 Cài Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test
redis-cli ping  # → PONG
```

### 4.3 Cài MinIO (S3-compatible storage)

```bash
# Download binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio
sudo chmod +x minio
sudo mv minio /usr/local/bin/

# Tạo user + dirs
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /var/lib/minio
sudo chown minio-user:minio-user /var/lib/minio

# Systemd service
cat <<EOF | sudo tee /etc/systemd/system/minio.service
[Unit]
Description=MinIO
After=network.target

[Service]
User=minio-user
Group=minio-user
ExecStart=/usr/local/bin/minio server /var/lib/minio --address :9000 --console-address :9001
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable minio
sudo systemctl start minio
```

### 4.4 Cài Postfix (SMTP server)

```bash
sudo apt install -y postfix mailutils

# Trong quá trình cài, chọn:
# - Internet Site
# - System mail name: it-management.yourcompany.local
```

### 4.5 Cài Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # → v20.x.x
```

---

## 5. Code Changes (App Layer)

### 5.1 `.env.production` cho self-hosted

```bash
# === Application ===
NODE_ENV=production
PORT=3000
APP_URL=http://it-management.yourcompany.local

# === Auth ===
NEXTAUTH_URL=http://it-management.yourcompany.local
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# === Database (Postgres local) ===
DATABASE_URL="postgresql://itadmin:CHANGE_ME@localhost:5432/itmanagement?schema=public"

# === File Storage (MinIO - S3-compatible) ===
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_REGION="us-east-1"
STORAGE_BUCKET="it-management-assets"
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="CHANGE_ME"
STORAGE_PUBLIC_URL="http://it-management.yourcompany.local/files"

# === Email (Postfix SMTP) ===
SMTP_HOST="localhost"
SMTP_PORT=25
SMTP_SECURE=false
SMTP_FROM="IT Management <noreply@it-management.yourcompany.local>"

# === Rate Limiting (Redis) ===
REDIS_URL="redis://localhost:6379"
```

---

### 5.2 Refactor `src/lib/notifications/email.ts`

```typescript
import nodemailer from 'nodemailer'
import { render } from '@react-email/components'

// Khởi tạo SMTP transporter (singleton)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '25'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
})

export interface EmailPayload {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
}

export interface EmailResult {
  ok: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    const html = await render(payload.react)

    const info = await transporter.sendMail({
      from: payload.from ?? process.env.SMTP_FROM ?? 'noreply@localhost',
      to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
      subject: payload.subject,
      html,
    })

    return { ok: true, messageId: info.messageId }
  } catch (e) {
    console.error('[email] SMTP send failed:', e)
    return { ok: false, error: (e as Error).message }
  }
}
```

### 5.3 Cài package mới

```bash
npm uninstall resend @vercel/blob
npm install nodemailer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install --save-dev @types/nodemailer
```

### 5.4 Refactor `src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { requireRole } from '@/lib/auth-guard'
import prisma from '@/lib/prisma'

// === S3 Client (MinIO-compatible) ===
const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true, // BẮT BUỘC cho MinIO
})

const BUCKET = process.env.STORAGE_BUCKET ?? 'it-management-assets'
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? ''

export const runtime = 'nodejs'
export const maxDuration = 60

const LIMITS = {
  avatar: 1 * 1024 * 1024,
  logo: 2 * 1024 * 1024,
  asset: 5 * 1024 * 1024,
}
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'avatar' | 'logo' | 'asset' | null
  const entityId = formData.get('entityId') as string | null

  if (!file || !type) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Thiếu file/type' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Định dạng không hợp lệ' }, { status: 400 })
  }

  const limit = LIMITS[type]
  if (file.size > limit) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: `File quá lớn (max ${limit/1024/1024}MB)` }, { status: 400 })
  }

  // Sanitize filename
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext) ? ext : 'png'
  const key = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

  try {
    // Upload lên MinIO
    const buffer = Buffer.from(await file.arrayBuffer())
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    const url = `${PUBLIC_URL}/${key}`

    // Save URL vào DB
    if (type === 'avatar' && entityId) {
      await prisma.user.update({ where: { id: entityId }, data: { avatar: url } })
    } else if (type === 'asset' && entityId) {
      await prisma.asset.update({ where: { id: entityId }, data: { image: url } })
    }

    return NextResponse.json({ ok: true, data: { url, size: file.size, type: file.type } })
  } catch (e) {
    console.error('[upload] error:', e)
    return NextResponse.json({ ok: false, code: 'UNKNOWN', message: 'Upload thất bại' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Thiếu key' }, { status: 400 })
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[delete] error:', e)
    return NextResponse.json({ ok: false, code: 'UNKNOWN' }, { status: 500 })
  }
}
```

### 5.5 Nginx config để serve files

```nginx
# /etc/nginx/sites-available/it-management.conf
server {
    listen 80;
    server_name it-management.yourcompany.local;

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # Serve files từ MinIO qua Nginx (cache + load balancing)
    location /files/ {
        proxy_pass http://localhost:9000/it-management-assets/;
        proxy_set_header Host $host;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # MinIO Console (chỉ cho admin, qua VPN)
    location /minio/ {
        proxy_pass http://localhost:9001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        allow 10.0.0.0/8;
        allow 192.168.0.0/16;
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/it-management.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.6 MinIO bucket policy (public read)

```bash
# Cài mc (MinIO client)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
sudo chmod +x mc
sudo mv mc /usr/local/bin/

# Configure
mc alias set local http://localhost:9000 minioadmin CHANGE_ME

# Tạo bucket
mc mb local/it-management-assets

# Set public read
mc anonymous set download local/it-management-assets
```

---

## 6. Cron Jobs (thay Vercel Cron)

### 6.1 File `src/scripts/send-overdue-reminders.ts`

```typescript
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications/email'
import OverdueReminder from '@/emails/OverdueReminder'

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
const REMIND_DAYS_BEFORE = 3

export async function sendOverdueReminders() {
  const today = new Date()
  const threshold = new Date()
  threshold.setDate(today.getDate() + REMIND_DAYS_BEFORE)

  const assets = await prisma.asset.findMany({
    where: {
      status: { in: ['ASSIGNED', 'DEPLOYED'] },
      expectedCheckin: {
        gte: today,
        lte: threshold,
      },
    },
    include: { assignedTo: true },
  })

  const byUser = new Map<string, typeof assets>()
  for (const asset of assets) {
    if (!asset.assignedTo) continue
    const list = byUser.get(asset.assignedTo.id) ?? []
    list.push(asset)
    byUser.set(asset.assignedTo.id, list)
  }

  let sent = 0
  for (const [userId, userAssets] of byUser) {
    const user = userAssets[0].assignedTo!
    if (!user.email) continue

    const result = await sendEmail({
      to: user.email,
      subject: `[IT] Nhắc nhở: ${userAssets.length} tài sản sắp đến hạn thu hồi`,
      react: OverdueReminder({
        userName: `${user.firstName} ${user.lastName ?? ''}`.trim(),
        assets: userAssets.map((a) => ({
          tag: a.assetTag,
          name: a.name,
          expectedCheckin: a.expectedCheckin!.toLocaleDateString('vi-VN'),
        })),
        appUrl: APP_URL,
      }),
    })

    if (result.ok) sent++
  }

  console.log(`[cron] Sent ${sent}/${byUser.size} reminder emails`)
}

sendOverdueReminders()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
```

### 6.2 File `scripts/cron-overdue-reminder.sh`

```bash
#!/bin/bash
set -e
cd /opt/it-management
export $(cat .env.production | xargs)

node --experimental-vm-modules -e "
  import('./.next/server/chunks/send-overdue-reminders.js')
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); })
"
```

### 6.3 Systemd Timer

```bash
cat <<EOF | sudo tee /etc/systemd/system/it-management-cron.timer
[Unit]
Description=IT Management Cron Timer

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

cat <<EOF | sudo tee /etc/systemd/system/it-management-cron.service
[Unit]
Description=IT Management Cron Job
After=postgresql.service

[Service]
Type=oneshot
WorkingDirectory=/opt/it-management
ExecStart=/opt/it-management/scripts/cron-overdue-reminder.sh
User=it-app
EOF

sudo systemctl enable it-management-cron.timer
sudo systemctl start it-management-cron.timer
```

---

## 7. Backup Strategy (KHÔNG có sẵn trên Vercel!)

### 7.1 Postgres backup hàng ngày

```bash
# Script: /opt/it-management/scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR="/var/backups/it-management/db"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="itmanagement_${TIMESTAMP}.sql.gz"

pg_dump -U itadmin -h localhost itmanagement | gzip > "$BACKUP_DIR/$FILENAME"

find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

rsync -az $BACKUP_DIR/ backup-nas:/volume1/it-management-backups/db/
```

```bash
chmod +x /opt/it-management/scripts/backup-db.sh
crontab -e
# 2:00 sáng mỗi ngày:
0 2 * * * /opt/it-management/scripts/backup-db.sh >> /var/log/it-management/backup.log 2>&1
```

### 7.2 MinIO backup hàng tuần

```bash
cat <<EOF > /opt/it-management/scripts/backup-files.sh
#!/bin/bash
mc mirror --remove --overwrite local/it-management-assets /var/backups/it-management/files/ 2>&1
rsync -az /var/backups/it-management/files/ backup-nas:/volume1/it-management-backups/files/
EOF

chmod +x /opt/it-management/scripts/backup-files.sh
# 3:00 sáng Chủ nhật:
0 3 * * 0 /opt/it-management/scripts/backup-files.sh >> /var/log/it-management/backup.log 2>&1
```

---

## 8. Monitoring (KHÔNG có sẵn trên Vercel!)

### 8.1 Health check endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT!,
  region: process.env.STORAGE_REGION!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    database: 'fail',
    storage: 'fail',
    email: 'ok', // local SMTP assumed
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (e) {
    console.error('[health] DB fail:', e)
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: process.env.STORAGE_BUCKET! }))
    checks.storage = 'ok'
  } catch (e) {
    console.error('[health] Storage fail:', e)
  }

  const ok = Object.values(checks).every((v) => v === 'ok')
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 })
}
```

---

## 9. SSL/TLS (production)

### 9.1 Self-signed cert (internal LAN)

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
  -keyout /etc/ssl/private/it-management.key \
  -out /etc/ssl/certs/it-management.crt \
  -subj "/CN=it-management.yourcompany.local"

# Nginx HTTPS block
server {
    listen 443 ssl http2;
    server_name it-management.yourcompany.local;

    ssl_certificate /etc/ssl/certs/it-management.crt;
    ssl_certificate_key /etc/ssl/private/it-management.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ...
}
```

### 9.2 Let's Encrypt (nếu có domain public)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d it-management.yourcompany.com
```

---

## 10. Migration từ Vercel+Neon → Self-hosted

### 10.1 Bước 1: Backup dữ liệu từ Neon

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/itmanagement?sslmode=require" \
  pg_dump > backup_neon.sql
```

### 10.2 Bước 2: Download files từ Vercel Blob

```bash
npm install -g @vercel/blob-cli

vercel-blob list --token=$BLOB_READ_WRITE_TOKEN > blob-files.json

cat blob-files.json | jq -r '.[].url' | while read url; do
  filename=$(basename "$url")
  curl -o "files/$filename" "$url"
done
```

### 10.3 Bước 3: Setup self-hosted (theo hướng dẫn ở trên)

### 10.4 Bước 4: Restore database

```bash
psql -U itadmin -h localhost -d itmanagement < backup_neon.sql

psql -U itadmin -h localhost -d itmanagement -c "SELECT COUNT(*) FROM \"Asset\";"
```

### 10.5 Bước 5: Upload files lên MinIO

```bash
mc cp -r files/ local/it-management-assets/

# Update URLs trong database
psql -U itadmin -h localhost -d itmanagement <<EOF
UPDATE "Asset" SET image = REPLACE(image, 'https://xxx.public.blob.vercel-storage.com', 'http://it-management.yourcompany.local/files') WHERE image IS NOT NULL;
UPDATE "User" SET avatar = REPLACE(avatar, 'https://xxx.public.blob.vercel-storage.com', 'http://it-management.yourcompany.local/files') WHERE avatar IS NOT NULL;
EOF
```

### 10.6 Bước 6: Test

```bash
cd /opt/it-management
NODE_ENV=production node node_modules/next/dist/bin/next start -p 3000

curl http://localhost:3000/api/health
```

---

## 11. So sánh chi phí

| Item | Vercel+Neon | Self-hosted (3 năm) |
|------|-------------|---------------------|
| **Hosting** | $20/mo | Server hardware: $2000 (one-time) |
| **Database** | $19/mo | Postgres included |
| **File storage** | $5/mo | MinIO included |
| **Email** | $20/mo | Postfix included |
| **Maintenance** | $0 (managed) | $100/mo (sysadmin part-time) |
| **Total 3 năm** | $2,304 | $4,600 + $2000 = $6,600 |
| **Break-even** | ~2.5 năm | Sau 2.5 năm tiết kiệm |

### Khi nào nên chuyển sang self-hosted?

| Nên chuyển | KHÔNG nên chuyển |
|-----------|------------------|
| Team ≥50 người | Team <20 người |
| Cần control hoàn toàn | Không có sysadmin |
| Compliance yêu cầu data on-prem | Chỉ cần cloud-based |
| Chi phí >$100/mo cho cloud | Chi phí <$50/mo |
| Cần tích hợp với AD/LDAP nội bộ | Không có LDAP/AD |

---

## 12. Checklist migration

```
Phase 1: Chuẩn bị
- [ ] Hardware đã mua/có sẵn
- [ ] OS đã cài (Ubuntu 22.04)
- [ ] Network/DNS đã config
- [ ] SSL cert đã chuẩn bị

Phase 2: Infrastructure
- [ ] PostgreSQL cài + chạy
- [ ] Redis cài + chạy
- [ ] MinIO cài + bucket tạo
- [ ] Postfix cài + test gửi email
- [ ] Node.js 20+ cài
- [ ] Nginx cài + config

Phase 3: Code refactor
- [ ] Package.json update
- [ ] .env.production tạo
- [ ] email.ts refactor (resend → nodemailer)
- [ ] upload/route.ts refactor (Vercel Blob → S3/MinIO)
- [ ] cron scripts tạo
- [ ] Health check endpoint thêm

Phase 4: Migration
- [ ] Backup Neon DB
- [ ] Download Vercel Blob files
- [ ] Restore DB vào Postgres local
- [ ] Upload files lên MinIO
- [ ] Update URLs trong DB
- [ ] Test upload + email

Phase 5: Production
- [ ] SSL cert deploy
- [ ] Nginx reload
- [ ] App start (PM2 hoặc systemd)
- [ ] Cron timer enable
- [ ] Backup script enable
- [ ] Health check monitor
- [ ] Test toàn bộ flow

Phase 6: Decommission Vercel
- [ ] Verify self-hosted chạy ổn 1 tuần
- [ ] Cancel Vercel subscription
- [ ] Delete Neon project
```

---

## 13. Effort estimate

| Phase | Effort |
|-------|--------|
| Infrastructure setup | 1 ngày |
| Code refactor | 0.5 ngày |
| Data migration | 0.5 ngày |
| Testing + SSL | 0.5 ngày |
| **Tổng** | **2.5 ngày** |

---

**HẾT MSEW-migrate-vercel-to-self-hosted.md**

Tổng kết: Toàn bộ infrastructure + code migration trong 1 file. Effort 2.5 ngày. Stack thay thế 1-1 cho Vercel+Neon+Resend+Blob. Chi phí tiết kiệm sau 2.5 năm.