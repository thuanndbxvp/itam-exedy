# ACCEPTANCE: Sprint-C.2-delete-user-fk

**Tier 2 — User soft-delete + FK detach (NOT hard delete)**

---

- [ ] AC1. `DELETE /api/settings/users/[id]` chuyển từ `prisma.user.delete()` → `prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })`.
- [ ] AC2. Permission: `users.delete` (ADMIN).
- [ ] AC3. Self-protection: không xóa chính mình (`actor.id === id` → 400 INVALID_STATE).
- [ ] AC4. Không xóa user có `role: ADMIN` (nếu muốn bảo vệ cuối cùng) — tùy chọn, có ghi chú.
- [ ] AC5. Trước soft-delete, thực hiện detach sequence:
  - `Asset.assignedUserId → null` (asset về trạng thái "chưa ai nhận")
  - `LicenseSeat.assignedUserId → null`
  - `Ticket.reporterId → system_user_id` (giữ audit, tránh FK violation)
  - `Ticket.assigneeId → null` (ticket bay về "chưa ai nhận")
  - `Ticket.closedById → system_user_id` (nếu có)
  - `TicketComment.authorId → system_user_id`
  - `TicketAttachment.uploaderId → system_user_id`
  - `ApiToken.createdById → system_user_id`
  - `NotificationChannel.createdById → system_user_id`
  - `AssetMaintenance.createdById → null`
  - `ActionLog.userId → KHÔNG SỬA` (Restrict, keep audit trail)
- [ ] AC6. Detach sequence dùng `Promise.all` để parallel — không blocking nhau.
- [ ] AC7. Audit log ghi `DELETE` event với message "Xóa người dùng '{name}'" sau khi detach thành công.
- [ ] AC8. API trả về `200 OK` với `{ ok: true, message: '...' }` sau khi soft-delete thành công.
- [ ] AC9. API trả 409 CONFLICT nếu user đã bị `deletedAt !== null` (prevent double-delete).
- [ ] AC10. UI `/settings/users` — thêm/hay cập nhật nút "Xóa" trên row để gọi API này (nếu chưa có).