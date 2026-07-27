# SKILL-ROUTING: C1_C4-asset-ticket-advanced

**Người lập:** Tier 2 (Coder)

| Bước | Task | Skill | Lý do |
|------|------|-------|--------|
| C1 | QR generator + print page | `frontend-engineer` | Static page + print CSS |
| C2a | /api/tickets/[id]/attachments API | `backend-engineer` | REST CRUD |
| C2b | Attachments UI trên ticket detail | `frontend-engineer` | Drop zone + list |
| C3a | EulaAcceptance schema + SQL | `prisma` | New table |
| C3b | EulaModal + integration vào checkout | `frontend-engineer` | Modal |
| C4a | /api/assets/[id]/accept-decline API | `backend-engineer` | Simple POST |
| C4b | Notification card trên `/account` | `frontend-engineer` | Action banner |

## Verification

- `/print/asset-labels` renders QR correctly + Chrome print preview OK
- Upload file ticket → DB có record + UI hiển thị file
- Checkout asset requireAcceptance category → modal bật, không checkout được nếu decline
- IT checkout asset → user có notification + 2 nút accept/decline → audit log ACCEPTED/DECLINED