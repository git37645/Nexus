import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, updateUser, logout } = useAuthStore()

  const fetchMe = async () => {
    try {
      const response = await api.get('/users/me')
      updateUser(response.data.data)
    } catch {
      logout()
    }
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isStudent,
    setAuth,
    updateUser,
    logout,
    fetchMe,
  }
}
