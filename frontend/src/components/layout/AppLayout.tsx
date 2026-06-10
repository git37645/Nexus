import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { cn } from '../../lib/utils'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-surface-800 border-r border-slate-100 dark:border-slate-700">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-white dark:bg-surface-800 shadow-2xl h-full z-10">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen(prev => !prev)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
