import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import CheckEmailPage from './pages/auth/CheckEmailPage'
import SetupAdminPage from './pages/auth/SetupAdminPage'
import TwoFactorPage from './pages/auth/TwoFactorPage'

import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/app/DashboardPage'
import FeedPage from './pages/app/FeedPage'
import MessagesPage from './pages/app/MessagesPage'
import ChatPage from './pages/app/ChatPage'
import ProfilePage from './pages/app/ProfilePage'
import CoursesPage from './pages/app/CoursesPage'
import CoursePage from './pages/app/CoursePage'
import AssignmentsPage from './pages/app/AssignmentsPage'
import AssignmentPage from './pages/app/AssignmentPage'
import NotificationsPage from './pages/app/NotificationsPage'
import SettingsPage from './pages/app/SettingsPage'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const accessToken = useAuthStore(s => s.accessToken)

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      const refresh = localStorage.getItem('refreshToken')
      if (refresh) {
        const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
      fetch(`${apiBase}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.accessToken) {
              useAuthStore.getState().setAccessToken(data.accessToken)
              localStorage.setItem('refreshToken', data.refreshToken)
            }
          })
          .catch(() => useAuthStore.getState().logout())
      }
    }
  }, [isAuthenticated, accessToken])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return <Navigate to="/app/feed" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/app/feed" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/setup-admin" element={<SetupAdminPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />

        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:chatId" element={<ChatPage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId" element={<CoursePage />} />
          <Route path="courses/:courseId/assignments" element={<AssignmentsPage />} />
          <Route path="assignments/:assignmentId" element={<AssignmentPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/app/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="audit-log" element={<AdminAuditLogPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
