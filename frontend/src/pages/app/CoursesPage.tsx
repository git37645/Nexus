import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Plus, Users, BookOpen, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Course } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import { getFullName } from '../../lib/utils'

export default function CoursesPage() {
  const { user, isTeacher, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', semester: '', year: new Date().getFullYear() })

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data.data,
  })

  const createCourse = useMutation({
    mutationFn: () => api.post('/courses', form),
    onSuccess: () => {
      setShowCreate(false)
      setForm({ name: '', code: '', description: '', semester: '', year: new Date().getFullYear() })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course created!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Courses</h1>
        {(isTeacher || isAdmin) && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Create Course
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !courses?.length ? (
        <div className="card p-12 text-center">
          <GraduationCap size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">
            {isTeacher ? 'Create your first course to get started.' : 'No courses yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/app/courses/${course.id}`)}
              className="card p-5 text-left hover:shadow-soft hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap size={20} className="text-violet-600" />
              </div>

              <div className="mb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{course.name}</h3>
                  <Badge variant="primary" className="shrink-0 text-xs">{course.code}</Badge>
                </div>
                {course.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 mb-3">
                <Avatar
                  src={course.teacher?.profile?.avatarUrl}
                  firstName={course.teacher?.profile?.firstName}
                  lastName={course.teacher?.profile?.lastName}
                  size="xs"
                />
                <span className="text-xs text-slate-500">{getFullName(course.teacher?.profile)}</span>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Users size={12} />
                  {course._count.members}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <BookOpen size={12} />
                  {course._count.lectures}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <ClipboardList size={12} />
                  {course._count.assignments}
                </span>
                {course.semester && (
                  <span className="ml-auto text-xs text-slate-300">{course.semester} {course.year}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Course" size="md">
        <div className="space-y-4">
          <Input
            label="Course Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Advanced Web Development"
          />
          <Input
            label="Course Code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="CS401"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Course description..."
              className="input-base resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester"
              value={form.semester}
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              placeholder="Fall / Spring"
            />
            <Input
              label="Year"
              type="number"
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createCourse.mutate()} isLoading={createCourse.isPending}
              disabled={!form.name || !form.code}>
              Create Course
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
