# ACCEPTANCE: Sprint-C.3-sidebar-profile-ui

**Tier 2 — Sidebar user info + logout**

- [ ] AC1. Sidebar header: show user avatar (initials fallback), full name, role badge.
- [ ] AC2. Sidebar bottom: "Đăng xuất" button with `signOut()` from `next-auth/react`. Uses `signOut({ callbackUrl: '/login' })`.
- [ ] AC3. Avatar: `session.user` data (firstName, lastName, role) from `useSession()`. Initials fallback if no avatar.
- [ ] AC4. Role badge: colored badge showing `ADMIN` / `IT_MANAGER` / `IT_STAFF` / `EMPLOYEE`.
- [ ] AC5. Responsive: user info section stays visible on both desktop sidebar and mobile overlay.
- [ ] AC6. Keep existing `IT Manager` branding at top.
- [ ] AC7. Logout button styled consistently (Lucide LogOut icon, danger-ish hover).
- [ ] AC8. No permission gate on sidebar itself — sidebar always renders for authenticated users.