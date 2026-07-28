# PLAN: Sprint R.1 - Security Hotfixes (Khẩn cấp)

## 1. Lý do cần thiết (Context & Vulnerabilities)
Hệ thống hiện tại tồn tại nhiều lỗ hổng nghiêm trọng (Critical & High) được phát hiện trong đợt Security Audit:
- Rủi ro SQL Injection khi cập nhật cấu hình hệ thống.
- Rủi ro XSS khi lưu quyền (permissions) dưới dạng plaintext client-side.
- IDOR (Insecure Direct Object Reference) cho phép nhân viên thường (EMPLOYEE) xem lịch sử tài sản của người khác hoặc thao tác lậu vào hệ thống.
- Lỗ hổng Brute-force khi Login và nhập mã 2FA.

## 2. Giải pháp Kiến trúc
1. **Fix SQLi:** Đổi hàm raw query sang Prisma ORM thuần túy với Allowlist fields.
2. **Fix XSS Sidebar:** Gỡ hoàn toàn logic cache localStorage/sessionStorage. Gọi API check quyền trực tiếp.
3. **Fix IDOR & Auth Bypass:** 
   - Wrap toàn bộ 6 file API báo cáo với `requirePermissionApi('reports.view')`.
   - Bổ sung Guard (if role === 'EMPLOYEE') để chặn hành vi truy cập chéo ở Asset History và Maintenances.
4. **Fix Rate Limit:** Áp dụng hàm `checkRateLimit()` vào API Login và 2FA.

## 3. Danh sách File bị ảnh hưởng
- `src/lib/settings.ts`
- `src/components/Sidebar.tsx`
- Các APIs trong `src/app/api/reports/*/route.ts` (6 file)
- `src/app/api/assets/[id]/history/route.ts`
- `src/app/api/assets/[id]/maintenances/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/login/2fa/route.ts`
