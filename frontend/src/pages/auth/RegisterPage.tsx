import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { api, getErrorMessage } from '../../lib/api'
import Logo from '../../components/layout/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  faculty: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...payload } = data
      const res = await api.post('/auth/register', payload)
      navigate('/check-email', {
        state: {
          email: data.email,
          devVerifyLink: res.data.devVerifyLink ?? null,
        },
      })
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
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.createAccount')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.joinNetwork')}</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.firstName')}
                placeholder="Jane"
                leftIcon={<User size={16} />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label={t('auth.lastName')}
                placeholder="Smith"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('auth.faculty')}
              placeholder={t('auth.facultyPlaceholder')}
              error={errors.faculty?.message}
              {...register('faculty')}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              hint={t('auth.passwordHint')}
              {...register('password')}
            />

            <Input
              label={t('auth.confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              {t('auth.createAccount')}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.signIn')}
            </Link>
          </p>

          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}
