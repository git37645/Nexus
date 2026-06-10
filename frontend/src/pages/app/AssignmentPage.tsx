import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, Calendar, Award, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import { formatDeadline, getAssignmentStatusColor, getFullName, formatFileSize } from '../../lib/utils'

export default function AssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { user, isTeacher } = useAuth()
  const queryClient = useQueryClient()
  const [submissionText, setSubmissionText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: string; feedback: string }>>({})

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => (await api.get(`/assignments/${assignmentId}`)).data.data,
    enabled: !!assignmentId,
  })

  const { data: submissionsData } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => (await api.get(`/assignments/${assignmentId}/submissions`)).data.data,
    enabled: !!assignmentId && isTeacher,
  })

  const submitAssignment = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (submissionText) fd.append('content', submissionText)
      files.forEach(f => fd.append('files', f))
      return api.post(`/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      setSubmissionText('')
      setFiles([])
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      toast.success('Assignment submitted!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const gradeSubmission = useMutation({
    mutationFn: ({ submissionId, score, feedback }: any) =>
      api.patch(`/assignments/submissions/${submissionId}/grade`, { score: parseFloat(score), feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] })
      toast.success('Grade saved!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!assignment) return null

  const mySubmission = assignment.submissions?.[0]
  const isOverdue = new Date(assignment.deadline) < new Date()
  const canSubmit = !isOverdue || assignment.allowResubmit || !mySubmission

  return (
    <div className="page-container max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Assignment Details */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{assignment.title}</h1>
          {mySubmission && (
            <span className={`badge ${getAssignmentStatusColor(mySubmission.status)}`}>
              {mySubmission.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {assignment.description && (
          <p className="text-slate-600 dark:text-slate-400 mb-4">{assignment.description}</p>
        )}

        {assignment.instructions && (
          <div className="bg-slate-50 dark:bg-surface-700 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Instructions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            Due {formatDeadline(assignment.deadline)}
            {isOverdue && <Badge variant="danger" className="ml-1">Overdue</Badge>}
          </span>
          <span className="flex items-center gap-1.5">
            <Award size={14} />
            {assignment.maxScore} points
          </span>
          {assignment.allowResubmit && (
            <Badge variant="success">Resubmission allowed</Badge>
          )}
        </div>
      </div>

      {/* My Submission */}
      {!isTeacher && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">My Submission</h2>

          {mySubmission?.grade && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-700">Grade: {mySubmission.grade.score}/{assignment.maxScore}</span>
                <span className="text-xs text-emerald-600">{Math.round(mySubmission.grade.score / assignment.maxScore * 100)}%</span>
              </div>
              {mySubmission.grade.feedback && (
                <p className="text-sm text-emerald-600 mt-2">{mySubmission.grade.feedback}</p>
              )}
            </div>
          )}

          {mySubmission?.files?.map((f: any) => (
            <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg mb-2 hover:bg-slate-100 transition-colors">
              <FileText size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">{f.fileName}</span>
              <span className="text-xs text-slate-400 ml-auto">{formatFileSize(f.fileSize)}</span>
            </a>
          ))}

          {(canSubmit) && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Response (optional)</label>
                <textarea
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  rows={4}
                  placeholder="Write your answer here..."
                  className="input-base resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Files</label>
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500">Click to upload files</span>
                  <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files ?? []))} />
                </label>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText size={12} />
                        {f.name}
                        <span className="text-slate-400">({formatFileSize(f.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => submitAssignment.mutate()}
                isLoading={submitAssignment.isPending}
                disabled={!submissionText.trim() && files.length === 0}
                className="w-full"
              >
                Submit Assignment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Teacher: Submissions List */}
      {isTeacher && submissionsData && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Submissions ({submissionsData.length})
          </h2>
          {submissionsData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissionsData.map((sub: any) => {
                const gi = gradeInputs[sub.id] ?? { score: sub.grade?.score?.toString() ?? '', feedback: sub.grade?.feedback ?? '' }
                return (
                  <div key={sub.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={sub.student?.profile?.avatarUrl}
                        firstName={sub.student?.profile?.firstName}
                        lastName={sub.student?.profile?.lastName}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{getFullName(sub.student?.profile)}</p>
                        <p className="text-xs text-slate-400">
                          {sub.submittedAt ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString()}` : 'Not submitted'}
                        </p>
                      </div>
                      <span className={`badge ml-auto ${getAssignmentStatusColor(sub.status)}`}>{sub.status.replace(/_/g, ' ')}</span>
                    </div>

                    {sub.content && <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg">{sub.content}</p>}

                    {sub.files?.map((f: any) => (
                      <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-primary-600 hover:underline mb-1">
                        <FileText size={12} /> {f.fileName}
                      </a>
                    ))}

                    <div className="flex gap-2 mt-3">
                      <input
                        type="number"
                        value={gi.score}
                        onChange={e => setGradeInputs(prev => ({ ...prev, [sub.id]: { ...gi, score: e.target.value } }))}
                        placeholder="Score"
                        min="0"
                        max={assignment.maxScore}
                        className="input-base w-24 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={gi.feedback}
                        onChange={e => setGradeInputs(prev => ({ ...prev, [sub.id]: { ...gi, feedback: e.target.value } }))}
                        placeholder="Feedback (optional)"
                        className="input-base flex-1 py-2 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => gradeSubmission.mutate({ submissionId: sub.id, ...gi })}
                        disabled={!gi.score}
                      >
                        {sub.grade ? 'Update' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
