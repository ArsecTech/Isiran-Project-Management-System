import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, BarChart3, Users, Calendar, Zap, Shield, Globe, TrendingUp, Clock, Target, Award } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">I</span>
            </div>
            <div>
              <span className="text-3xl font-bold text-gray-900">Isiran</span>
              <p className="text-xs text-gray-500">ایزایران</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-primary-50"
            >
              ورود
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              شروع کنید
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
            🚀 سیستم مدیریت پروژه پیشرفته
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            مدیریت پروژه‌هایتان را
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              متحول کنید
            </span>
          </h1>
          <p className="text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            Isiran یک سیستم مدیریت پروژه پیشرفته و حرفه‌ای است که به شما کمک می‌کند
            پروژه‌هایتان را با دقت و کارایی بالا مدیریت کنید
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/register"
              className="group px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 font-bold text-lg shadow-2xl flex items-center space-x-3"
            >
              <span>شروع رایگان</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-10 py-5 bg-white text-primary-600 border-2 border-primary-600 rounded-xl hover:bg-primary-50 transition-all font-bold text-lg shadow-lg"
            >
              مشاهده دمو
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>بدون نیاز به کارت اعتباری</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>رایگان برای شروع</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>پشتیبانی 24/7</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Illustration */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-primary-100 via-primary-50 to-blue-100 rounded-2xl p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full -ml-32 -mb-32 opacity-20"></div>
              <div className="relative z-10">
                <BarChart3 className="w-40 h-40 mx-auto text-primary-600 mb-6" />
                <p className="text-2xl font-semibold text-gray-700">نمای داشبورد Isiran</p>
                <p className="text-gray-600 mt-2">مدیریت کامل پروژه‌ها در یک نگاه</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-24 bg-white">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            ویژگی‌های قدرتمند
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            همه چیزهایی که برای مدیریت موفق پروژه نیاز دارید در یک پلتفرم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="mt-6 flex items-center text-primary-600 font-semibold">
                  <span>بیشتر بدانید</span>
                  <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              اعداد و ارقام
            </h2>
            <p className="text-xl text-primary-100">
              به هزاران تیم در سراسر جهان اعتماد شده است
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-white mb-3">
                  {stat.value}
                </div>
                <div className="text-primary-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            چگونه کار می‌کند؟
          </h2>
          <p className="text-xl text-gray-600">
            در سه مرحله ساده شروع کنید
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                {index + 1}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48 opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48 opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              آماده شروع هستید؟
            </h2>
            <p className="text-2xl text-primary-100 mb-10">
              همین حالا حساب کاربری رایگان خود را ایجاد کنید و مدیریت پروژه را متحول کنید
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-10 py-5 bg-white text-primary-600 rounded-xl hover:bg-gray-100 transition-all font-bold text-lg shadow-2xl transform hover:scale-105"
            >
              <span>شروع کنید - رایگان</span>
              <ArrowRight className="w-6 h-6 mr-3" />
            </Link>
            <p className="mt-6 text-primary-100">
              بدون نیاز به کارت اعتباری • راه‌اندازی در کمتر از 2 دقیقه
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-16 border-t border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">Isiran</span>
              <p className="text-xs text-gray-500">ایزایران</p>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">درباره ما</a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">تماس با ما</a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">حریم خصوصی</a>
          </div>
          <div className="text-gray-600 text-sm mt-6 md:mt-0">
            © 2024 Isiran. تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: BarChart3,
    title: 'نمودار گانت پیشرفته',
    description: 'مدیریت زمان و وابستگی‌های پروژه با نمودار گانت حرفه‌ای و تعاملی',
  },
  {
    icon: Users,
    title: 'مدیریت منابع',
    description: 'تخصیص و مدیریت منابع انسانی و مادی پروژه با تحلیل بار کاری',
  },
  {
    icon: Calendar,
    title: 'برنامه‌ریزی هوشمند',
    description: 'محاسبه خودکار مسیر بحرانی و بهینه‌سازی زمان‌بندی پروژه',
  },
  {
    icon: Zap,
    title: 'عملکرد سریع',
    description: 'رابط کاربری سریع و واکنش‌گرا برای تجربه کاربری عالی',
  },
  {
    icon: Shield,
    title: 'امنیت بالا',
    description: 'سیستم امنیتی پیشرفته با احراز هویت چندمرحله‌ای و رمزنگاری',
  },
  {
    icon: Globe,
    title: 'دسترسی از همه جا',
    description: 'دسترسی به پروژه‌هایتان از هر مکان و هر دستگاهی',
  },
  {
    icon: Clock,
    title: 'ردیابی زمان',
    description: 'ثبت و مدیریت زمان کار روی تسک‌ها با گزارش‌گیری دقیق',
  },
  {
    icon: Target,
    title: 'مدیریت بودجه',
    description: 'ردیابی هزینه‌ها و بودجه پروژه با گزارش‌های مالی دقیق',
  },
  {
    icon: Award,
    title: 'گزارش‌گیری پیشرفته',
    description: 'گزارش‌های جامع و Export به PDF و Excel',
  },
]

const stats = [
  { value: '1000+', label: 'پروژه‌های فعال' },
  { value: '500+', label: 'کاربران راضی' },
  { value: '99.9%', label: 'آپتایم' },
  { value: '24/7', label: 'پشتیبانی' },
]

const steps = [
  {
    title: 'ثبت نام کنید',
    description: 'حساب کاربری رایگان خود را در کمتر از 2 دقیقه ایجاد کنید',
  },
  {
    title: 'پروژه بسازید',
    description: 'پروژه جدید ایجاد کنید و تسک‌ها و منابع را اضافه کنید',
  },
  {
    title: 'شروع کنید',
    description: 'مدیریت پروژه را شروع کنید و پیشرفت را ردیابی کنید',
  },
]
