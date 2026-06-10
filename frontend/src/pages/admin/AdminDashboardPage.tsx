import { useQuery } from '@tanstack/react-query'
import { Users, MessageSquare, FileText, Flag, GraduationCap, Activity } from 'lucide-react'
import { api } from '../../lib/api'
import Spinner from '../../components/ui/Spinner'

interface Stats {
  totalUsers: number
  activeUsers: number
  byRole: { students: number; teachers: number; admins: number }
  totalPosts: number
  totalCourses: number
  pendingReports: number
  totalReports: number
  totalMessages: number
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin', 'statistics'],
    queryFn: async () => (await api.get('/admin/statistics')).data.data,
    refetchInterval: 60000,
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!stats) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform statistics and health</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.activeUsers} active (30d)`} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Activity} label="Posts" value={stats.totalPosts} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={GraduationCap} label="Active Courses" value={stats.totalCourses} color="bg-violet-50 text-violet-600" />
        <StatCard icon={Flag} label="Pending Reports" value={stats.pendingReports} sub={`${stats.totalReports} total`} color={stats.pendingReports > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'} />
        <StatCard icon={MessageSquare} label="Messages Sent" value={stats.totalMessages} color="bg-cyan-50 text-cyan-600" />
        <StatCard icon={Users} label="Students" value={stats.byRole.students} color="bg-blue-50 text-blue-500" />
        <StatCard icon={Users} label="Teachers" value={stats.byRole.teachers} color="bg-emerald-50 text-emerald-500" />
        <StatCard icon={Users} label="Admins" value={stats.byRole.admins} color="bg-violet-50 text-violet-500" />
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Security Notice</h2>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <span className="text-blue-600 mt-0.5">ℹ️</span>
            <p>Administrators can only view content that has been reported. Private messages are never visible to admins.</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl">
            <span className="text-amber-600 mt-0.5">⚠️</span>
            <p>All administrator actions are logged in the audit trail for accountability and compliance.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
