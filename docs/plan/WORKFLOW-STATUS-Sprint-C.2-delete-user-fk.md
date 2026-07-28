# WORKFLOW-STATUS: Sprint-C.2-delete-user-fk

**Người lập:** Tier 2

## Trạng thái: `[ ] IN PROGRESS`

## Scope
- Convert `prisma.user.delete()` (hard) → `prisma.user.update({ deletedAt })` (soft)
- Detach all nullable FKs → null (Asset, LicenseSeat, Ticket assignee)
- Reassign system-owned FKs → system_user (Ticket reporter/closer, Comment author, Attachment uploader, ApiToken, NotificationChannel)
- Keep ActionLog FK as-is (Restrict — audit trail preserved)
- Self-delete protection

## Effort
- AC1-AC4 (API logic): ~20min
- AC5 (detach sequence): ~30min
- AC6-AC9 (testing, error handling): ~20min
- UI delete button: ~10min
- tsc + lint + commit: ~15min
- Total: ~1.5h