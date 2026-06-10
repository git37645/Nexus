import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../components/layout/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const schema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password required'),
  totpCode: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { identifier: data.identifier, password: data.password, totpCode: data.totpCode })
      const result = res.data

      if (result.requiresTwoFactor) {
        setRequires2FA(true)
        setIsLoading(false)
        return
      }

      setAuth(result.user, result.accessToken, result.refreshToken)
      navigate('/app/feed')
      toast.success(`${t('auth.welcomeBack')}, ${result.user.profile?.firstName ?? 'User'}!`)
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
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.welcomeBack')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t('auth.emailOrUsername')}
              type="text"
              placeholder={t('auth.emailOrUsernamePlaceholder')}
              leftIcon={<Mail size={16} />}
              error={errors.identifier?.message}
              {...register('identifier')}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {requires2FA && (
              <Input
                label={t('auth.twoFactor')}
                type="text"
                placeholder={t('auth.twoFactorPlaceholder')}
                maxLength={6}
                error={errors.totpCode?.message}
                {...register('totpCode')}
              />
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('auth.forgotPassword')}
            </Link>
            <p className="text-sm text-slate-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.register')}
              </Link>
            </p>
          </div>

          <div className="mt-5 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}
