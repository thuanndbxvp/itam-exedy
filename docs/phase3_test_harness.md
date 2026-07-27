# Phase 3 — Grey-box Test Harness (chạy trong Browser Console)

> **QUAN TRỌNG:** Account `nguyenha@congty.com` phải login sẵn trên trình duyệt với role EMPLOYEE. Mở https://itam-exedy.vercel.app và đăng nhập trước, sau đó mở DevTools Console (F12) và chạy từng đoạn bên dưới.

Lưu kết quả vào file `docs/phase3_findings.md` và paste lại cho tôi.

---

## Phase 3.1 — Vertical Escalation

EMPLOYEE tấn công các IT-only endpoints. Kỳ vọng: **403 Forbidden** cho tất cả.

```javascript
// Paste vào DevTools Console khi đang login nguyenha@congty.com
const BASE = window.location.origin;
const tests = [
  { method: 'GET', path: '/api/settings/users' },
  { method: 'GET', path: '/api/settings/departments' },
  { method: 'GET', path: '/api/settings/companies' },
  { method: 'GET', path: '/api/settings/categories' },
  { method: 'GET', path: '/api/settings/locations' },
  { method: 'GET', path: '/api/settings/asset-models' },
  { method: 'GET', path: '/api/permissions' },
  { method: 'GET', path: '/api/permissions/roles' },
  { method: 'GET', path: '/api/admin/ticket-rules' },
  { method: 'GET', path: '/api/reports/summary' },
  { method: 'GET', path: '/api/audit-log' },
];

(async () => {
  const results = [];
  for (const t of tests) {
    const res = await fetch(BASE + t.path, { method: t.method, credentials: 'include' });
    const body = await res.text();
    results.push({
      method: t.method,
      path: t.path,
      status: res.status,
      len: body.length,
      preview: body.slice(0, 100),
    });
  }
  console.table(results);
  // PASS = tất cả status code là 401 hoặc 403
  const pass = results.every(r => r.status === 401 || r.status === 403);
  console.log(pass ? '✅ Phase 3.1 PASS (tất cả endpoint chặn EMPLOYEE)' : '❌ Phase 3.1 FAIL (có endpoint cho phép)');
})();
```

---

## Phase 3.2 — Horizontal IDOR

EMPLOYEE xem asset/license của người khác qua URL trực tiếp. Kỳ vọng: **403/404** hoặc redirect.

```javascript
// Liệt kê các asset IDs từ admin (chạy trong admin session, copy IDs ra)
// HOẶC dùng các ID này nếu tồn tại (lấy từ /assets page):
const assetIds = [
  // paste các asset ID từ https://itam-exedy.vercel.app/assets (chế độ admin)
  // ví dụ: 'cmsxxxxx'
];

(async () => {
  const BASE = window.location.origin;
  const results = [];
  for (const id of assetIds) {
    // Test HTTP API (nếu có)
    try {
      const r1 = await fetch(`${BASE}/api/helpdesk/my-assets?userId=${id}`, { credentials: 'include' });
      results.push({ test: `GET /api/helpdesk/my-assets?userId=${id}`, status: r1.status });
    } catch (e) {
      results.push({ test: `GET /api/helpdesk/my-assets?userId=${id}`, error: e.message });
    }

    // Test Server Component page (assets detail)
    try {
      const r2 = await fetch(`${BASE}/assets/${id}`, { credentials: 'include', redirect: 'manual' });
      results.push({ test: `GET /assets/${id}`, status: r2.status });
    } catch (e) {
      results.push({ test: `GET /assets/${id}`, error: e.message });
    }
  }
  console.table(results);
})();

// Đồng thời truy cập thủ công:
//   1. Mở tab mới, paste URL: https://itam-exedy.vercel.app/assets/<id-của-user-khac>
//   2. Quan sát: có hiển thị asset của người khác không? 403? redirect?
```

---

## Phase 3.3 — Mass Assignment

EMPLOYEE cố đổi role của chính mình hoặc người khác thành ADMIN. Kỳ vọng: **403/422**.

```javascript
const myId = '<your-id-from-/api/me/permissions>';
const otherId = 'cms3dlsu70001tovpcpl63y7o'; // nv.b@congty.com

(async () => {
  const BASE = window.location.origin;
  const tests = [
    {
      label: 'EMPLOYEE PUT chính mình với role=ADMIN',
      path: `/api/settings/users/${myId}`,
      body: { role: 'ADMIN' },
    },
    {
      label: 'EMPLOYEE PUT user khác với role=ADMIN',
      path: `/api/settings/users/${otherId}`,
      body: { role: 'ADMIN' },
    },
    {
      label: 'EMPLOYEE PUT chính mình với customRoleId',
      path: `/api/settings/users/${myId}`,
      body: { customRoleId: 'some-admin-role-id' },
    },
    {
      label: 'EMPLOYEE POST user mới (tự tạo admin account)',
      path: `/api/settings/users`,
      method: 'POST',
      body: { email: 'attacker@evil.com', password: 'evil123', role: 'ADMIN' },
    },
  ];

  const results = [];
  for (const t of tests) {
    try {
      const res = await fetch(BASE + t.path, {
        method: t.method || 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.body),
      });
      const text = await res.text();
      results.push({
        label: t.label,
        path: t.path,
        status: res.status,
        preview: text.slice(0, 100),
      });
    } catch (e) {
      results.push({ label: t.label, error: e.message });
    }
  }
  console.table(results);
  const pass = results.every(r => r.status >= 400);
  console.log(pass ? '✅ Phase 3.3 PASS (mass assignment blocked)' : '❌ Phase 3.3 FAIL (có mutation được chấp nhận)');
})();
```

---

## Helper: lấy ID + permissions của tôi

```javascript
(async () => {
  const r = await fetch('/api/me/permissions', { credentials: 'include' });
  const j = await r.json();
  console.log('My ID:', j.data.id);
  console.log('My role:', j.data.role);
  console.log('My customRoleId:', j.data.customRoleId);
  console.log('My permissions:', j.data.permissions);
  console.log('Total perms:', j.data.permissions.length);
})();
```

---

## Cách ghi findings

Sau khi chạy xong 3 phases, paste console output vào file `docs/phase3_findings.md` theo format:

```markdown
## Phase 3.1 — Vertical Escalation
- [PASS/FAIL] `<endpoint>` → HTTP `<code>`

## Phase 3.2 — Horizontal IDOR
- [PASS/FAIL] `/api/helpdesk/my-assets?userId=<other-id>` → HTTP `<code>`
- [PASS/FAIL] `/assets/<other-asset-id>` → HTTP `<code>` (UI test)

## Phase 3.3 — Mass Assignment
- [PASS/FAIL] EMPLOYEE PUT self role=ADMIN → HTTP `<code>`
- [PASS/FAIL] EMPLOYEE PUT other role=ADMIN → HTTP `<code>`
```

Rồi paste cho tôi để tổng hợp vào `security_test_report.md`.