import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, Bell,
  Settings, Shield, LogOut, GraduationCap, Rss
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import Logo from './Logo'
import Avatar from '../ui/Avatar'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { getFullName } from '../../lib/utils'

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/app/feed', icon: Rss, label: t('nav.feed') },
    { to: '/app/messages', icon: MessageSquare, label: t('nav.messages') },
    { to: '/app/courses', icon: GraduationCap, label: t('nav.courses') },
    { to: '/app/notifications', icon: Bell, label: t('nav.notifications') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full py-4 px-3">
      <div className="px-2 mb-8">
        <Logo size="md" />
        <p className="text-xs text-slate-400 mt-1 ml-1">{t('nav.universityPlatform')}</p>
      </div>

      <nav className="flex-1 space-y-1" onClick={onClose}>
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active')
            }
          >
            <Shield size={18} />
            <span>{t('nav.adminPanel')}</span>
          </NavLink>
        )}
      </nav>

      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-1">
        <div className="px-2 py-2">
          <LanguageSwitcher />
        </div>

        <NavLink
          to="/app/settings"
          className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          onClick={onClose}
        >
          <Settings size={18} />
          <span>{t('nav.settings')}</span>
        </NavLink>

        <NavLink
          to={`/app/profile/${user?.id}`}
          className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          onClick={onClose}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar
              src={user?.profile?.avatarUrl}
              firstName={user?.profile?.firstName}
              lastName={user?.profile?.lastName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {getFullName(user?.profile)}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
        </NavLink>

        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600">
          <LogOut size={18} />
          <span>{t('nav.logOut')}</span>
        </button>
      </div>
    </div>
  )
}
