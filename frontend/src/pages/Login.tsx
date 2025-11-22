import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { showToast } = useUIStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { username, password })
      const { accessToken, refreshToken, user } = response.data

      login(user, accessToken, refreshToken)
      showToast('ورود با موفقیت انجام شد', 'success')
      navigate('/app/dashboard')
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'نام کاربری یا رمز عبور اشتباه است'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">I</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ورود به Isiran</h1>
            <p className="text-gray-600">حساب کاربری خود را وارد کنید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="نام کاربری"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="نام کاربری خود را وارد کنید"
              error={error ? undefined : ''}
            />

            <Input
              label="رمز عبور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="رمز عبور خود را وارد کنید"
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              rightIcon={<LogIn className="w-5 h-5" />}
            >
              ورود
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              حساب کاربری ندارید؟{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                ثبت نام کنید
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  )
}

