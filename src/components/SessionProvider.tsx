'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * Client Component wrapper cho NextAuth SessionProvider.
 *
 * `SessionProvider` yêu cầu Client Component (dùng Context API).
 * RootLayout (`src/app/layout.tsx`) là Server Component → không wrap trực tiếp được.
 * → Tạo wrapper này để layout chỉ cần `<SessionProviderClient>`.
 *
 * Lưu ý: SessionProvider KHÔNG re-fetch session khi mount — dùng session từ cookie.
 * Nếu cần force refresh → gọi `update()` từ `useSession()`.
 */
export default function SessionProviderClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
