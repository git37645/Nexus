import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import Logo from '../../components/layout/Logo'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing verification token.')
      return
    }
    api.post('/auth/verify-email', { token })
      .then(res => {
        setStatus('success')
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message ?? 'Verification failed. The link may have expired.')
      })
  }, [token])

  const handleResend = async () => {
    if (!resendEmail) { toast.error('Please enter your email address.'); return }
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: resendEmail })
      setResent(true)
      toast.success('A new verification link has been sent!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
        </div>
        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-slate-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Email Verified!</h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <Link to="/login" className="btn-primary">Sign In</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Verification Failed</h2>
              <p className="text-slate-500 mb-6">{message}</p>

              {resent ? (
                <p className="text-emerald-600 text-sm font-medium mb-4">
                  ✓ New verification link sent — check your email.
                </p>
              ) : (
                <div className="space-y-3 text-left mb-4">
                  <p className="text-sm text-slate-500 text-center">
                    Need a new link? Enter your email below:
                  </p>
                  <Input
                    type="email"
                    placeholder="you@university.edu"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={handleResend}
                    isLoading={resending}
                  >
                    <RefreshCw size={15} />
                    Resend verification email
                  </Button>
                </div>
              )}

              <Link to="/register" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Back to registration
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
