import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import Logo from '../../components/layout/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-red-500 mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              leftIcon={<Lock size={16} />}
              hint="Must be 8+ characters with uppercase and number"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              leftIcon={<Lock size={16} />}
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
