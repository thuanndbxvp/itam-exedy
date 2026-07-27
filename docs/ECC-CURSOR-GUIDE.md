# ECC trên Cursor IDE — Hướng dẫn sử dụng

Hướng dẫn chi tiết cách dùng repo **affaan-m/ecc** (Everything Claude Code) đã được cài cho **Cursor IDE** tại `D:\IT-management\.cursor\`.

> Phiên bản đã cài: `ecc-universal@2.0.0` · Profile **core** · Ngôn ngữ: **TypeScript + Python**

---

## 0. Tổng quan nhanh

| Lớp | Vị trí | Cursor dùng bằng cách nào |
|---|---|---|
| **Rules** | `.cursor/rules/*.mdc` | Cursor tự load theo `alwaysApply: true` hoặc theo `globs` file đang mở |
| **Agents** | `.cursor/agents/ecc-*.md` | Gọi qua `@ecc-tên-agent` trong chat |
| **Skills** | `.cursor/skills/<name>/SKILL.md` | Cursor tự khớp theo `description` khi mô tả công việc |
| **Hooks** | `.cursor/hooks.json` + `.cursor/hooks/*.js` | Cursor tự gọi khi có sự kiện |
| **MCP** | `.cursor/mcp.json` | Cursor dùng làm tool servers |
| **Commands** | `.cursor/commands/*.md` | Gõ `/tên-command` trong Composer |

**Con số hiện tại:** 609 files · 103 rules · 80 skills · 64 agents · 84 commands · 17 hooks.

---

## 1. Rules — Cursor tự áp dụng (không cần gọi)

### Always-on (luôn chạy)
File trong `.cursor/rules/` có `alwaysApply: true`:
- `common-agents.mdc` — orchestration agent, parallel execution
- `common-coding-style.mdc` — style chuẩn
- `common-development-workflow.mdc` — quy trình phát triển
- `common-git-workflow.mdc` — commit message, branch
- `common-hooks.mdc` — khi nào nên tạo hook
- `common-patterns.mdc` — pattern phổ biến
- `common-performance.mdc` — tối ưu hiệu năng
- `common-security.mdc` — bảo mật baseline
- `common-testing.mdc` — test requirement
- `common-code-review.mdc` — checklist review

### Glob-scoped (chỉ áp dụng khi mở file khớp pattern)
- `typescript-*.mdc` → `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- `python-*.mdc` → `*.py`
- `golang-*.mdc`, `kotlin-*.mdc`, `php-*.mdc`, `swift-*.mdc`
- `angular-*.mdc`, `cpp-*.mdc`, `dart-*.mdc`, `java-*.mdc`, `rust-*.mdc`, `csharp-*.mdc`, `fsharp-*.mdc`, `arkts-*.mdc`, `harmonyos-*.mdc`

### Kiểm tra rule đang hoạt động
Mở file `.py` rồi hỏi Cursor: *"What coding rules apply here?"*

### Tắt/bật hàng loạt
`Cursor Settings → Rules` sẽ liệt kê tất cả `.mdc` — toggle từng cái.

---

## 2. Agents — chuyên gia theo chủ đề

64 agents ở `.cursor/agents/ecc-*.md`. **Trong Composer gõ `@ecc-tên-agent ...`**.

### Bảng tra nhanh

| Agent | Khi nào dùng | Ví dụ |
|---|---|---|
| `@ecc-code-reviewer` | Sau khi viết/sửa code | `@ecc-code-reviewer review src/api/` |
| `@ecc-build-error-resolver` | Build/type fail | paste log + `@ecc-build-error-resolver` |
| `@ecc-architect` | Quyết định kiến trúc | `@ecc-architect design a rate limiter` |
| `@ecc-code-architect` | Thiết kế feature mới | `@ecc-code-architect plan CSV export` |
| `@ecc-tdd-guide` | Feature/bug mới (viết test trước) | `@ecc-tdd-guide implement discount calc` |
| `@ecc-security-reviewer` | Trước khi commit auth/payment | `@ecc-security-reviewer audit src/payments/` |
| `@ecc-database-reviewer` | SQL/schema | `@ecc-database-reviewer optimize this query` |
| `@ecc-django-reviewer` | Django | `@ecc-django-reviewer` |
| `@ecc-fastapi-reviewer` | FastAPI | `@ecc-fastapi-reviewer` |
| `@ecc-typescript-reviewer` | TypeScript | `@ecc-typescript-reviewer` |
| `@ecc-python-reviewer` | Python | `@ecc-python-reviewer` |
| `@ecc-react-reviewer` | React | `@ecc-react-reviewer` |
| `@ecc-go-reviewer` / `@ecc-go-build-resolver` | Go | `@ecc-go-reviewer` |
| `@ecc-java-reviewer` / `@ecc-java-build-resolver` | Java | `@ecc-java-reviewer` |
| `@ecc-rust-reviewer` / `@ecc-rust-build-resolver` | Rust | `@ecc-rust-reviewer` |
| `@ecc-cpp-reviewer` / `@ecc-cpp-build-resolver` | C++ | `@ecc-cpp-reviewer` |
| `@ecc-csharp-reviewer` | C# | `@ecc-csharp-reviewer` |
| `@ecc-fsharp-reviewer` | F# | `@ecc-fsharp-reviewer` |
| `@ecc-kotlin-reviewer` / `@ecc-kotlin-build-resolver` | Kotlin | `@ecc-kotlin-reviewer` |
| `@ecc-swift-reviewer` / `@ecc-swift-build-resolver` | Swift | `@ecc-swift-reviewer` |
| `@ecc-php-reviewer` | PHP | `@ecc-php-reviewer` |
| `@ecc-flutter-reviewer` / `@ecc-flutter-build-resolver` | Flutter | `@ecc-flutter-reviewer` |
| `@ecc-dart-build-resolver` | Dart | `@ecc-dart-build-resolver` |
| `@ecc-harmonyos-app-resolver` | HarmonyOS | `@ecc-harmonyos-app-resolver` |
| `@ecc-pytorch-build-resolver` | PyTorch | `@ecc-pytorch-build-resolver` |
| `@ecc-refactor-cleaner` | Dọn dead code | `@ecc-refactor-cleaner scan src/` |
| `@ecc-e2e-runner` | Viết/E2E test | `@ecc-e2e-runner test checkout flow` |
| `@ecc-docs-lookup` | Tra docs thư viện | `@ecc-docs-lookup Next.js 15 caching` |
| `@ecc-doc-updater` | Cập nhật README/codemap | `@ecc-doc-updater refresh docs/` |
| `@ecc-code-explorer` | Khám phá codebase | `@ecc-code-explorer map this repo` |
| `@ecc-code-simplifier` | Đơn giản hóa code | `@ecc-code-simplifier src/utils.ts` |
| `@ecc-comment-analyzer` | Phân tích comment | `@ecc-comment-analyzer` |
| `@ecc-conversation-analyzer` | Phân tích chat | (ít dùng trực tiếp) |
| `@ecc-performance-optimizer` | Tối ưu hiệu năng | `@ecc-performance-optimizer` |
| `@ecc-security-reviewer` | Security audit | `@ecc-security-reviewer` |
| `@ecc-silent-failure-hunter` | Tìm lỗi bị nuốt | `@ecc-silent-failure-hunter` |
| `@ecc-a11y-architect` | Accessibility | `@ecc-a11y-architect` |
| `@ecc-mle-reviewer` | ML/MLOps | `@ecc-mle-reviewer` |
| `@ecc-marketing-agent` | Marketing copy | `@ecc-marketing-agent` |
| `@ecc-chief-of-staff` | Triage email/Slack | `@ecc-chief-of-staff` |
| `@ecc-homelab-architect` | Network gia đình | `@ecc-homelab-architect` |
| `@ecc-network-architect` | Enterprise network | `@ecc-network-architect` |
| `@ecc-network-troubleshooter` | Debug network | `@ecc-network-troubleshooter` |
| `@ecc-seo-specialist` | SEO | `@ecc-seo-specialist` |

### Mẹo: không cần gọi tay
Theo rule `common-agents.mdc`, Cursor tự chọn agent khi:
- Vừa sửa code → tự gọi `code-reviewer`
- Gặp lỗi build → tự gọi `build-error-resolver`
- Yêu cầu feature mới → tự gọi `tdd-guide` + `code-architect`

---

## 3. Skills — quy trình tự kích hoạt

Cursor đọc `description` trong frontmatter `SKILL.md` để biết khi nào áp dụng. **Bạn không cần nhớ tên** — mô tả công việc, Cursor tự khớp.

### Bảng tra nhanh

| Skill | Trigger (mô tả trong chat) | Cursor sẽ làm gì |
|---|---|---|
| **tdd-workflow** | "add feature X", "fix bug Y", "implement Z" | Ép viết test trước, đòi 80%+ coverage, tạo checkpoint commit RED → GREEN → REFACTOR |
| **verification-loop** | "I just finished...", "before I open a PR", "after refactor" | Chạy build → type-check → lint → test theo thứ tự |
| **code-review** | "review my changes", "is this good?" | Review theo checklist (security, perf, a11y, naming, tests) |
| **strategic-compact** | Khi chat dài, context đầy | Tóm tắt context cũ thành memory file, gọi `/compact` an toàn |
| **continuous-learning-v2** | Sau mỗi session | Tự trích pattern từ session → lưu "instinct" để dùng lại |
| **continuous-learning** | (phiên bản cũ hơn) | Tương tự |
| **council** | "should I use X or Y?", "trade-off between A and B" | Mời nhiều sub-agent (factual, senior, security, redundancy) |
| **iterative-retrieval** | "find where X is used", "trace how Y flows" | Truy vết code qua nhiều file, dynamic dispatch |
| **error-handling** | Khi viết try/catch, retry, circuit-breaker | Áp dụng pattern chuẩn |
| **api-design** | Khi thiết kế REST/GraphQL | Pattern `ApiResponse<T>`, pagination, error envelope |
| **coding-standards** | Mọi lúc viết code | Style chuẩn (một phần đã cover trong rules) |
| **backend-patterns** | Khi viết API/service | Repository, service layer, DI |
| **mcp-server-patterns** | Khi tạo MCP server | Template server MCP |
| **documentation-lookup** | "how do I use library X", "what's the API for Y" | Gọi `context7` MCP để lấy docs |
| **hookify-rules** | "tôi muốn Cursor chặn hành động X" | Tạo rule auto-trigger |
| **plankton-code-quality** | "scan quality", "auto audit" | Quét code theo checklist |
| **production-audit** | "ready to ship?" | Audit production-readiness |
| **configure-ecc** | "configure ecc", "setup ecc" | Wizard cài thêm/bớt skill |
| **code-tour** | "tour through this codebase" | Lập bản đồ file/symbol mới vào |
| **agent-introspection-debugging** | Khi agent loop vô hạn | Debug recursive observer |
| **ai-regression-testing** | "tests for AI features" | Test prompt/agent behavior |
| **agent-sort** | Phân loại/categorize nhiều thứ | Sort có lý do |
| **windows-desktop-e2e** | Test app Windows desktop | E2E cho Win32/WPF |
| **angular-developer** | Angular | Pattern Angular |
| **android-clean-architecture** | Android | Clean architecture |
| **compose-multiplatform-patterns** | Compose Multiplatform | CMP patterns |
| **cpp-coding-standards** / **cpp-testing** | C++ | Standards + test |
| **csharp-testing** | C# | Test patterns |
| **dart-flutter-patterns** | Dart/Flutter | Patterns |
| **django-patterns** / **django-tdd** / **django-verification** | Django | Pattern + TDD + verify |
| **bun-runtime** | Bun | Runtime patterns |
| **nextjs-turbopack** | Next.js với Turbopack | Pattern Next.js |
| **article-writing** | Viết bài kỹ thuật | Workflow viết |
| **content-engine** | Content workflow | Quy trình content |
| **frontend-slides** | Tạo slide HTML | Slides + Chart.js |
| **investor-materials** | Tài liệu nhà đầu tư | Template |
| **investor-outreach** | Outreach nhà đầu tư | Template |
| **market-research** | Nghiên cứu thị trường | Workflow |
| **api-design** | REST/GraphQL | Pattern |

### Ví dụ thực tế
Bạn chat: *"Add a /search endpoint with filters"*
→ Cursor match `api-design` + `tdd-workflow` + `verification-loop`:
1. Viết test cho endpoint (`tdd-workflow`)
2. Chạy test đỏ → sửa code → chạy test xanh
3. Sau khi xong, tự chạy `verification-loop` (build + type + lint + test)

---

## 4. Commands — slash ngắn, gõ trực tiếp trong Composer

84 commands ở `.cursor/commands/`. Gõ `/` trong Composer để xem danh sách đầy đủ.

| Command | Công dụng |
|---|---|
| `/plan` | Lên kế hoạch chi tiết cho task |
| `/code-review` | Review code (Composer thêm context) |
| `/build-fix` | Tự động fix build/type error |
| `/checkpoint` | Tạo git checkpoint theo TDD |
| `/feature-dev` | Workflow phát triển feature end-to-end |
| `/evolve` | Auto-evolve skill từ session patterns |
| `/refactor` | Cleanup dead code |
| `/auto-update` | Cập nhật ECC khi có version mới |
| `/cost-report` | Xem chi phí (nếu dùng API key) |
| `/ecc-guide` | Mở guide tổng quan |
| `/cpp-review` `/cpp-build` `/cpp-test` | C++ |
| `/go-review` `/go-build` | Go |
| `/flutter-review` `/flutter-build` `/flutter-test` | Flutter |
| `/dart-test` | Dart |
| `/fastapi-review` | FastAPI |
| `/gan-build` `/gan-design` | GAN harness |
| `/cpp-build` | C++ build |
| `/cpp-test` | C++ test |

Cách dùng: mở Composer (Ctrl+I hoặc Cmd+I), gõ `/plan refactor the auth module`.

---

## 5. Hooks — Cursor tự chặn/bảo vệ

Đã wire vào `.cursor/hooks.json`. Các hook đáng chú ý:

| Sự kiện | Hook làm gì |
|---|---|
| `sessionStart` | Load context từ session trước, set `ECC_AGENT_DATA_HOME=~/.cursor/ecc` |
| `beforeShellExecution` | **Block** nếu dev server chạy ngoài tmux + **block** git hook-bypass (`--no-verify`) |
| `afterFileEdit` | Auto-format + TypeScript check + cảnh báo `console.log` còn sót |
| `beforeSubmitPrompt` | **Detect secret** trong prompt (sk-…, ghp_…, AKIA…) — cảnh báo trước khi gửi |
| `beforeTabFileRead` | **Block** Cursor Tab khỏi đọc `.env`, `.key`, `.pem` |
| `beforeMCPExecution` / `afterMCPExecution` | Audit log mọi MCP call |
| `sessionEnd` | Persist session state, evaluate patterns → đẩy vào memory |

### Bạn sẽ thấy hook hoạt động khi
- Gõ `sk-proj-abc…` vào chat → warning "secret detected"
- Mở file `.env` qua Tab → bị block
- Bấm "Accept all" cho file `.ts` → tự chạy prettier/tsc
- Chạy `git commit --no-verify` → hook chặn (exit 2)

### Tắt tạm thời 1 hook
Sửa `.cursor/hooks.json`, hoặc xóa entry tương ứng.

---

## 6. MCP servers — tools thêm sức mạnh

`.cursor/mcp.json` đã wire sẵn. Cursor dùng như tool trong Composer:

- **github** — search/đọc/tạo file trên GitHub repo
- **context7** — lấy docs up-to-date cho thư viện
- **exa** — web search nâng cao
- (xem đầy đủ: `Get-Content .cursor/mcp.json`)

**Ví dụ prompt kích hoạt:** *"How do I use Next.js 15 unstable_cache? use context7"*

---

## 7. 5 workflow thực hành ngay

### Workflow A: TDD một feature mới
1. Composer: `@ecc-tdd-guide add a function that validates Vietnamese phone numbers`
2. Cursor: viết test (RED) → bạn confirm → viết code (GREEN) → refactor
3. Sau khi xong: `/verification-loop` (hoặc chat "run verification loop")
4. Commit với `/checkpoint` hoặc nhờ Cursor viết message theo common-git-workflow

### Workflow B: Review code vừa sửa
1. Sửa vài file
2. Chat: `@ecc-code-reviewer review my changes`
3. Nó chạy checklist security/perf/a11y/naming/tests
4. Fix theo gợi ý → commit

### Workflow C: Debug build lỗi
1. Paste log lỗi
2. Chat: `@ecc-build-error-resolver fix this: <paste log>`
3. Cursor phân tích → đề xuất patch → apply

### Workflow D: Quyết định kiến trúc có nhiều trade-off
1. Chat: *"Should I use Postgres row-level security or app-layer middleware for multi-tenant? @ecc-council"*
2. Cursor mời 4 sub-agent (factual, senior, security, redundancy) → tổng hợp

### Workflow E: Thêm component vào Cursor
1. Chat: *"configure ecc: thêm skill backend-patterns và rule swift-security"*
2. Cursor chạy skill `configure-ecc` → hỏi bạn chọn → cài thêm

---

## 8. Memory & Continuous Learning

- Mỗi `sessionEnd`, hook `session-end.js` lưu state vào `~/.cursor/ecc/`
- Skill `continuous-learning-v2` tự tách "instinct" (pattern) từ session → dùng lại session sau
- Xem instincts: `ls ~/.cursor/ecc/instincts/` (sau khi chạy được vài session)
- **Tắt learning** nếu thấy nhiễu: xóa skill `continuous-learning-v2` khỏi `.cursor/skills/`

---

## 9. Kiểm tra nhanh hệ thống đang chạy đúng

```powershell
cd D:\IT-management
npx ecc doctor
npx ecc list-installed
```

Cài thêm ngôn ngữ/skill:

```powershell
# Thêm Go
npx --yes --package=ecc-universal@2.0.0 ecc-install --target cursor go

# Thêm React/Angular
npx --yes --package=ecc-universal@2.0.0 ecc-install --target cursor typescript react angular

# Thêm skill riêng lẻ
npx --yes --package=ecc-universal@2.0.0 ecc-install --target cursor --skills security-audit,tdd-workflow

# Xem trước file plan
npx --yes --package=ecc-universal@2.0.0 ecc-install --target cursor go --dry-run
```

---

## 10. TL;DR — 3 việc làm ngay để "cảm" hệ thống

1. **Mở `D:\IT-management` trong Cursor** → mở 1 file `.py` → hỏi *"What rules apply here?"* → sẽ thấy `python-*` rules tự load.
2. **Trong Composer:** `@ecc-code-reviewer @D:\IT-management\src\auth` (tạo file giả trước nếu chưa có) → xem nó review theo checklist.
3. **Tạo 1 file `.env` giả** → mở qua Cursor Tab → thấy bị block bởi hook `beforeTabFileRead`.

---

## Phụ lục: Cấu trúc thư mục đã cài

```
D:\IT-management\
├── .cursor\
│   ├── hooks.json                  # 15 hook events
│   ├── mcp.json                    # github, context7, exa, ...
│   ├── ecc-install-state.json      # state cho doctor/repair/uninstall
│   ├── ecc-agent-data.json         # override memory path
│   ├── agents\                     # 64 file ecc-*.md
│   ├── commands\                   # 84 file *.md
│   ├── hooks\                      # 17 file *.js + adapter.js
│   ├── mcp-configs\                # raw MCP configs
│   ├── rules\                      # 103 file *.mdc (always + glob)
│   ├── scripts\                    # ecc.js, uninstall.js, ...
│   ├── skills\                     # 80 thư mục skill
│   └── .agents\                    # (mirror agents)
└── ...
```

---

## Tham khảo nhanh khi quên

| Tôi muốn... | Dùng |
|---|---|
| ...viết feature mới | `@ecc-tdd-guide` hoặc `@ecc-code-architect` |
| ...sửa code có review | `@ecc-code-reviewer` |
| ...fix build lỗi | `@ecc-build-error-resolver` |
| ...chọn kiến trúc | `@ecc-architect` hoặc `@ecc-council` |
| ...tìm hiểu codebase | `@ecc-code-explorer` hoặc skill `code-tour` |
| ...tra docs thư viện | `@ecc-docs-lookup` hoặc `use context7` |
| ...dọn dead code | `@ecc-refactor-cleaner` |
| ...viết test E2E | `@ecc-e2e-runner` |
| ...tối ưu hiệu năng | `@ecc-performance-optimizer` |
| ...tìm lỗi bị nuốt | `@ecc-silent-failure-hunter` |
| ...cài thêm skill | chat "configure ecc: ..." |
| ...xem quy trình verify | `/verification-loop` hoặc chat "run verification loop" |
| ...commit theo TDD | `/checkpoint` |

---

*Tạo bởi Cursor Assistant · Phiên bản ECC: `ecc-universal@2.0.0` · Target: Cursor IDE*