import { useEffect, useState } from 'react'
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
  LineChart,
  Line,
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
} from 'recharts'
import { format } from 'date-fns'

export default function Dashboard() {
  const { projects, setProjects, isLoading, setLoading } = useProjectStore()
  const { showToast } = useUIStore()
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      const data = projects.map((p) => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        progress: p.progressPercentage,
        tasks: p.taskCount,
      }))
      setChartData(data)
    }
  }, [projects])

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
      label: 'کل پروژه‌ها',
      value: projects.length,
      icon: FolderKanban,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      label: 'تسک‌های فعال',
      value: projects.reduce((sum, p) => sum + p.taskCount, 0),
      icon: CheckSquare,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      label: 'اعضای تیم',
      value: 12,
      icon: Users,
      color: 'bg-purple-500',
      change: '+2',
    },
    {
      label: 'نرخ تکمیل',
      value: `${
        projects.length > 0
          ? Math.round(
              projects.reduce((sum, p) => sum + p.progressPercentage, 0) /
                projects.length
            )
          : 0
      }%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">داشبورد</h1>
          <p className="text-gray-600 mt-2">
            خوش آمدید به سیستم مدیریت پروژه Isiran
          </p>
        </div>
        <Link
          to="/app/projects"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          پروژه جدید
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} hover className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <span className="text-sm text-green-600 font-medium">
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            پیشرفت پروژه‌ها
          </h3>
          {isLoading ? (
            <LoadingSpinner text="در حال بارگذاری..." />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill="#0ea5e9" name="پیشرفت (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              داده‌ای برای نمایش وجود ندارد
            </p>
          )}
        </Card>

        {/* Status Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            وضعیت پروژه‌ها
          </h3>
          {isLoading ? (
            <LoadingSpinner text="در حال بارگذاری..." />
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
      </div>

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
                          {project.taskCount} تسک
                        </span>
                        {project.startDate && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(project.startDate), 'yyyy/MM/dd')}
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
