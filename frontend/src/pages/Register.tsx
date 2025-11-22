import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import api from '../services/api'
import { useUIStore } from '../store/uiStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند')
      return
    }

    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل 6 کاراکتر باشد')
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

      showToast('ثبت نام با موفقیت انجام شد. لطفا وارد شوید.', 'success')
      navigate('/login')
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'خطا در ثبت نام'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ثبت نام در Isiran</h1>
            <p className="text-gray-600">حساب کاربری جدید ایجاد کنید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="نام"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="نام خانوادگی"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="نام کاربری"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <Input
              label="ایمیل"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="رمز عبور"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="تکرار رمز عبور"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              rightIcon={<UserPlus className="w-5 h-5" />}
            >
              ثبت نام
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              قبلا ثبت نام کرده‌اید؟{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                وارد شوید
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

