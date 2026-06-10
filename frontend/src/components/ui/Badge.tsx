import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const variants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
}

export default function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
