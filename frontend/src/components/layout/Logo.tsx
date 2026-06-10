import { cn } from '../../lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
}

export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { icon, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nexus logo"
      >
        <rect width="40" height="40" rx="10" fill="#2563EB" />
        {/* Left vertical bar of N */}
        <line x1="11" y1="10" x2="11" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        {/* Right vertical bar of N */}
        <line x1="29" y1="10" x2="29" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        {/* Diagonal bar of N */}
        <line x1="11" y1="10" x2="29" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        {/* Network nodes */}
        <circle cx="11" cy="10" r="3.5" fill="#7C3AED" />
        <circle cx="29" cy="10" r="3.5" fill="#7C3AED" />
        <circle cx="11" cy="30" r="3.5" fill="#A78BFA" />
        <circle cx="29" cy="30" r="3.5" fill="#A78BFA" />
      </svg>

      {showText && (
        <span className={cn('font-bold tracking-tight text-slate-900 dark:text-white', text)}>
          Nexus
        </span>
      )}
    </div>
  )
}
