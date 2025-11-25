import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../services/api'
import { Project } from '../types'
import {
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Clock,
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
} from 'recharts'
import { formatPersianDate } from '../utils/dateUtils'
import { useI18nStore } from '../store/i18nStore'

export default function Dashboard() {
  const { projects, setProjects, isLoading, setLoading } = useProjectStore()
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()
  const [selectedCenter, setSelectedCenter] = useState<'all' | string>('all')

  useEffect(() => {
    loadProjects()
  }, [])

  const centersMap = useMemo(() => {
    const map = new Map<string, Project[]>()
    projects.forEach((project) => {
      const centerKey = project.center || 'بدون مرکز'
      if (!map.has(centerKey)) {
        map.set(centerKey, [])
      }
      map.get(centerKey)!.push(project)
    })
    return map
  }, [projects, t])

  const comparativeData = useMemo(() => {
    const formatValue = (value?: number | null) => Math.max(0, Math.min(100, value ?? 0))

    if (selectedCenter === 'all') {
      return Array.from(centersMap.entries()).map(([centerKey, centerProjects]) => {
        const plannedAvg =
          centerProjects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) /
          (centerProjects.length || 1)
        const approvedAvg =
          centerProjects.reduce((sum, p) => sum + (p.approvedProgress ?? p.progressPercentage ?? 0), 0) /
          (centerProjects.length || 1)
        const selfAvg =
          centerProjects.reduce((sum, p) => sum + (p.selfReportedProgress ?? p.progressPercentage ?? 0), 0) /
          (centerProjects.length || 1)

        return {
          name: centerKey,
          centerKey,
          planned: formatValue(plannedAvg),
          approved: formatValue(approvedAvg),
          self: formatValue(selfAvg),
        }
      })
    }

    const centerProjects = centersMap.get(selectedCenter) || []
    return centerProjects.map((project) => ({
      name: project.name.length > 16 ? `${project.name.substring(0, 14)}…` : project.name,
      centerKey: selectedCenter,
      planned: formatValue(project.progressPercentage),
      approved: formatValue(project.approvedProgress ?? project.progressPercentage),
      self: formatValue(project.selfReportedProgress ?? project.progressPercentage),
    }))
  }, [centersMap, selectedCenter])

  const efficiencyData = useMemo(() => {
    const counters = {
      critical: 0,
      medium: 0,
      healthy: 0,
    }

    projects.forEach((project) => {
      const planned = project.progressPercentage || 0
      const actual = project.approvedProgress ?? project.selfReportedProgress ?? planned
      const ratio = planned > 0 ? actual / planned : 1

      if (ratio < 0.7) counters.critical += 1
      else if (ratio < 0.9) counters.medium += 1
      else counters.healthy += 1
    })

    const total = Math.max(1, projects.length)
    return [
      {
        name: 'بحرانی (راندمان پایین)',
        value: Math.round((counters.critical / total) * 100),
        count: counters.critical,
        color: '#ef4444',
      },
      {
        name: 'راندمان متوسط',
        value: Math.round((counters.medium / total) * 100),
        count: counters.medium,
        color: '#f59e0b',
      },
      {
        name: 'راندمان بالا',
        value: Math.round((counters.healthy / total) * 100),
        count: counters.healthy,
        color: '#10b981',
      },
    ]
  }, [projects, t])

  const natureData = useMemo(() => {
    const natureLabels: Record<number, string> = {
      0: 'طراحی و پیاده‌سازی',
      1: 'پشتیبانی',
      2: 'توسعه',
      3: 'تأمین',
    }

    const grouped = new Map<number, Project[]>()
    projects.forEach((project) => {
      const key = project.nature ?? 0
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(project)
    })

    return Array.from(grouped.entries()).map(([natureKey, natureProjects]) => {
      const total = natureProjects.length || 1
      const planned =
        natureProjects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / total
      const approved =
        natureProjects.reduce((sum, p) => sum + (p.approvedProgress ?? p.progressPercentage ?? 0), 0) /
        total
      const self =
        natureProjects.reduce((sum, p) => sum + (p.selfReportedProgress ?? p.progressPercentage ?? 0), 0) /
        total

      return {
        name: natureLabels[natureKey] || 'سایر',
        planned: Math.round(planned),
        approved: Math.round(approved),
        self: Math.round(self),
      }
    })
  }, [projects])

  const centerOptions = useMemo(() => Array.from(centersMap.keys()), [centersMap])

  const handleDrillReset = () => setSelectedCenter('all')

  const handleBarClick = (data: any) => {
    const payload = data?.payload ?? data
    if (selectedCenter === 'all' && payload?.centerKey) {
      setSelectedCenter(payload.centerKey)
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectApi.getAll({ pageSize: 10 })
      setProjects(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to load projects:', error)
      const errorMessage = error.response?.data?.error || 'خطا در بارگذاری پروژه‌ها'
      showToast(errorMessage, 'error')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      labelKey: 'dashboard.totalProjects',
      value: projects.length,
      icon: FolderKanban,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%',
    },
    {
      labelKey: 'dashboard.totalTasks',
      value: projects.reduce((sum, p) => sum + (p.taskCount || 0), 0),
      icon: CheckSquare,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+5%',
    },
    {
      labelKey: 'dashboard.activeProjects',
      value: projects.filter(p => p.status === 1).length,
      icon: Users,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+2',
    },
    {
      labelKey: 'dashboard.completedTasks',
      value: `${
        projects.length > 0
          ? Math.round(
              projects.reduce((sum, p) => sum + p.progressPercentage, 0) /
                projects.length
            )
          : 0
      }%`,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+3%',
    },
  ]

  const statusData = [
    { name: 'در حال انجام', value: projects.filter((p) => p.status === 1).length, color: '#0ea5e9' },
    { name: 'تکمیل شده', value: projects.filter((p) => p.status === 3).length, color: '#10b981' },
    { name: 'در انتظار', value: projects.filter((p) => p.status === 2).length, color: '#f59e0b' },
    { name: 'لغو شده', value: projects.filter((p) => p.status === 4).length, color: '#ef4444' },
  ]

  const quickActions = [
    { label: 'پروژه جدید', icon: Plus, link: '/app/projects', color: 'primary' },
    { label: 'تسک جدید', icon: CheckSquare, link: '/app/tasks', color: 'success' },
    { label: 'منبع جدید', icon: Users, link: '/app/resources', color: 'info' },
    { label: 'ثبت زمان', icon: Clock, link: '/app/time-tracking', color: 'warning' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRTL ? 'خوش آمدید به سیستم مدیریت پروژه IPMS' : 'Welcome to IPMS Project Management System'}
          </p>
        </div>
        <Link
          to="/app/projects"
          className={`flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {isRTL ? 'پروژه جدید' : 'New Project'}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.labelKey} hover className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-xl transition-all duration-300">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1 font-medium">{t(stat.labelKey)}</p>
                  <div className={`flex items-baseline ${isRTL ? 'space-x-reverse' : 'space-x-2'} gap-2`}>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`${stat.color} p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Comparative Progress by Center / Project */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isRTL ? 'مقایسه پیشرفت (برنامه‌ای / تایید شده / خوداظهاری)' : 'Planned vs Approved vs Self-Reported'}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedCenter === 'all'
                  ? 'برای مشاهده پروژه‌های هر مرکز روی میله‌ها کلیک کنید یا از لیست انتخاب نمایید.'
                  : `نمایش پروژه‌های مرکز ${selectedCenter}`}
              </p>
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value as 'all' | string)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">همه مراکز</option>
                {centerOptions.map((center) => (
                  <option key={center} value={center}>
                    {center}
                  </option>
                ))}
              </select>
              {selectedCenter !== 'all' && (
                <button
                  onClick={handleDrillReset}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  بازگشت
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner text="در حال بارگذاری..." />
          ) : comparativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart
                data={comparativeData}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="planned"
                  fill="#0ea5e9"
                  name="پیشرفت برنامه‌ای"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                  cursor={selectedCenter === 'all' ? 'pointer' : 'default'}
                />
                <Bar
                  dataKey="approved"
                  fill="#10b981"
                  name="پیشرفت تایید شده"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                  cursor={selectedCenter === 'all' ? 'pointer' : 'default'}
                />
                <Line
                  type="monotone"
                  dataKey="self"
                  name="پیشرفت خوداظهاری"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg font-medium mb-2">
                {t('common.noData')}
              </p>
              <p className="text-gray-400 text-sm">
                {isRTL ? 'داده‌ای برای نمایش وجود ندارد' : 'No data available to display'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Status & Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            {isRTL ? 'وضعیت پروژه‌ها' : 'Project Status'}
          </h3>
          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              داده‌ای برای نمایش وجود ندارد
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            توزیع راندمان پروژه‌ها
          </h3>
          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={efficiencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  dataKey="value"
                >
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`eff-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) =>
                    [`${props.payload.count} پروژه (${value}%)`, name]
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Nature comparison */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            تحلیل پیشرفت بر اساس ماهیت پروژه
          </h3>
          <p className="text-sm text-gray-500">
            میانگین پیشرفت برنامه‌ای، تایید شده و خوداظهاری برای هر دسته
          </p>
        </div>
        {isLoading ? (
          <LoadingSpinner text={t('common.loading')} />
        ) : natureData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={natureData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#0ea5e9" name="برنامه‌ای" />
              <Bar dataKey="approved" fill="#10b981" name="تایید شده" />
              <Bar dataKey="self" fill="#f97316" name="خوداظهاری" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">
            داده‌ای برای نمایش وجود ندارد
          </p>
        )}
      </Card>

      {/* Quick Actions & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            دسترسی سریع
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  to={action.link}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600 mr-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-medium text-gray-700">
                    {action.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </Link>
              )
            })}
          </div>
        </Card>

        {/* Recent Projects */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              پروژه‌های اخیر
            </h3>
            <Link
              to="/app/projects"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              مشاهده همه
              <ArrowRight className="w-4 h-4 mr-1" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={80} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">پروژه‌ای یافت نشد</p>
              <Link
                to="/app/projects"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
              >
                ایجاد پروژه جدید
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/app/projects/${project.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {project.name}
                        </h4>
                        <Badge
                          variant={
                            project.status === 3
                              ? 'success'
                              : project.status === 1
                              ? 'info'
                              : project.status === 2
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {project.status === 0
                            ? 'برنامه‌ریزی'
                            : project.status === 1
                            ? 'در حال انجام'
                            : project.status === 2
                            ? 'متوقف'
                            : project.status === 3
                            ? 'تکمیل شده'
                            : 'لغو شده'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{project.code}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          {project.taskCount || 0} تسک
                        </span>
                        {project.startDate && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatPersianDate(project.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {project.progressPercentage.toFixed(0)}%
                      </p>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-primary-500 rounded-full transition-all"
                          style={{ width: `${project.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
