import { cn } from '../../lib/utils'
import { getInitials } from '../../lib/utils'

interface AvatarProps {
  src?: string | null
  firstName?: string
  lastName?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const onlineSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

export default function Avatar({ src, firstName, lastName, size = 'md', className, online }: AvatarProps) {
  const initials = getInitials(firstName, lastName)

  const avatarColors = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  const colorIndex = (firstName?.charCodeAt(0) ?? 0) % avatarColors.length
  const colorClass = avatarColors[colorIndex]

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={`${firstName ?? ''} ${lastName ?? ''}`.trim()}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div className={cn('rounded-full flex items-center justify-center font-semibold', sizes[size], colorClass)}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-surface-800',
            onlineSizes[size],
            online ? 'bg-emerald-400' : 'bg-slate-300'
          )}
        />
      )}
    </div>
  )
}
