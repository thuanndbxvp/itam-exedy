# MASTER ROADMAP — Phase 4, 5, 6

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27
**Status:** Planning (chưa thực thi)

---

## Tổng quan

| Phase | Mục tiêu | Epics | Effort | Priority |
|-------|----------|-------|--------|----------|
| **Phase 4** | Enterprise Features | H, I | ~6 ngày | P1 |
| **Phase 5** | Ecosystem | L, M, N | ~12 ngày | P2 |
| **Phase 6** | AI/ML | O | ~8 ngày | P3 |

---

## PHASE 4 — Enterprise Features (P1, ~6 ngày)

### Epic H: Notifications (3 ngày)

**Mục đích:** Gửi email/Slack thật khi có sự kiện

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **H-1** | Email Service (Resend) | 1 ngày |
| **H-2** | Email Templates (checkout, checkin, reminder) | 1 ngày |
| **H-3** | Slack Webhook integration | 0.5 ngày |
| **H-4** | Notification preferences (per user) | 0.5 ngày |

**Use cases:**
- Gửi email cho user khi nhận được asset (CHECKOUT)
- Gửi email cho admin khi asset được thu hồi (CHECKIN)
- Reminder email khi expected checkin sắp đến (3 ngày trước)
- Slack notification khi asset bị overdue
- Slack notification khi audit due

**Dependencies:**
- Có API key Resend (env var `RESEND_API_KEY`)
- Có Slack webhook URL (env var `SLACK_WEBHOOK_URL`)
- Email templates dùng React Email

---

### Epic I: File Storage (3 ngày)

**Mục đích:** Upload file lên cloud storage

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **I-1** | S3/R2 client setup | 0.5 ngày |
| **I-2** | Upload API endpoint | 1 ngày |
| **I-3** | Logo upload UI | 0.5 ngày |
| **I-4** | Avatar upload UI | 0.5 ngày |
| **I-5** | Asset image upload | 0.5 ngày |

**Storage options:**
- AWS S3 (production, $$$)
- Cloudflare R2 (production, free egress)
- Local disk (dev)

**File limits:**
- Logo: max 2MB, PNG/JPG/SVG
- Avatar: max 1MB, PNG/JPG
- Asset image: max 5MB, PNG/JPG

**Dependencies:**
- Có S3/R2 credentials
- Bucket name (env var `STORAGE_BUCKET`)
- Public URL base (env var `STORAGE_PUBLIC_URL`)

---

## PHASE 5 — Ecosystem (P2, ~12 ngày)

### Epic L: SSO Integration (4 ngày)

**Mục đích:** Đăng nhập bằng Google/Microsoft

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **L-1** | Google OAuth provider | 1.5 ngày |
| **L-2** | Microsoft OAuth provider | 1.5 ngày |
| **L-3** | Auto-provisioning (create user on first login) | 1 ngày |

**Use cases:**
- User click "Đăng nhập bằng Google"
- First time → tự động tạo user mới (role = EMPLOYEE)
- Subsequent → link Google ID với user hiện có

**Dependencies:**
- Google OAuth credentials (env var `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- Microsoft OAuth credentials (env var `MS_CLIENT_ID`, `MS_CLIENT_SECRET`)

---

### Epic M: Public REST API (4 ngày)

**Mục đích:** Cho phép third-party tích hợp

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **M-1** | API key management (CRUD keys) | 1 ngày |
| **M-2** | REST API routes (GET/POST/PUT/DELETE assets, users, etc.) | 2 ngày |
| **M-3** | Rate limiting + API documentation | 1 ngày |

**Endpoints:**
- `GET /api/v1/assets`
- `GET /api/v1/assets/{id}`
- `POST /api/v1/assets`
- `PUT /api/v1/assets/{id}`
- `DELETE /api/v1/assets/{id}`
- Tương tự cho users, licenses, categories

**Auth:** Bearer token (API key)

**Rate limit:** 1000 requests/hour per key

**Dependencies:**
- API key model trong schema (extend Epic A)

---

### Epic N: Mobile App (4 ngày)

**Mục đích:** App mobile cho iOS/Android

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **N-1** | React Native setup | 1 ngày |
| **N-2** | Auth flow + Dashboard | 1 ngày |
| **N-3** | Asset list + detail + checkout | 1.5 ngày |
| **N-4** | Barcode scanner (tìm asset nhanh) | 0.5 ngày |

**Features:**
- Login (sử dụng same NextAuth)
- Dashboard với stats
- Browse assets
- Checkout/checkin từ mobile
- Scan barcode assetTag → mở detail page

**Dependencies:**
- Expo SDK
- React Native Camera (barcode)

---

## PHASE 6 — AI/ML (P3, ~8 ngày)

### Epic O: AI/ML Features (8 ngày)

**Mục đích:** Tính năng thông minh

| Deliverable | Mô tả | Effort |
|-------------|--------|--------|
| **O-1** | Asset recommendations (gợi ý asset cho user mới) | 2 ngày |
| **O-2** | Anomaly detection (phát hiện asset bất thường) | 2 ngày |
| **O-3** | Predictive maintenance (dự đoán khi nào cần bảo trì) | 2 ngày |
| **O-4** | Smart search (semantic search thay vì keyword) | 2 ngày |

**Use cases:**
- User mới vào → gợi ý asset dựa trên role, department, lịch sử
- Phát hiện asset bị "mất tích" (không checkin quá lâu, không có audit log)
- Dự đoán khi nào asset cần bảo trì dựa trên tuổi thọ + pattern sử dụng
- Search bằng ngôn ngữ tự nhiên ("laptop cho developer")

**Tech stack:**
- Embeddings: OpenAI text-embedding-3
- Anomaly detection: simple statistical models (z-score, IQR)
- Recommendations: collaborative filtering

**Dependencies:**
- OpenAI API key (env var `OPENAI_API_KEY`)

---

## Decision Matrix

### Nên làm Phase 4 ngay?

| Pros | Cons |
|------|------|
| Enterprise-ready | Cần third-party services |
| Notification quan trọng | Chi phí hosting tăng |
| File upload cần thiết | Tăng attack surface |

### Nên defer Phase 5/6?

| Pros | Cons |
|------|------|
| Không cần thiết cho MVP | Tụt hậu so với competitors |
| Tiết kiệm chi phí | Mất cơ hội tích hợp |
| Focus vào core features | User experience kém hơn |

---

## Khuyến nghị

**Phase 4 (Epic H + I)**: Làm NGAY nếu:
- Đã có Resend account
- Đã có S3/R2 bucket
- Budget cho third-party services

**Phase 5 (Epic L + M + N)**: Làm sau khi có ít nhất 10 paying customers

**Phase 6 (Epic O)**: Làm khi đã có ≥1000 assets và ≥100 users

---

## Tech debt cần giải quyết trước Phase 4

1. **Notification abstraction layer** — Epic cần `NotificationService` interface trước khi impl Resend/Slack
2. **File validation library** — `file-type` hoặc magic bytes check (không chỉ check extension)
3. **CDN configuration** — Cache headers cho uploaded files
4. **Backup strategy** — S3 versioning + lifecycle policies

---

## Risk assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Resend deliverability issues | Medium | High | Dùng SPF/DKIM records đầy đủ |
| S3 bucket misconfiguration → public leak | Medium | Critical | Block public access + audit |
| API keys bị leak | High | High | Rate limit + revoke flow |
| Mobile app platform issues | Medium | Medium | Test trên cả iOS + Android |

---

## Effort summary

```
Phase 1 + 2 + 3 = DONE (đã có MSEW)
Phase 4 = ~6 ngày (Epic H + I)
Phase 5 = ~12 ngày (Epic L + M + N)
Phase 6 = ~8 ngày (Epic O)
─────────────────
Tổng còn lại = ~26 ngày = ~5 tuần
```

---

**HẾT MASTER-ROADMAP-phases-4-5-6.md**

Sếp muốn tôi viết MSEW chi tiết cho epic nào trước?