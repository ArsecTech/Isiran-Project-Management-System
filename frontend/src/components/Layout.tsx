import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Menu,
  X,
  Clock,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useI18nStore } from '../store/i18nStore'
import ToastContainer from './ui/ToastContainer'
import Logo from './ui/Logo'
import LanguageSwitcher from './ui/LanguageSwitcher'

export default function Layout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, toasts, removeToast } = useUIStore()
  const { user, logout } = useAuthStore()
  const { t, isRTL } = useI18nStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { path: '/app/projects', icon: FolderKanban, labelKey: 'nav.projects' },
    { path: '/app/tasks', icon: CheckSquare, labelKey: 'nav.tasks' },
    { path: '/app/resources', icon: Users, labelKey: 'nav.resources' },
    { path: '/app/time-tracking', icon: Clock, labelKey: 'nav.timeTracking' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col fixed lg:relative h-full z-40 shadow-2xl`}
      >
        <div className="p-6 border-b border-gray-700/50">
          <Logo size="md" showText={true} className="text-white" />
        </div>

        <nav className="flex-1 mt-4 px-2 sm:px-3 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                className={`flex items-center px-3 sm:px-4 py-3 mb-1 rounded-xl text-gray-300 hover:bg-gray-800/50 transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50'
                    : 'hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isRTL ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                <span className="font-medium text-sm sm:text-base">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 hidden lg:block">
          <div className="flex items-center space-x-3 px-2 py-2 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 w-full min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-10 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} gap-4`}>
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <Bell className="w-5 h-5" />
                <span className={`absolute top-1 ${isRTL ? 'left' : 'right'}-1 w-2 h-2 bg-red-500 rounded-full`}></span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-semibold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''} transition-transform`} />
                </button>

                {userMenuOpen && (
                  <div className={`absolute ${isRTL ? 'left' : 'right'}-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-scale-in`}>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                    <Link
                      to="/app/settings"
                      className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className={`w-4 h-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      {t('nav.settings')}
                    </Link>
                    <Link
                      to="/app/profile"
                      className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className={`w-4 h-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      {t('nav.profile')}
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <LogOut className={`w-4 h-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin bg-gray-50 min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

