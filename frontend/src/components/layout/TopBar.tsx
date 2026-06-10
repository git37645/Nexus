import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../hooks/useAuth'

interface TopBarProps {
  onMenuToggle: () => void
  mobileMenuOpen: boolean
}

export default function TopBar({ onMenuToggle, mobileMenuOpen }: TopBarProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get('/notifications')
      return res.data.data?.unreadCount ?? 0
    },
    refetchInterval: 30000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/app/feed?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-surface-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 px-4 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-surface-700 border border-transparent focus:border-primary-300 focus:bg-white dark:focus:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/app/notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {(unreadData ?? 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => navigate(`/app/profile/${user?.id}`)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors"
        >
          <Avatar
            src={user?.profile?.avatarUrl}
            firstName={user?.profile?.firstName}
            lastName={user?.profile?.lastName}
            size="sm"
          />
        </button>
      </div>
    </header>
  )
}
