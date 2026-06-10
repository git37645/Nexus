import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { api } from '../../lib/api'
import { Notification } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatRelativeTime, cn } from '../../lib/utils'

const iconColors: Record<string, string> = {
  MESSAGE: 'bg-blue-50 text-blue-600',
  COMMENT: 'bg-violet-50 text-violet-600',
  LIKE: 'bg-rose-50 text-rose-600',
  ASSIGNMENT: 'bg-amber-50 text-amber-600',
  GRADE: 'bg-emerald-50 text-emerald-600',
  LECTURE: 'bg-cyan-50 text-cyan-600',
  ANNOUNCEMENT: 'bg-orange-50 text-orange-600',
  REPORT_REVIEWED: 'bg-slate-50 text-slate-600',
  SYSTEM: 'bg-slate-50 text-slate-600',
  DEADLINE: 'bg-red-50 text-red-600',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications?limit=50')).data.data,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications: Notification[] = data?.notifications ?? []
  const unread = data?.unreadCount ?? 0

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-50 dark:divide-slate-700/50">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id)
                if (n.link) navigate(n.link)
              }}
              className={cn(
                'w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors',
                !n.isRead && 'bg-primary-50/30 dark:bg-primary-950/20'
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconColors[n.type] ?? 'bg-slate-50 text-slate-500')}>
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100')}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-slate-300 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
