import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { api, getErrorMessage } from '../../lib/api'
import Logo from '../../components/layout/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.forgotPasswordTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.forgotPasswordSubtitle')}</p>
        </div>

        <div className="card p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('auth.resetLinkSent')}</h3>
              <p className="text-slate-500 text-sm">{t('auth.resetLinkSentMsg')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                leftIcon={<Mail size={16} />}
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('auth.sendResetLink')}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium">
              <ArrowLeft size={14} />
              {t('auth.backToLogin')}
            </Link>
          </div>

          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}
