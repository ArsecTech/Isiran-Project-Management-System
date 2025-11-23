import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Sparkles } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useI18nStore } from '../store/i18nStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { username, password })
      const { accessToken, refreshToken, user } = response.data

      login(user, accessToken, refreshToken)
      showToast(isRTL ? 'ورود با موفقیت انجام شد' : 'Login successful', 'success')
      navigate('/app/dashboard')
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || (isRTL ? 'نام کاربری یا رمز عبور اشتباه است' : 'Invalid username or password')
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50">
          <div className="text-center mb-8">
            <Logo size="lg" showText={true} className="justify-center mb-6" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-gray-600">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Input
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={isRTL ? 'نام کاربری خود را وارد کنید' : 'Enter your username'}
              error={error ? undefined : ''}
            />

            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isRTL ? 'رمز عبور خود را وارد کنید' : 'Enter your password'}
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              rightIcon={<LogIn className="w-5 h-5" />}
            >
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            {isRTL ? 'بازگشت به صفحه اصلی' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}

