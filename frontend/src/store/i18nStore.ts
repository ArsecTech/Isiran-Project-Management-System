import { create } from 'zustand'

export type Language = 'fa' | 'en'

interface Translations {
  [key: string]: {
    fa: string
    en: string
  }
}

const translations: Translations = {
  // Common
  'common.save': { fa: 'ذخیره', en: 'Save' },
  'common.cancel': { fa: 'انصراف', en: 'Cancel' },
  'common.delete': { fa: 'حذف', en: 'Delete' },
  'common.edit': { fa: 'ویرایش', en: 'Edit' },
  'common.create': { fa: 'ایجاد', en: 'Create' },
  'common.search': { fa: 'جستجو', en: 'Search' },
  'common.filter': { fa: 'فیلتر', en: 'Filter' },
  'common.loading': { fa: 'در حال بارگذاری...', en: 'Loading...' },
  'common.noData': { fa: 'داده‌ای یافت نشد', en: 'No data found' },
  
  // Navigation
  'nav.dashboard': { fa: 'داشبورد', en: 'Dashboard' },
  'nav.projects': { fa: 'پروژه‌ها', en: 'Projects' },
  'nav.tasks': { fa: 'تسک‌ها', en: 'Tasks' },
  'nav.resources': { fa: 'منابع', en: 'Resources' },
  'nav.timeTracking': { fa: 'ردیابی زمان', en: 'Time Tracking' },
  'nav.settings': { fa: 'تنظیمات', en: 'Settings' },
  'nav.profile': { fa: 'پروفایل', en: 'Profile' },
  'nav.logout': { fa: 'خروج', en: 'Logout' },
  
  // Dashboard
  'dashboard.title': { fa: 'داشبورد', en: 'Dashboard' },
  'dashboard.totalProjects': { fa: 'کل پروژه‌ها', en: 'Total Projects' },
  'dashboard.activeProjects': { fa: 'پروژه‌های فعال', en: 'Active Projects' },
  'dashboard.totalTasks': { fa: 'کل تسک‌ها', en: 'Total Tasks' },
  'dashboard.completedTasks': { fa: 'تسک‌های تکمیل شده', en: 'Completed Tasks' },
  
  // Projects
  'projects.title': { fa: 'پروژه‌ها', en: 'Projects' },
  'projects.create': { fa: 'پروژه جدید', en: 'New Project' },
  'projects.name': { fa: 'نام پروژه', en: 'Project Name' },
  'projects.status': { fa: 'وضعیت', en: 'Status' },
  'projects.status.planning': { fa: 'برنامه‌ریزی', en: 'Planning' },
  'projects.status.inProgress': { fa: 'در حال انجام', en: 'In Progress' },
  'projects.status.onHold': { fa: 'متوقف', en: 'On Hold' },
  'projects.status.completed': { fa: 'تکمیل شده', en: 'Completed' },
  'projects.status.cancelled': { fa: 'لغو شده', en: 'Cancelled' },
  'projects.priority': { fa: 'اولویت', en: 'Priority' },
  'projects.priority.low': { fa: 'کم', en: 'Low' },
  'projects.priority.medium': { fa: 'متوسط', en: 'Medium' },
  'projects.priority.high': { fa: 'بالا', en: 'High' },
  'projects.priority.critical': { fa: 'بحرانی', en: 'Critical' },
  'projects.budget': { fa: 'بودجه', en: 'Budget' },
  'projects.startDate': { fa: 'تاریخ شروع', en: 'Start Date' },
  'projects.endDate': { fa: 'تاریخ پایان', en: 'End Date' },
  'projects.description': { fa: 'توضیحات', en: 'Description' },
  'projects.progress': { fa: 'پیشرفت', en: 'Progress' },
  'projects.allStatuses': { fa: 'همه وضعیت‌ها', en: 'All Statuses' },
  'projects.allPriorities': { fa: 'همه اولویت‌ها', en: 'All Priorities' },
  'projects.search': { fa: 'جستجو در پروژه‌ها...', en: 'Search projects...' },
  'projects.noProjects': { fa: 'پروژه‌ای یافت نشد', en: 'No projects found' },
  'projects.createNew': { fa: 'ایجاد پروژه جدید', en: 'Create New Project' },
  'projects.tasks': { fa: 'تسک', en: 'Tasks' },
  'projects.completed': { fa: 'تکمیل شده', en: 'Completed' },
  'projects.previous': { fa: 'قبلی', en: 'Previous' },
  'projects.next': { fa: 'بعدی', en: 'Next' },
  'projects.page': { fa: 'صفحه', en: 'Page' },
  'projects.of': { fa: 'از', en: 'of' },
  
  // Tasks
  'tasks.title': { fa: 'تسک‌ها', en: 'Tasks' },
  'tasks.create': { fa: 'تسک جدید', en: 'New Task' },
  'tasks.edit': { fa: 'ویرایش تسک', en: 'Edit Task' },
  'tasks.name': { fa: 'نام تسک', en: 'Task Name' },
  'tasks.description': { fa: 'توضیحات', en: 'Description' },
  'tasks.project': { fa: 'پروژه', en: 'Project' },
  'tasks.selectProject': { fa: 'انتخاب پروژه', en: 'Select Project' },
  'tasks.selectProjectFirst': { fa: 'ابتدا پروژه را انتخاب کنید', en: 'Please select a project first' },
  'tasks.status': { fa: 'وضعیت', en: 'Status' },
  'tasks.status.notStarted': { fa: 'شروع نشده', en: 'Not Started' },
  'tasks.status.inProgress': { fa: 'در حال انجام', en: 'In Progress' },
  'tasks.status.completed': { fa: 'تکمیل شده', en: 'Completed' },
  'tasks.status.onHold': { fa: 'متوقف', en: 'On Hold' },
  'tasks.status.cancelled': { fa: 'لغو شده', en: 'Cancelled' },
  'tasks.priority': { fa: 'اولویت', en: 'Priority' },
  'tasks.priority.low': { fa: 'پایین', en: 'Low' },
  'tasks.priority.medium': { fa: 'متوسط', en: 'Medium' },
  'tasks.priority.high': { fa: 'بالا', en: 'High' },
  'tasks.priority.critical': { fa: 'بحرانی', en: 'Critical' },
  'tasks.startDate': { fa: 'تاریخ شروع', en: 'Start Date' },
  'tasks.endDate': { fa: 'تاریخ پایان', en: 'End Date' },
  'tasks.duration': { fa: 'مدت زمان', en: 'Duration' },
  'tasks.assignedTo': { fa: 'اختصاص داده شده به', en: 'Assigned To' },
  'tasks.allProjects': { fa: 'همه پروژه‌ها', en: 'All Projects' },
  'tasks.allStatuses': { fa: 'همه وضعیت‌ها', en: 'All Statuses' },
  'tasks.noTasks': { fa: 'تسکی یافت نشد', en: 'No tasks found' },
  'tasks.createNew': { fa: 'ایجاد تسک جدید', en: 'Create New Task' },
  'tasks.search': { fa: 'جستجو در تسک‌ها...', en: 'Search tasks...' },
  
  // Resources
  'resources.title': { fa: 'منابع', en: 'Resources' },
  'resources.create': { fa: 'منبع جدید', en: 'New Resource' },
  'resources.name': { fa: 'نام', en: 'Name' },
  'resources.email': { fa: 'ایمیل', en: 'Email' },
  'resources.type': { fa: 'نوع', en: 'Type' },
  'resources.standardRate': { fa: 'نرخ استاندارد', en: 'Standard Rate' },
  'resources.overtimeRate': { fa: 'نرخ اضافه‌کاری', en: 'Overtime Rate' },
  
  // Time Tracking
  'timeTracking.title': { fa: 'ردیابی زمان', en: 'Time Tracking' },
  'timeTracking.subtitle': { fa: 'ثبت و مدیریت زمان کار روی تسک‌ها', en: 'Record and manage work time on tasks' },
  'timeTracking.create': { fa: 'ثبت جدید', en: 'New Entry' },
  'timeTracking.task': { fa: 'تسک', en: 'Task' },
  'timeTracking.resource': { fa: 'منبع', en: 'Resource' },
  'timeTracking.date': { fa: 'تاریخ', en: 'Date' },
  'timeTracking.hours': { fa: 'ساعات', en: 'Hours' },
  'timeTracking.totalHours': { fa: 'کل ساعات', en: 'Total Hours' },
  'timeTracking.billableHours': { fa: 'ساعات قابل صورتحساب', en: 'Billable Hours' },
  'timeTracking.totalCost': { fa: 'کل هزینه', en: 'Total Cost' },
  'timeTracking.description': { fa: 'توضیحات', en: 'Description' },
  'timeTracking.isBillable': { fa: 'قابل صورتحساب', en: 'Billable' },
  'timeTracking.fromDate': { fa: 'از تاریخ', en: 'From Date' },
  'timeTracking.toDate': { fa: 'تا تاریخ', en: 'To Date' },
  'timeTracking.clearFilters': { fa: 'پاک کردن فیلترها', en: 'Clear Filters' },
  'timeTracking.allProjects': { fa: 'همه پروژه‌ها', en: 'All Projects' },
  'timeTracking.timeEntries': { fa: 'ثبت\u200cهای زمان', en: 'Time Entries' },
  'timeTracking.noEntries': { fa: 'ثبت زمانی یافت نشد', en: 'No time entries found' },
  'timeTracking.createNew': { fa: 'ایجاد ثبت جدید', en: 'Create New Entry' },
  
  // Tasks (additional)
  'tasks.parentTask': { fa: 'تسک والد', en: 'Parent Task' },
  'tasks.noParentTask': { fa: 'بدون تسک والد (تسک اصلی)', en: 'No Parent Task (Main Task)' },
  'tasks.level': { fa: 'سطح', en: 'Level' },
  'tasks.notStarted': { fa: 'شروع نشده', en: 'Not Started' },
  'tasks.inProgress': { fa: 'در حال انجام', en: 'In Progress' },
  'tasks.completed': { fa: 'تکمیل شده', en: 'Completed' },
  'tasks.onHold': { fa: 'متوقف', en: 'On Hold' },
  'tasks.cancelled': { fa: 'لغو شده', en: 'Cancelled' },
  'tasks.low': { fa: 'پایین', en: 'Low' },
  'tasks.medium': { fa: 'متوسط', en: 'Medium' },
  'tasks.high': { fa: 'بالا', en: 'High' },
  'tasks.critical': { fa: 'بحرانی', en: 'Critical' },
  
  // Projects (additional)
  'projects.edit': { fa: 'ویرایش پروژه', en: 'Edit Project' },
  'projects.code': { fa: 'کد پروژه', en: 'Project Code' },
  'projects.viewAll': { fa: 'مشاهده همه', en: 'View All' },
  'projects.recentProjects': { fa: 'پروژه\u200cهای اخیر', en: 'Recent Projects' },
  'projects.resources': { fa: 'منابع', en: 'Resources' },
  'projects.timeline': { fa: 'زمان\u200cبندی', en: 'Timeline' },
  'projects.overview': { fa: 'نمای کلی', en: 'Overview' },
  
  // Resources
  'resources.averageRate': { fa: 'میانگین نرخ', en: 'Average Rate' },
  'resources.department': { fa: 'دپارتمان', en: 'Department' },
  'resources.jobTitle': { fa: 'عنوان شغل', en: 'Job Title' },
  'resources.status': { fa: 'وضعیت', en: 'Status' },
  
  // Auth
  'auth.login': { fa: 'ورود', en: 'Login' },
  'auth.register': { fa: 'ثبت نام', en: 'Register' },
  'auth.username': { fa: 'نام کاربری', en: 'Username' },
  'auth.password': { fa: 'رمز عبور', en: 'Password' },
  'auth.email': { fa: 'ایمیل', en: 'Email' },
  'auth.fullName': { fa: 'نام کامل', en: 'Full Name' },
  'auth.loginTitle': { fa: 'ورود به IPMS', en: 'Login to IPMS' },
  'auth.registerTitle': { fa: 'ثبت نام در IPMS', en: 'Register to IPMS' },
  'auth.loginSubtitle': { fa: 'حساب کاربری خود را وارد کنید', en: 'Enter your account credentials' },
  'auth.registerSubtitle': { fa: 'حساب کاربری جدید ایجاد کنید', en: 'Create a new account' },
  'auth.noAccount': { fa: 'حساب کاربری ندارید؟', en: "Don't have an account?" },
  'auth.haveAccount': { fa: 'حساب کاربری دارید؟', en: 'Already have an account?' },
  'auth.forgotPassword': { fa: 'رمز عبور را فراموش کرده\u200cاید؟', en: 'Forgot password?' },
  
  // Landing
  'landing.hero.title': { fa: 'مدیریت پروژه\u200cهایتان را متحول کنید', en: 'Transform Your Project Management' },
  'landing.hero.subtitle': { fa: 'IPMS یک سیستم مدیریت پروژه پیشرفته و حرفه\u200cای است', en: 'IPMS is an advanced and professional project management system' },
  'landing.hero.getStarted': { fa: 'شروع رایگان', en: 'Get Started Free' },
  'landing.hero.viewDemo': { fa: 'مشاهده دمو', en: 'View Demo' },
  'landing.features.title': { fa: 'ویژگی\u200cهای قدرتمند', en: 'Powerful Features' },
  'landing.features.projectManagement': { fa: 'مدیریت پروژه', en: 'Project Management' },
  'landing.features.taskTracking': { fa: 'ردیابی تسک', en: 'Task Tracking' },
  'landing.features.resourceManagement': { fa: 'مدیریت منابع', en: 'Resource Management' },
  'landing.features.timeTracking': { fa: 'ردیابی زمان', en: 'Time Tracking' },
  'landing.features.reporting': { fa: 'گزارش\u200cگیری', en: 'Reporting' },
  'landing.features.collaboration': { fa: 'همکاری تیمی', en: 'Team Collaboration' },
}

interface I18nStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

export const useI18nStore = create<I18nStore>((set, get) => {
  // Initialize from localStorage if available
  const stored = typeof window !== 'undefined' ? localStorage.getItem('i18n-storage') : null
  const initialLang: Language = stored ? (JSON.parse(stored).language || 'fa') : 'fa'
  
  if (typeof window !== 'undefined') {
    document.documentElement.dir = initialLang === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = initialLang
  }

  return {
    language: initialLang,
    isRTL: initialLang === 'fa',
    setLanguage: (lang: Language) => {
      set({ language: lang, isRTL: lang === 'fa' })
      if (typeof window !== 'undefined') {
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
        document.documentElement.lang = lang
        localStorage.setItem('i18n-storage', JSON.stringify({ language: lang }))
      }
    },
    t: (key: string) => {
      const { language } = get()
      return translations[key]?.[language] || key
    },
  }
})

// Initialize RTL on mount
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('i18n-storage')
  const lang = stored ? JSON.parse(stored).state?.language || 'fa' : 'fa'
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

