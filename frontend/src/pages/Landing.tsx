import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  FolderKanban,
  CheckSquare,
  Timer,
  Sparkles,
  Rocket,
  Star,
  ArrowDown
} from 'lucide-react'
import { useI18nStore } from '../store/i18nStore'
import Logo from '../components/ui/Logo'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

export default function Landing() {
  const { t, isRTL } = useI18nStore()

  const features = [
    {
      icon: FolderKanban,
      titleKey: 'landing.features.projectManagement',
      description: isRTL 
        ? 'مدیریت کامل پروژه‌ها با ابزارهای پیشرفته' 
        : 'Complete project management with advanced tools',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CheckSquare,
      titleKey: 'landing.features.taskTracking',
      description: isRTL 
        ? 'ردیابی و مدیریت تسک‌ها به صورت حرفه‌ای' 
        : 'Professional task tracking and management',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Users,
      titleKey: 'landing.features.resourceManagement',
      description: isRTL 
        ? 'مدیریت منابع انسانی و مالی پروژه' 
        : 'Human and financial resource management',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Timer,
      titleKey: 'landing.features.timeTracking',
      description: isRTL 
        ? 'ردیابی دقیق زمان و هزینه پروژه‌ها' 
        : 'Accurate time and cost tracking',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: BarChart3,
      titleKey: 'landing.features.reporting',
      description: isRTL 
        ? 'گزارش‌گیری جامع و تحلیل داده‌ها' 
        : 'Comprehensive reporting and data analysis',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Users,
      titleKey: 'landing.features.collaboration',
      description: isRTL 
        ? 'همکاری تیمی و ارتباط موثر' 
        : 'Team collaboration and effective communication',
      color: 'from-indigo-500 to-indigo-600',
    },
  ]

  const stats = [
    { value: '1000+', label: isRTL ? 'کاربر فعال' : 'Active Users' },
    { value: '5000+', label: isRTL ? 'پروژه تکمیل شده' : 'Completed Projects' },
    { value: '99%', label: isRTL ? 'رضایت کاربران' : 'User Satisfaction' },
    { value: '24/7', label: isRTL ? 'پشتیبانی' : 'Support' },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Logo size="md" showText={true} />
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} gap-4`}>
            <LanguageSwitcher />
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-primary-50"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              {t('landing.hero.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>{isRTL ? 'سیستم مدیریت پروژه پیشرفته' : 'Advanced Project Management System'}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            {isRTL ? (
              <>
                مدیریت پروژه‌هایتان را
                <br />
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-blue-600 bg-clip-text text-transparent">
                  متحول کنید
                </span>
              </>
            ) : (
              <>
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-blue-600 bg-clip-text text-transparent">
                  Project Management
                </span>
              </>
            )}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className={`flex flex-col sm:flex-row items-center justify-center ${isRTL ? 'space-y-reverse space-x-reverse' : 'space-y-4 space-x-4'} gap-6 mb-16`}>
            <Link
              to="/register"
              className="group px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 font-bold text-lg shadow-2xl hover:shadow-primary-500/50 flex items-center gap-3"
            >
              <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>{t('landing.hero.getStarted')}</span>
              <ArrowRight className={`w-6 h-6 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
            </Link>
            <Link
              to="/login"
              className="px-10 py-5 bg-white text-primary-600 border-2 border-primary-600 rounded-2xl hover:bg-primary-50 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('landing.hero.viewDemo')}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-sm text-gray-500">{isRTL ? 'اسکرول کنید' : 'Scroll down'}</span>
            <ArrowDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-24 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'همه ابزارهای مورد نیاز برای مدیریت موفق پروژه‌ها' 
                : 'All the tools you need for successful project management'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all transform hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32"></div>
            </div>
            
            <div className="relative z-10">
              <Star className="w-16 h-16 mx-auto mb-6 text-yellow-300 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {isRTL ? 'آماده شروع هستید؟' : 'Ready to Get Started?'}
              </h2>
              <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                {isRTL 
                  ? 'همین حالا ثبت نام کنید و مدیریت پروژه‌هایتان را متحول کنید' 
                  : 'Sign up now and transform your project management'}
              </p>
              <div className={`flex flex-col sm:flex-row items-center justify-center ${isRTL ? 'space-y-reverse space-x-reverse' : 'space-y-4 space-x-4'} gap-6`}>
                <Link
                  to="/register"
                  className="px-10 py-5 bg-white text-primary-600 rounded-2xl hover:bg-gray-100 transition-all font-bold text-lg shadow-xl transform hover:scale-105 flex items-center gap-3"
                >
                  <Rocket className="w-6 h-6" />
                  {t('landing.hero.getStarted')}
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-5 bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 rounded-2xl hover:bg-white/20 transition-all font-bold text-lg"
                >
                  {t('landing.hero.viewDemo')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className={`flex flex-col md:flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''} gap-6`}>
            <Logo size="sm" showText={true} />
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-6'} gap-6 text-gray-600`}>
              <Link to="/login" className="hover:text-primary-600 transition-colors">
                {t('auth.login')}
              </Link>
              <Link to="/register" className="hover:text-primary-600 transition-colors">
                {t('auth.register')}
              </Link>
              <span className="text-sm">
                © 2024 IPMS. {isRTL ? 'همه حقوق محفوظ است' : 'All rights reserved'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
