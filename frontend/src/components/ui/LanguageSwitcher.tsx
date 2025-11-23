import { Globe } from 'lucide-react'
import { useI18nStore } from '../../store/i18nStore'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18nStore()

  const toggleLanguage = () => {
    setLanguage(language === 'fa' ? 'en' : 'fa')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
      title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
    >
      <Globe className="w-5 h-5" />
      <span className="font-medium text-sm">{language === 'fa' ? 'EN' : 'فا'}</span>
    </button>
  )
}

