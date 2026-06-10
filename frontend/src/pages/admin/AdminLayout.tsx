import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Users, Flag, BookOpen, ArrowLeft, Shield } from 'lucide-react'
import { cn } from '../../lib/utils'
import Logo from '../../components/layout/Logo'

const adminLinks = [
  { to: '/app/admin', icon: BarChart3, label: 'Dashboard', end: true },
  { to: '/app/admin/users', icon: Users, label: 'Users' },
  { to: '/app/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/app/admin/audit-log', icon: BookOpen, label: 'Audit Log' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-surface-800 border-r border-slate-100 dark:border-slate-700 py-4 px-3">
        <div className="px-2 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Admin Panel</span>
          </div>
          <Logo size="sm" showText={false} />
        </div>

        <nav className="flex-1 space-y-1">
          {adminLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <button
            onClick={() => navigate('/app/feed')}
            className="sidebar-link w-full"
          >
            <ArrowLeft size={16} />
            Back to App
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-surface-800 border-b border-slate-100 dark:border-slate-700 px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/app/feed')} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-violet-600" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Administration</span>
          </div>
          <div className="ml-auto flex lg:hidden gap-1">
            {adminLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('p-2 rounded-lg', isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-400')}>
                <Icon size={16} />
              </NavLink>
            ))}
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
