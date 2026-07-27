'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalSearchModal from './search/GlobalSearchModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  if (isAuthPage) {
    return (
      <>
        <main className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
          {children}
        </main>
        <GlobalSearchModal />
      </>
    )
  }

  return (
    <>
      <div className="h-full flex overflow-hidden w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <GlobalSearchModal />
    </>
  )
}
