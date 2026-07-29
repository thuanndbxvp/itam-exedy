import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionProviderClient from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RealtimeListener from "@/components/RealtimeListener";

export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Asset Management (Premium)",
  description: "Snipe-IT alternative built on Next.js",
};

/**
 * B11 — Resolve theme để áp dụng dark class ngay từ SSR (tránh FOUC).
 *
 * Thứ tự ưu tiên:
 *  1. Cookie `theme` (set khi save preference ở /account/appearance)
 *  2. UserPreference.theme từ DB (nếu có session + DB row)
 *  3. Hệ thống (prefers-color-scheme: dark qua media query — Tailwind dark variant)
 *
 * Trả về className cho `<html>`. Nếu theme === 'DARK' → 'dark'.
 * Nếu theme === 'SYSTEM' → không add class (để Tailwind tự handle).
 */
async function resolveThemeClass(): Promise<string> {
  const cookieStore = await cookies()
  const cookieTheme = cookieStore.get('theme')?.value
  let theme = cookieTheme as 'LIGHT' | 'DARK' | 'SYSTEM' | undefined

  if (!theme) {
    // Fallback: đọc từ DB nếu có session
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const pref = await prisma.userPreference.findUnique({
          where: { userId: session.user.id },
          select: { theme: true },
        })
        if (pref) theme = pref.theme
      }
    } catch {
      // ignore — keep undefined
    }
  }

  // Hide-flash script: áp dụng theme trước khi React hydrate để tránh flash sáng → tối
  // khi user đã chọn DARK.
  const script = `(function(){try{var t=document.cookie.match(/(?:^|;)\\s*theme=([^;]+)/);var v=t?t[1]:null;if(v==='DARK')document.documentElement.classList.add('dark');else if(v==='LIGHT')document.documentElement.classList.remove('dark');}catch(e){}})();`

  return script
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = await resolveThemeClass()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased bg-surface`}
    >
      <head>
        {/* B11 — apply theme ngay từ server để không có flash khi refresh */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full flex bg-surface">
        <SessionProviderClient>
          <ToastProvider>
            <RealtimeListener />
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}