import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, ClipboardList, Users, GraduationCap } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { getFullName } from '../../lib/utils'

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => (await api.get(`/courses/${courseId}`)).data.data,
    enabled: !!courseId,
  })

  const { data: lectures } = useQuery({
    queryKey: ['lectures', courseId],
    queryFn: async () => (await api.get(`/courses/${courseId}/lectures`)).data.data,
    enabled: !!courseId,
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => (await api.get(`/assignments/courses/${courseId}/assignments`)).data.data,
    enabled: !!courseId,
  })

  if (isLoading) return (
    <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  )

  if (!courseData) return (
    <div className="page-container text-center py-16">
      <p className="text-slate-400">Course not found.</p>
    </div>
  )

  const isTeacher = courseData.teacherId === user?.id

  return (
    <div className="page-container">
      <button onClick={() => navigate('/app/courses')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} />
        Back to Courses
      </button>

      {/* Course Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center shrink-0">
            <GraduationCap size={28} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{courseData.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary">{courseData.code}</Badge>
                  {courseData.semester && (
                    <span className="text-xs text-slate-400">{courseData.semester} {courseData.year}</span>
                  )}
                </div>
              </div>
            </div>
            {courseData.description && (
              <p className="text-sm text-slate-500 mt-2">{courseData.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Avatar
                src={courseData.teacher?.profile?.avatarUrl}
                firstName={courseData.teacher?.profile?.firstName}
                lastName={courseData.teacher?.profile?.lastName}
                size="xs"
              />
              <span className="text-xs text-slate-500">{getFullName(courseData.teacher?.profile)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-5 pt-4 border-t border-slate-50 dark:border-slate-700/50">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{courseData._count.members}</p>
            <p className="text-xs text-slate-400">Students</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{courseData._count.lectures}</p>
            <p className="text-xs text-slate-400">Lectures</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{courseData._count.assignments}</p>
            <p className="text-xs text-slate-400">Assignments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lectures */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={14} />
              Lectures
            </h2>
            <Link to={`/app/courses/${courseId}/assignments`} className="text-xs text-primary-600">
              View all →
            </Link>
          </div>
          {!lectures?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">No lectures yet</p>
          ) : (
            <div className="space-y-2">
              {lectures.slice(0, 5).map((lecture: any) => (
                <div key={lecture.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700 cursor-pointer">
                  <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-600">{lecture.order + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{lecture.title}</p>
                    <p className="text-xs text-slate-400 truncate">{lecture.description}</p>
                  </div>
                  {lecture.attachments?.length > 0 && (
                    <span className="text-xs text-slate-300">{lecture.attachments.length} files</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <ClipboardList size={14} />
              Assignments
            </h2>
            <Link to={`/app/courses/${courseId}/assignments`} className="text-xs text-primary-600">
              View all →
            </Link>
          </div>
          {!assignments?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">No assignments yet</p>
          ) : (
            <div className="space-y-2">
              {assignments.slice(0, 5).map((a: any) => {
                const sub = a.submissions?.[0]
                const isLate = new Date(a.deadline) < new Date() && (!sub || sub.status === 'NOT_SUBMITTED')
                return (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/app/assignments/${a.id}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700 text-left"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isLate ? 'bg-red-400' : sub?.status === 'GRADED' ? 'bg-emerald-400' : sub?.status === 'SUBMITTED' ? 'bg-blue-400' : 'bg-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">Due {new Date(a.deadline).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-slate-400">{a.maxScore} pts</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-4">
            <Users size={14} />
            Members ({courseData.members?.length ?? 0})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {courseData.members?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar
                  src={m.user?.profile?.avatarUrl}
                  firstName={m.user?.profile?.firstName}
                  lastName={m.user?.profile?.lastName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{getFullName(m.user?.profile)}</p>
                  <p className="text-xs text-slate-400">{m.user?.profile?.group}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
