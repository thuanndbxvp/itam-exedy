# SKILL-ROUTING: B10-B13 - Security & Preferences Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

| Bước | Task | Skill | Lý do |
|------|------|-------|--------|
| 1 | Verify `ActionLog` có `LOGIN` action | `code-explorer` | Check seed/scripts |
| 2 | B10 — notifications page | `react-reviewer` | Form + Toast pattern |
| 3 | B11 — appearance page + theme runtime | `react-reviewer` | Cookie + DOM class |
| 4 | B12 — security enhance (toggle 2FA optin) | `react-reviewer` | Server action + revalidate |
| 5 | B13 — login history | `react-reviewer` | Card timeline |

## Verification

- `npx tsc --noEmit`
- Test thủ công:
  - Đổi theme → reload → dark class giữ nguyên
  - Mute notification → save → DB cập nhật `muteUntil`
  - Login lần 2 → security page hiển thị 2 history rows