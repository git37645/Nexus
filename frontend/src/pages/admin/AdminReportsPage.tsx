import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { Report } from '../../types'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { getFullName, formatDate } from '../../lib/utils'

export default function AdminReportsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [selected, setSelected] = useState<Report | null>(null)
  const [newStatus, setNewStatus] = useState('RESOLVED')
  const [actionTaken, setActionTaken] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      return (await api.get(`/admin/reports${params}`)).data.data
    },
  })

  const review = useMutation({
    mutationFn: () => api.patch(`/admin/reports/${selected!.id}`, { status: newStatus, actionTaken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      setSelected(null)
      toast.success('Report reviewed')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reports: Report[] = data?.reports ?? []

  const statusVariant = (s: string) => {
    if (s === 'PENDING') return 'warning'
    if (s === 'UNDER_REVIEW') return 'info'
    if (s === 'RESOLVED') return 'success'
    return 'default'
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Reports</h1>
      <p className="text-sm text-slate-500 mb-6">Review content reported by users. Private messages are not accessible.</p>

      <div className="flex gap-2 mb-5">
        {['', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="danger">{report.reportType.replace(/_/g, ' ')}</Badge>
                    <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(report.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <span className="font-medium">Reporter:</span>
                    <Avatar src={report.reporter?.profile?.avatarUrl} firstName={report.reporter?.profile?.firstName} lastName={report.reporter?.profile?.lastName} size="xs" />
                    <span>{getFullName(report.reporter?.profile)}</span>
                  </div>

                  {report.targetUser && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <span className="font-medium">Reported user:</span>
                      <Avatar src={report.targetUser?.profile?.avatarUrl} firstName={report.targetUser?.profile?.firstName} lastName={report.targetUser?.profile?.lastName} size="xs" />
                      <span>{getFullName(report.targetUser?.profile)}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mb-2">
                    <span className="font-medium">Content:</span> {report.contentType} #{report.contentId.slice(0, 8)}
                  </div>

                  {report.description && (
                    <p className="text-sm text-slate-600 bg-slate-50 dark:bg-surface-700 rounded-lg p-2">{report.description}</p>
                  )}
                </div>

                {report.status === 'PENDING' || report.status === 'UNDER_REVIEW' ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelected(report)
                      setNewStatus('RESOLVED')
                      setActionTaken('')
                    }}
                  >
                    Review
                  </Button>
                ) : (
                  <div className="text-xs text-slate-400 text-right">
                    {report.actionTaken && <p>{report.actionTaken}</p>}
                    <p>Reviewed by {getFullName(report.reviewedBy?.profile)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Report" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
              <p><strong>Type:</strong> {selected.reportType.replace(/_/g, ' ')}</p>
              <p className="mt-1"><strong>Content:</strong> {selected.contentType} #{selected.contentId.slice(0, 8)}</p>
              {selected.description && <p className="mt-1"><strong>Details:</strong> {selected.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-base">
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Action Taken (optional)</label>
              <textarea
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
                rows={2}
                placeholder="Describe action taken (e.g., content removed, user warned)..."
                className="input-base resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={() => review.mutate()} isLoading={review.isPending}>Submit Review</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
