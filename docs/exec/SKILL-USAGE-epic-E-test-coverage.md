# SKILL USAGE — Epic E Test Coverage

Ngày: 2026-07-26

## Skills bắt buộc

- `code.md`: dùng để thực thi vai Tier 2 Coder + Auditor, bám MSEW và tự chạy verify.
- `audit.md`: dùng để tái chạy typecheck, Jest, coverage, race, Playwright và build.
- `typist-mindset.md`: dùng để giữ phạm vi chỉ ở test/config/docs, không sửa production logic.
- `anti-hallucination.md`: mọi kết luận trong evidence lấy từ command output thực tế.
- `skill-invocation-protocol.md`: ghi nhận skill và fallback theo từng nhóm công việc.

## Skill hỗ trợ

- `tdd-workflow`: áp dụng isolation, behavior assertions, integration/component/E2E layers và coverage gates.
- Next.js 16 local docs:
  - `node_modules/next/dist/docs/01-app/02-guides/testing/jest.md`
  - `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`

## CodeGraph

- `codegraph_context`: audit chữ ký và dependency của `RoleGate`, `Modal`, server actions, commands, audit, locking và Prisma singleton trước khi viết test.
- Kết quả được đối chiếu trực tiếp với source trước khi tạo facade/test input.
- Không sửa symbol production nên không có caller/signature blast radius mới.

## Fallback PGlite

- Primary theo MSEW: `@prisma/adapter-pglite`.
- Registry output: HTTP 404.
- Fallback được chỉ định: Strategy C, PGlite raw SQL + mock Prisma client boundary.
- Hiệu quả: HIGH; 7 integration suites/20 tests và race test đều PASS.

## Hiệu quả tổng

- Infrastructure/testing: HIGH.
- Integration/race: HIGH.
- Component coverage: HIGH.
- Playwright install/browser: HIGH.
- Authenticated E2E runtime: BLOCKED bởi `/api/auth/error`; test files vẫn được giữ để Phase 3 chạy lại sau khi sửa auth runtime.
