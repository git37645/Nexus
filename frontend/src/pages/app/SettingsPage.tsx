import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import { getFullName } from '../../lib/utils'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const [profile, setProfile] = useState({
    firstName: user?.profile?.firstName ?? '',
    lastName: user?.profile?.lastName ?? '',
    bio: user?.profile?.bio ?? '',
    faculty: user?.profile?.faculty ?? '',
    department: user?.profile?.department ?? '',
    group: user?.profile?.group ?? '',
  })

  const [twoFAData, setTwoFAData] = useState<{ qrCodeUrl: string; secret: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')

  const updateProfile = useMutation({
    mutationFn: () => api.patch('/users/me', profile),
    onSuccess: (res) => {
      updateUser({ profile: res.data.data })
      toast.success('Profile updated!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const setup2FA = useMutation({
    mutationFn: () => api.post('/auth/2fa/setup'),
    onSuccess: (res) => setTwoFAData(res.data.data),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const enable2FA = useMutation({
    mutationFn: () => api.post('/auth/2fa/enable', { totpCode }),
    onSuccess: () => {
      setTwoFAData(null)
      setTotpCode('')
      toast.success('Two-factor authentication enabled!')
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser({ profile: { ...user?.profile!, avatarUrl: res.data.data.avatarUrl } })
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h1>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            src={user?.profile?.avatarUrl}
            firstName={user?.profile?.firstName}
            lastName={user?.profile?.lastName}
            size="xl"
          />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{getFullName(user?.profile)}</p>
            <label className="mt-2 cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
            />
            <Input
              label="Last Name"
              value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              maxLength={300}
              className="input-base resize-none"
              placeholder="Tell the university about yourself..."
            />
          </div>
          <Input
            label="Faculty"
            value={profile.faculty}
            onChange={e => setProfile(p => ({ ...p, faculty: e.target.value }))}
          />
          <Input
            label="Group"
            value={profile.group}
            onChange={e => setProfile(p => ({ ...p, group: e.target.value }))}
          />
          <Button
            onClick={() => updateProfile.mutate()}
            isLoading={updateProfile.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* 2FA */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Two-Factor Authentication</h2>
            <p className="text-xs text-slate-400">
              {user?.twoFactorSecret?.isEnabled ? 'Enabled' : 'Not enabled'}
            </p>
          </div>
        </div>

        {user?.twoFactorSecret?.isEnabled ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
            <Shield size={16} />
            Two-factor authentication is active on your account.
          </div>
        ) : twoFAData ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-3">Scan this QR code with your authenticator app:</p>
              <img src={twoFAData.qrCodeUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-xl" />
              <p className="text-xs text-slate-400 mt-2 font-mono break-all">{twoFAData.secret}</p>
            </div>
            <Input
              label="Verification Code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              className="text-center tracking-widest font-mono"
            />
            <Button
              onClick={() => enable2FA.mutate()}
              isLoading={enable2FA.isPending}
              disabled={totpCode.length !== 6}
              className="w-full"
            >
              Enable 2FA
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setup2FA.mutate()}
            isLoading={setup2FA.isPending}
          >
            Set Up Two-Factor Authentication
          </Button>
        )}
      </div>
    </div>
  )
}
