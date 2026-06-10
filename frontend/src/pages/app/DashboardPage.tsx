import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, MessageSquare, Bell, GraduationCap, Clock, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { getFullName, formatRelativeTime, formatDeadline } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import { Assignment, Notification, Chat } from '../../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: notifData, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications?limit=5')).data.data,
  })

  const { data: chatsData, isLoading: loadingChats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => (await api.get('/chats')).data.data,
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data.data,
  })

  const firstName = user?.profile?.firstName ?? 'there'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Avatar
            src={user?.profile?.avatarUrl}
            firstName={user?.profile?.firstName}
            lastName={user?.profile?.lastName}
            size="lg"
          />
          <div>
            <p className="text-slate-500 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {getFullName(user?.profile)}
            </h1>
            <span className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageSquare, label: 'Messages', path: '/app/messages', color: 'text-blue-600 bg-blue-50' },
              { icon: GraduationCap, label: 'Courses', path: '/app/courses', color: 'text-violet-600 bg-violet-50' },
              { icon: Bell, label: 'Notifications', path: '/app/notifications', color: 'text-amber-600 bg-amber-50' },
              { icon: BookOpen, label: 'Feed', path: '/app/feed', color: 'text-emerald-600 bg-emerald-50' },
            ].map(({ icon: Icon, label, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Notifications</h2>
            <button onClick={() => navigate('/app/notifications')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loadingNotifs ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (notifData?.notifications?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No notifications</p>
          ) : (
            <div className="space-y-3">
              {notifData?.notifications?.slice(0, 5).map((n: Notification) => (
                <button
                  key={n.id}
                  onClick={() => n.link && navigate(n.link)}
                  className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-primary-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${n.isRead ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{n.title}</p>
                    <p className="text-xs text-slate-400 truncate">{n.body}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Chats */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recent Messages</h2>
            <button onClick={() => navigate('/app/messages')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loadingChats ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : !chatsData?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {chatsData.slice(0, 4).map((chat: Chat) => {
                const other = chat.type === 'PRIVATE'
                  ? chat.members.find(m => m.user.id !== user?.id)?.user
                  : null
                const lastMsg = chat.messages?.[0]
                return (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/app/messages/${chat.id}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors text-left"
                  >
                    <Avatar
                      src={other?.profile?.avatarUrl ?? chat.avatarUrl}
                      firstName={other?.profile?.firstName ?? chat.name}
                      lastName={other?.profile?.lastName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {chat.type === 'GROUP' ? chat.name : getFullName(other?.profile)}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {lastMsg?.content ?? 'No messages yet'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-300">{formatRelativeTime(chat.updatedAt)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Courses */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">My Courses</h2>
            <button onClick={() => navigate('/app/courses')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {!coursesData?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">No courses enrolled</p>
          ) : (
            <div className="space-y-2">
              {coursesData.slice(0, 4).map((course: any) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/app/courses/${course.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{course.name}</p>
                    <p className="text-xs text-slate-400">{course.code} · {course._count.members} students</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
