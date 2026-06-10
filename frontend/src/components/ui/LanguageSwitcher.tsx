import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'uk', label: 'UK', flag: '🇺🇦' },
  { code: 'sk', label: 'SK', flag: '🇸🇰' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
]

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2) ?? 'uk'

  const change = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('nexus_language', code)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => change(lang.code)}
            title={lang.label}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              current === lang.code
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-700'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={14} className="text-slate-400" />
      <div className="flex items-center gap-1">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => change(lang.code)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              current === lang.code
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
