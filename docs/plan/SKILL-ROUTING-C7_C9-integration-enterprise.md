# SKILL-ROUTING: C7_C9-integration-enterprise

**Người lập:** Tier 2

| Bước | Skill | Lý do |
|------|-------|--------|
| C7 schema + SQL | `prisma` | New table |
| C7 token gen + UI | `backend-engineer` + `frontend-engineer` | SHA-256 hashing + show-once token |
| C7 `/api/v1/*` route guard | `backend-engineer` | Bearer parsing |
| C8 schema + render | `prisma` + `backend-engineer` | Template variable {{key}} |
| C8 UI editor | `frontend-engineer` | Form + preview |
| C9 schema + Webhook POST | `prisma` + `backend-engineer` | HTTPS POST |
| C9 integration vào `notify()` | `backend-engineer` | Side-effect hook |

## Verification
- Create API token in UI → raw token shown ONCE → use it in `curl -H "Authorization: Bearer …"` → 200 OK
- Edit email template in UI → trigger event → email chứa nội dung mới
- Add Slack webhook → create ticket → message xuất hiện trong Slack channel