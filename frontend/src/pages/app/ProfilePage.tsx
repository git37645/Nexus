import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getFullName, formatDate, getRoleColor } from '../../lib/utils'
import { MessageSquare } from 'lucide-react'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const isOwn = userId === me?.id

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const endpoint = isOwn ? '/users/me' : `/users/${userId}`
      return (await api.get(endpoint)).data.data
    },
    enabled: !!userId,
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!userData) return null

  const profile = userData.profile

  return (
    <div className="page-container max-w-2xl">
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar
            src={profile?.avatarUrl}
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            size="xl"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{getFullName(profile)}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{userData.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`badge ${getRoleColor(userData.role)}`}>{userData.role}</span>
              {profile?.faculty && <span className="text-xs text-slate-400">{profile.faculty}</span>}
              {profile?.group && <Badge variant="default">{profile.group}</Badge>}
            </div>
            {profile?.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{profile.bio}</p>
            )}
          </div>
          {!isOwn && (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const res = await api.post('/chats/private', { userId })
                navigate(`/app/messages/${res.data.data.id}`)
              }}
            >
              <MessageSquare size={14} />
              Message
            </Button>
          )}
          {isOwn && (
            <Button size="sm" variant="secondary" onClick={() => navigate('/app/settings')}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Details</h2>
        <dl className="space-y-3">
          {[
            { label: 'Faculty', value: profile?.faculty },
            { label: 'Department', value: profile?.department },
            { label: 'Group', value: profile?.group },
            { label: 'Student ID', value: profile?.studentId },
            { label: 'Joined', value: formatDate(userData.createdAt) },
          ].filter(d => d.value).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="text-sm text-slate-400">{label}</dt>
              <dd className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
