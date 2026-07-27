# ACCEPTANCE: Sprint-C.1-it-costs-report

**Người lập:** Tier 2

- [x] AC1. `/api/reports/it-costs` GET với query `startDate`, `endDate` (ISO).
- [x] AC2. Permission: `requirePermissionApi('reports.view')` (ADMIN/IT_MANAGER).
- [x] AC3. Query 3 bảng song song (`Promise.all`): `Asset.purchaseCost`, `License.purchaseCost`, `AssetMaintenance.cost`.
- [x] AC4. Decimal → number conversion; summary gồm `assetCost`, `licenseCost`, `maintenanceCost`, `totalCost`.
- [x] AC5. Details: hỗn hợp 3 loại, sort `date` desc. Mỗi row có `id`, `date`, `type`, `description`, `amount`.
- [x] AC6. Server Component `/reports/costs/page.tsx` guard `reports.view`.
- [x] AC7. Client Component `ItCostsClient.tsx` với presets: Tháng này, Quý này, Năm nay + custom range.
- [x] AC8. 4 summary cards (Tài sản / Bản quyền / Bảo trì / Tổng) format VND.
- [x] AC9. Recharts PieChart tỷ trọng 3 loại (nếu `recharts` installed; fallback bar chart nếu thiếu).
- [x] AC10. Bảng chi tiết với filter + pagination tuỳ chọn.
- [x] AC11. Sidebar: chuyển "Báo cáo (Reports)" → dropdown với submenu "Tổng quan" + "Chi phí IT".
- [x] AC12. Permission gating trong Sidebar vẫn respect `reports.view`.