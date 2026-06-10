import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: '',
  lg: 'text-base px-6 py-3',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
