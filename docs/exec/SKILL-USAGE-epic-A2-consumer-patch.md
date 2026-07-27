# SKILL USAGE — epic-A2-consumer-patch

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong epic A2, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `npx tsc --noEmit`, phân loại 14 errors theo file + TS code |
| Step 1 | `backend-patterns` (login + NextAuth) | Pattern `CredentialsProvider` + `bcrypt.compare` + module augmentation cho NextAuth |
| Step 2 | `backend-patterns` (server action + audit) | Pattern dual-path session strategy + module-level cache cho FK anchor |
| Step 3 | `backend-patterns` (Prisma nested write) | Pattern `seats.create` để seed N LicenseSeat cùng License (1 transaction) |
| Step 4-7 | `frontend-patterns` (server component) | Pattern include 3 FK nullable + helper chain fallback + formatUserName |
| Step 8 | `verification-loop` | Pattern verify: tsc → dev server → curl 6 routes → eslint |
| Step 9 | `docs-management` | Ghi 4 file docs/exec/* (CHANGELOG / SKILL / EVIDENCE / STATUS) |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (7 file + 1 file mới) thay vì gọi CodeGraph server — vì 7 file patch đều đã biết rõ path, và MSEW đã cung cấp code mapping đầy đủ (Tier 1 đã verify từ A1). CodeGraph overhead không cần thiết cho scope này.

Nếu Phase 2 muốn explore nhanh hơn, có thể chạy:

```
# Example: tìm tất cả reference tới User.name (cũ)
codegraph_search "User.name" --kind field
codegraph_search "assignedTo" --kind field
codegraph_search "seatsTotal" --kind field
```

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 7 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rõ ràng, deterministic, đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis (đã qua Tier 1 review).
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**: Immutability (no in-place mutation), small files (<800 lines), error handling.
- **common-development-workflow**: Plan → TDD → Code Review → Commit. Ở A2 không có TDD (Epic tiếp theo sẽ bổ sung test), nhưng đã có backup + verify kỹ.
- **common-testing**: A2 chỉ verify bằng `tsc + curl + eslint` (smoke test), chưa có unit test. Đề xuất Epic B bổ sung Jest/Vitest cho server actions.
- **common-security**: `bcrypt.compare` đã bật, KHÔNG hard-code secret, form input được validate bằng `formData.get()` + null check.

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo field mới ngoài schema. Mọi field dùng trong code đều cross-check với `prisma/schema.prisma`.
- **Shotgun edit**: KHÔNG sửa file ngoài scope (middleware.ts, prisma.ts, layout.tsx — đều KHÔNG đụng).
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` sau từng step. Phát hiện 1 lỗi ở Step 1 (`token.firstName = string | undefined`) và sửa ngay với `?? ""`.
