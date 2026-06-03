import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',       flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',      flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',       flag: '🇧🇩' },
  { code: 'mr', label: 'मराठी',       flag: '🇮🇳' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="relative group px-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        <Globe className="w-3 h-3" />
        <span>Language</span>
      </div>
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-primary-500/50 cursor-pointer"
      >
        {LANGUAGES.map(({ code, label, flag }) => (
          <option key={code} value={code}>{flag} {label}</option>
        ))}
      </select>
    </div>
  )
}
