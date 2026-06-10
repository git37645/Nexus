import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { User } from '../../types'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { getFullName, formatDate, getRoleColor, getStatusColor } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [newRole, setNewRole] = useState('')
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)
      return (await api.get(`/admin/users?${params}`)).data.data
    },
  })

  const setStatus = useMutation({
    mutationFn: () => api.patch(`/admin/users/${selectedUser!.id}/status`, { status: newStatus, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
      toast.success('User status updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const setRole = useMutation({
    mutationFn: () => api.patch(`/admin/users/${selectedUser!.id}/role`, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
      toast.success('User role updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const users: User[] = data?.users ?? []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input-base w-40 py-2"
        >
          <option value="">All roles</option>
          {['STUDENT', 'TEACHER', 'ADMIN', 'SUPERADMIN'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-base w-44 py-2"
        >
          <option value="">All statuses</option>
          {['ACTIVE', 'FROZEN', 'BLOCKED', 'PENDING_VERIFICATION'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.profile?.avatarUrl} firstName={u.profile?.firstName} lastName={u.profile?.lastName} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{getFullName(u.profile)}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getRoleColor(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(u.status)}`}>{u.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedUser(u)
                        setNewStatus(u.status)
                        setNewRole(u.role)
                        setReason('')
                      }}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-400">No users found.</div>
          )}
        </div>
      )}

      {/* Manage User Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Manage User" size="md">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-700 rounded-xl">
              <Avatar src={selectedUser.profile?.avatarUrl} firstName={selectedUser.profile?.firstName} lastName={selectedUser.profile?.lastName} size="md" />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{getFullName(selectedUser.profile)}</p>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Change Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-base">
                {['ACTIVE', 'FROZEN', 'BLOCKED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                label="Reason (optional)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for this action"
              />
              <Button
                className="w-full"
                variant={newStatus === 'BLOCKED' ? 'danger' : 'primary'}
                onClick={() => setStatus.mutate()}
                isLoading={setStatus.isPending}
                disabled={newStatus === selectedUser.status}
              >
                Update Status
              </Button>
            </div>

            {isSuperAdmin && (
              <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Change Role</h3>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-base">
                  {['STUDENT', 'TEACHER', 'ADMIN', 'SUPERADMIN'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setRole.mutate()}
                  isLoading={setRole.isPending}
                  disabled={newRole === selectedUser.role}
                >
                  Update Role
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
