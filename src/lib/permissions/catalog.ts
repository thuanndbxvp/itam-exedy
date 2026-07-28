/**
 * Permission Catalog — single source of truth cho mọi permission key trong hệ thống.
 *
 * Quy tắc:
 * - key format: "<resource>.<action>" (lowercase, dot-separated)
 * - group: phân nhóm hiển thị trên UI matrix
 * - Khi thêm permission mới: thêm vào đây → re-seed → xuất hiện trong UI.
 *
 * Mapping default theo Role (lib/permissions.ts):
 *   ADMIN      → tất cả
 *   IT_MANAGER → hầu hết trừ users.manage / settings.update
 *   IT_STAFF   → assets.checkout/checkin, helpdesk.claim, licenses.read…
 *   EMPLOYEE   → helpdesk (view, create_ticket, comment) — Sprint C.7 fix
 *
 * Sprint C.7: Security Fix - Thu hồi quyền cấp cao từ EMPLOYEE
 *   - Xóa: 'assets.read', 'licenses.read', 'users.read'
 *   - EMPLOYEE chỉ còn quyền Helpdesk cơ bản
 */

export type PermissionKey = string

export interface PermissionDef {
  key: PermissionKey
  resource: string
  action: string
  label: string
  description?: string
  group: 'Tài sản' | 'Bản quyền' | 'Helpdesk' | 'Người dùng' | 'Cài đặt' | 'Báo cáo'
}

export const PERMISSIONS: PermissionDef[] = [
  // ── Tài sản ──────────────────────────────────────────────────────────
  { key: 'assets.read',         resource: 'assets', action: 'read',    label: 'Xem tài sản',     group: 'Tài sản', description: 'Xem danh sách & chi tiết tài sản' },
  { key: 'assets.create',       resource: 'assets', action: 'create',  label: 'Tạo tài sản',     group: 'Tài sản' },
  { key: 'assets.update',       resource: 'assets', action: 'update',  label: 'Sửa tài sản',     group: 'Tài sản' },
  { key: 'assets.delete',       resource: 'assets', action: 'delete',  label: 'Xóa tài sản',     group: 'Tài sản' },
  { key: 'assets.checkout',     resource: 'assets', action: 'checkout',label: 'Checkout tài sản',group: 'Tài sản', description: 'Giao tài sản cho người dùng' },
  { key: 'assets.checkin',      resource: 'assets', action: 'checkin', label: 'Checkin tài sản', group: 'Tài sản', description: 'Thu hồi tài sản' },

  // ── Bản quyền ────────────────────────────────────────────────────────
  { key: 'licenses.read',       resource: 'licenses', action: 'read',    label: 'Xem bản quyền',    group: 'Bản quyền' },
  { key: 'licenses.create',     resource: 'licenses', action: 'create',  label: 'Tạo bản quyền',    group: 'Bản quyền' },
  { key: 'licenses.update',     resource: 'licenses', action: 'update',  label: 'Sửa bản quyền',    group: 'Bản quyền' },
  { key: 'licenses.delete',     resource: 'licenses', action: 'delete',  label: 'Xóa bản quyền',    group: 'Bản quyền' },
  { key: 'licenses.assign',     resource: 'licenses', action: 'assign',  label: 'Gán/Xóa seat',     group: 'Bản quyền', description: 'Gán seat bản quyền cho user' },

  // ── Helpdesk ─────────────────────────────────────────────────────────
  { key: 'helpdesk.view',       resource: 'helpdesk', action: 'view',       label: 'Xem ticket',         group: 'Helpdesk' },
  { key: 'helpdesk.create_ticket', resource: 'helpdesk', action: 'create_ticket', label: 'Tạo ticket',  group: 'Helpdesk', description: 'Tạo ticket helpdesk' },
  { key: 'helpdesk.claim',      resource: 'helpdesk', action: 'claim',      label: 'Nhận ticket',        group: 'Helpdesk', description: 'Assign cho mình' },
  { key: 'helpdesk.reassign',   resource: 'helpdesk', action: 'reassign',   label: 'Chuyển ticket',      group: 'Helpdesk', description: 'Chuyển ticket cho người khác' },
  { key: 'helpdesk.close',      resource: 'helpdesk', action: 'close',      label: 'Đóng ticket',        group: 'Helpdesk' },
  { key: 'helpdesk.comment',    resource: 'helpdesk', action: 'comment',    label: 'Bình luận ticket',   group: 'Helpdesk' },
  { key: 'helpdesk.manage_rules', resource: 'helpdesk', action: 'manage_rules', label: 'Quản lý rule',    group: 'Helpdesk', description: 'Cấu hình auto-assign rule' },
  { key: 'helpdesk.manage_teams', resource: 'helpdesk', action: 'manage_teams', label: 'Quản lý Team', group: 'Helpdesk', description: 'CRUD Helpdesk Team + quản lý thành viên' },

  // ── Người dùng ──────────────────────────────────────────────────────
  { key: 'users.read',          resource: 'users', action: 'read',        label: 'Xem người dùng',     group: 'Người dùng' },
  { key: 'users.create',        resource: 'users', action: 'create',      label: 'Tạo người dùng',     group: 'Người dùng' },
  { key: 'users.update',        resource: 'users', action: 'update',      label: 'Sửa người dùng',     group: 'Người dùng' },
  { key: 'users.delete',        resource: 'users', action: 'delete',      label: 'Xóa người dùng',     group: 'Người dùng' },
  { key: 'users.manage_roles',  resource: 'users', action: 'manage_roles',label: 'Phân quyền',         group: 'Người dùng', description: 'Gán role + custom role + override permission' },

  // ── Cài đặt ─────────────────────────────────────────────────────────
  { key: 'settings.read',       resource: 'settings', action: 'read',   label: 'Xem cài đặt',         group: 'Cài đặt' },
  { key: 'settings.update',     resource: 'settings', action: 'update', label: 'Sửa cài đặt',         group: 'Cài đặt', description: 'Cập nhật danh mục, công ty, phòng ban…' },

  // ── Báo cáo ─────────────────────────────────────────────────────────
  { key: 'reports.view',        resource: 'reports', action: 'view',   label: 'Xem báo cáo',         group: 'Báo cáo' },
  { key: 'reports.export',      resource: 'reports', action: 'export', label: 'Xuất báo cáo',        group: 'Báo cáo', description: 'Export CSV / Excel' },
]

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key)

/**
 * Default permissions theo system Role — seed vào RolePermission.
 * Custom role sẽ merge thêm từ DB.
 */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [...PERMISSION_KEYS],

  IT_MANAGER: [
    'assets.read', 'assets.create', 'assets.update', 'assets.delete', 'assets.checkout', 'assets.checkin',
    'licenses.read', 'licenses.create', 'licenses.update', 'licenses.delete', 'licenses.assign',
    'helpdesk.view', 'helpdesk.create_ticket', 'helpdesk.claim', 'helpdesk.close', 'helpdesk.comment', 'helpdesk.manage_rules', 'helpdesk.manage_teams',
    'users.read', 'users.update',
    'settings.read', 'settings.update',
    'reports.view', 'reports.export',
  ],

  IT_STAFF: [
    'assets.read', 'assets.update', 'assets.checkout', 'assets.checkin',
    'licenses.read', 'licenses.assign',
    'helpdesk.view', 'helpdesk.create_ticket', 'helpdesk.claim', 'helpdesk.close', 'helpdesk.comment',
    'users.read',
    'settings.read',
    'reports.view',
  ],

  // C.7 Security Fix: EMPLOYEE chỉ có quyền Helpdesk cơ bản
  EMPLOYEE: [
    'helpdesk.view',
    'helpdesk.create_ticket',
    'helpdesk.comment',
  ],
}