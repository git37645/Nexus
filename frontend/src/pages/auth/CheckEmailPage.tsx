import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { api, getErrorMessage } from '../../lib/api'
import Logo from '../../components/layout/Logo'
import Button from '../../components/ui/Button'

export default function CheckEmailPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const email: string = location.state?.email ?? ''
  const devVerifyLink: string | null = location.state?.devVerifyLink ?? null

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!email) { toast.error('No email address found. Please register again.'); return }
    setResending(true)
    try {
      const res = await api.post('/auth/resend-verification', { email })
      setResent(true)
      toast.success(t('auth.verificationSent'))
      if (res.data.devVerifyLink) {
        console.info('[DEV] New verification link:', res.data.devVerifyLink)
      }
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
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-primary-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">{t('auth.checkEmail')}</h1>
          <p className="text-slate-500 text-sm mb-1">{t('auth.checkEmailMsg')}</p>
          {email && (
            <p className="font-semibold text-slate-800 mb-4 break-all">{email}</p>
          )}
          <p className="text-slate-400 text-xs mb-6">{t('auth.checkEmailInstruction')}</p>

          {devVerifyLink && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ {t('auth.devModeNotice')}</p>
              <p className="text-xs text-amber-600 mb-2">{t('auth.devModeMsg')}</p>
              <a
                href={devVerifyLink}
                className="text-xs text-primary-600 hover:underline break-all"
              >
                {devVerifyLink}
              </a>
            </div>
          )}

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm mb-4">
              <CheckCircle size={16} />
              <span>{t('auth.verificationSent')}</span>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full mb-3"
              onClick={handleResend}
              isLoading={resending}
            >
              <RefreshCw size={15} />
              {t('auth.resendVerification')}
            </Button>
          )}

          <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
