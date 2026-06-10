import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../components/layout/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const { user, setAuth } = useAuth()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const pendingData = sessionStorage.getItem('pending_login')
      if (!pendingData) {
        navigate('/login')
        return
      }
      const { email, password } = JSON.parse(pendingData)
      const res = await api.post('/auth/login', { email, password, totpCode: code })
      sessionStorage.removeItem('pending_login')
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      navigate('/app/feed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Two-Factor Auth</h1>
          <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Authentication Code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
            />
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={code.length !== 6}>
              Verify
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
