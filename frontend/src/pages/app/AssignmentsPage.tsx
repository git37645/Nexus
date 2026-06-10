import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ClipboardList, Calendar, Award } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { formatDeadline, getAssignmentStatusColor } from '../../lib/utils'

export default function AssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => (await api.get(`/assignments/courses/${courseId}/assignments`)).data.data,
    enabled: !!courseId,
  })

  return (
    <div className="page-container">
      <button onClick={() => navigate(`/app/courses/${courseId}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} />
        Back to Course
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Assignments</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !assignments?.length ? (
        <div className="card p-12 text-center">
          <ClipboardList size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a: any) => {
            const sub = a.submissions?.[0]
            const status = sub?.status ?? 'NOT_SUBMITTED'
            const isOverdue = new Date(a.deadline) < new Date() && status === 'NOT_SUBMITTED'
            const effectiveStatus = isOverdue ? 'LATE' : status

            return (
              <button
                key={a.id}
                onClick={() => navigate(`/app/assignments/${a.id}`)}
                className="card p-5 w-full text-left hover:shadow-soft hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                    {a.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <span className={`badge ${getAssignmentStatusColor(effectiveStatus)}`}>
                    {effectiveStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    Due {formatDeadline(a.deadline)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Award size={12} />
                    {a.maxScore} points
                  </span>
                  {sub?.grade && (
                    <span className="ml-auto text-sm font-bold text-emerald-600">
                      {sub.grade.score}/{a.maxScore}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
