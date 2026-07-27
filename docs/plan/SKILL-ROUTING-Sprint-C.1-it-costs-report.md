# SKILL-ROUTING: Sprint C.1 - IT Costs Report

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | `api/reports/it-costs` endpoint | `backend-engineer` | Query database tổng hợp từ 3 bảng và xử lý Decimal |
| 2 | `/reports/costs/page.tsx` và Server Component | `react-reviewer` | Bọc layout và check quyền `reports.view` |
| 3 | `ItCostsClient.tsx` Client Component | `react-reviewer` + `ui-styling` | Xử lý logic Date Range và render bảng, chart |
| 4 | `Sidebar.tsx` (Menu báo cáo) | `react-reviewer` | Bổ sung submenu cho báo cáo |

## Skill Activation Order

```
1. (API) Viết endpoint GET /api/reports/it-costs trả về summary và details.
2. (UI) Tạo Server Component page.tsx xác thực quyền truy cập.
3. (UI) Viết Client Component hiển thị bộ lọc, thẻ thống kê và bảng chi tiết.
4. (UI) Chỉnh sửa Sidebar thêm Menu thả xuống cho mục Báo cáo.
```
