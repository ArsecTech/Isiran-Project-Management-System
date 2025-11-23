import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import api from '../services/api'
import { useUIStore } from '../store/uiStore'
import { useI18nStore } from '../store/i18nStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(isRTL ? 'رمز عبور و تکرار آن مطابقت ندارند' : 'Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError(isRTL ? 'رمز عبور باید حداقل 6 کاراکتر باشد' : 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      showToast(isRTL ? 'ثبت نام با موفقیت انجام شد. لطفا وارد شوید.' : 'Registration successful. Please login.', 'success')
      navigate('/login')
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || (isRTL ? 'خطا در ثبت نام' : 'Registration error')
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
              {t('auth.registerTitle')}
            </h1>
            <p className="text-gray-600">{t('auth.registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={isRTL ? 'نام' : 'First Name'}
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label={isRTL ? 'نام خانوادگی' : 'Last Name'}
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label={t('auth.username')}
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <Input
              label={t('auth.email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label={t('auth.password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label={isRTL ? 'تکرار رمز عبور' : 'Confirm Password'}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              rightIcon={<UserPlus className="w-5 h-5" />}
            >
              {t('auth.register')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                {t('auth.login')}
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

