/**
 * Shared types for Integrations page (Sprint R.3 - Component Refactor)
 */

// Tab types
export type Tab = 'tokens' | 'templates' | 'channels'

export const TAB_LABELS: Record<Tab, { label: string; icon: string }> = {
  tokens: { label: 'API Tokens', icon: 'Key' },
  templates: { label: 'Email Templates', icon: 'Mail' },
  channels: { label: 'Notification Channels', icon: 'Bell' },
}

// API Token types
export interface ApiToken {
  id: string
  name: string
  tokenPrefix: string
  scopes: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  ownerName: string
}

export const API_TOKEN_SCOPE_OPTIONS = [
  'assets.read',
  'licenses.read',
  'users.read',
  'tickets.read',
] as const

// Email Template types
export interface EmailTemplate {
  key: string
  subject: string
  htmlBody: string
  variables: string[]
  updatedAt?: string
}

// Notification Channel types
export interface NotificationChannel {
  id: string
  name: string
  kind: string
  enabled: boolean
  filterKinds: string[]
  lastDeliveryAt: string | null
  lastDeliveryError: string | null
  createdAt: string
}

// Sample variables for email template preview
export const SAMPLE_VARS: Record<string, Record<string, string>> = {
  TICKET_ASSIGNED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-001',
    link: 'https://app.example.com/helpdesk/TK-001',
  },
  TICKET_COMMENTED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-002',
    authorName: 'Trần Thị B',
    commentContent: 'Đã kiểm tra xong, vui lòng reboot máy.',
    link: 'https://app.example.com/helpdesk/TK-002',
  },
  TICKET_STATUS_CHANGED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-003',
    newStatus: 'IN_PROGRESS',
    link: 'https://app.example.com/helpdesk/TK-003',
  },
  TICKET_CLOSED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-004',
    link: 'https://app.example.com/helpdesk/TK-004',
  },
  PASSWORD_RESET: {
    userName: 'Nguyễn Văn A',
    resetUrl: 'https://app.example.com/reset-password?token=abc123',
  },
  ASSET_CHECKOUT: {
    userName: 'Nguyễn Văn A',
    assetTag: 'IT-0001',
    assetName: 'Laptop Dell Latitude 5420',
    notes: 'Cấp phát cho dự án CRM',
    link: 'https://app.example.com/assets/IT-0001',
  },
}
