import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, Paperclip } from 'lucide-react'
import { api } from '../../lib/api'
import { Lecture } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { formatDate, formatFileSize } from '../../lib/utils'

export default function LecturesPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const { data: lectures, isLoading } = useQuery<Lecture[]>({
    queryKey: ['lectures', courseId],
    queryFn: async () => (await api.get(`/courses/${courseId}/lectures`)).data.data,
    enabled: !!courseId,
  })

  return (
    <div className="page-container">
      <button onClick={() => navigate(`/app/courses/${courseId}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} />
        Back to Course
      </button>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Lectures</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !lectures?.length ? (
        <div className="card p-12 text-center">
          <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No lectures published yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lectures.map(lecture => (
            <div key={lecture.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-600">{lecture.order + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{lecture.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(lecture.createdAt)}</span>
                  </div>
                  {lecture.description && (
                    <p className="text-sm text-slate-500 mt-1">{lecture.description}</p>
                  )}
                  {lecture.content && (
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-surface-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {lecture.content}
                    </div>
                  )}
                  {lecture.attachments?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Paperclip size={10} />
                        Attachments ({lecture.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lecture.attachments.map(att => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-colors"
                          >
                            <Paperclip size={12} />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
