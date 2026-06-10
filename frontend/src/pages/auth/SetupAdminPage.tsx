import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const schema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

interface TokenInfo {
  email: string
  username: string
}

export default function SetupAdminPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [checkingToken, setCheckingToken] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!token) {
      setTokenError(t('auth.setupLinkInvalid'))
      setCheckingToken(false)
      return
    }
    api
      .get<{ email: string; username: string }>(`/auth/setup-admin/check?token=${encodeURIComponent(token)}`)
      .then((res: { data: TokenInfo }) => {
        setTokenInfo(res.data)
      })
      .catch(() => {
        setTokenError(t('auth.setupLinkInvalid'))
      })
      .finally(() => setCheckingToken(false))
  }, [token, t])

  const onSubmit = async (data: FormData) => {
    await api.post('/auth/setup-admin', { token, password: data.password, confirmPassword: data.confirmPassword })
    setDone(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Nexus</h1>
                <p className="text-xs text-slate-500">{t('nav.universityPlatform')}</p>
              </div>
            </div>
            <LanguageSwitcher compact />
          </div>

          {tokenError ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('errors.invalidToken')}
              </h2>
              <p className="text-sm text-slate-500">{tokenError}</p>
            </div>
          ) : done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('auth.setupSuccess')}
              </h2>
              <p className="text-sm text-slate-500">{t('auth.setupSuccessMsg')}</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {t('auth.setupAdminTitle')}
                </h2>
                <p className="text-sm text-slate-500">{t('auth.setupAdminSubtitle')}</p>
              </div>

              {tokenInfo && (
                <div className="bg-slate-50 dark:bg-surface-700 rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('auth.adminEmail')}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{tokenInfo.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('auth.adminUsername')}</span>
                    <span className="font-medium text-slate-900 dark:text-white">@{tokenInfo.username}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.newPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-slate-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{t('errors.passwordWeak')}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{t('auth.passwordHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-slate-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{t('errors.passwordsMismatch')}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors mt-2"
                >
                  {isSubmitting ? t('common.loading') : t('auth.setupPasswordBtn')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
