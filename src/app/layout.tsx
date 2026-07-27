import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionProviderClient from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-gray-50`}
    >
      <body className="h-full flex bg-slate-50">
        {/* SessionProvider bọc ngoài AppShell để Header (Client Component) dùng được useSession() */}
        <SessionProviderClient>
          {/* ToastProvider bọc TRONG SessionProvider để Toast có thể dùng useSession nếu cần (Phase 2). */}
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}
