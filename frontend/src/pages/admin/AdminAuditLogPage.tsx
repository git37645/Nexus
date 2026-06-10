import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { api } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import { getFullName, formatDate } from '../../lib/utils'

export default function AdminAuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: async () => (await api.get('/admin/audit-log')).data.data,
    refetchInterval: 30000,
  })

  const logs = data?.logs ?? []

  const actionColor = (action: string) => {
    if (action.includes('BLOCK')) return 'text-red-600'
    if (action.includes('ROLE')) return 'text-violet-600'
    if (action.includes('REPORT')) return 'text-amber-600'
    if (action.includes('FREEZE') || action.includes('FROZEN')) return 'text-orange-600'
    if (action.includes('ACTIVE')) return 'text-emerald-600'
    return 'text-slate-600'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">All administrator actions are recorded here for accountability.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No audit logs yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Admin', 'Action', 'Target', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={log.admin?.profile?.avatarUrl} firstName={log.admin?.profile?.firstName} lastName={log.admin?.profile?.lastName} size="xs" />
                      <span className="text-slate-700 dark:text-slate-300">{getFullName(log.admin?.profile)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-semibold ${actionColor(log.action)}`}>{log.action}</span>
                    {log.details && (
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{JSON.stringify(log.details)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.targetUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar src={log.targetUser?.profile?.avatarUrl} firstName={log.targetUser?.profile?.firstName} lastName={log.targetUser?.profile?.lastName} size="xs" />
                        <span className="text-slate-600 dark:text-slate-400">{getFullName(log.targetUser?.profile)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
