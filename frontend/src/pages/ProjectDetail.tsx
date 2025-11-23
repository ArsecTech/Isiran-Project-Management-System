import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { projectApi, taskApi } from '../services/api'
import { Project, Task } from '../types'
import GanttChart from '../components/GanttChart'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  BarChart3,
  Clock,
  FileText,
} from 'lucide-react'
import { formatPersianDate, formatRialSimple } from '../utils/dateUtils'

type TabType = 'overview' | 'tasks' | 'resources' | 'timeline' | 'budget'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectResources, setProjectResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { showToast } = useUIStore()

  useEffect(() => {
    if (id) {
      loadProject()
      loadTasks()
      loadProjectResources()
    }
  }, [id])

  const loadProject = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await projectApi.getById(id)
      setProject(response.data)
    } catch (error) {
      showToast('خطا در بارگذاری پروژه', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    if (!id) return

    try {
      const response = await taskApi.getAll({
        pageNumber: 1,
        pageSize: 100,
        projectId: id,
      })
      setTasks(response.data.items || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      showToast('خطا در بارگذاری تسک‌ها', 'error')
      setTasks([])
    }
  }

  const loadProjectResources = async () => {
    if (!id) return

    try {
      const response = await api.get('/timetracking', {
        params: {
          pageNumber: 1,
          pageSize: 100,
          projectId: id,
        },
      })
      // Extract unique resources from time entries
      const resourcesMap = new Map<string, any>()
      response.data.items?.forEach((entry: any) => {
        if (entry.resourceId && entry.resourceName) {
          if (!resourcesMap.has(entry.resourceId)) {
            resourcesMap.set(entry.resourceId, {
              id: entry.resourceId,
              name: entry.resourceName,
            })
          }
        }
      })
      setProjectResources(Array.from(resourcesMap.values()))
    } catch (error) {
      console.error('Failed to load project resources:', error)
      setProjectResources([])
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={60} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={150} />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">پروژه یافت نشد</p>
        <Link
          to="/app/projects"
          className="mt-4 inline-block text-primary-600 hover:text-primary-700"
        >
          بازگشت به لیست پروژه‌ها
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'نمای کلی', icon: BarChart3 },
    { id: 'tasks' as TabType, label: 'تسک‌ها', icon: CheckSquare },
    { id: 'resources' as TabType, label: 'منابع', icon: Users },
    { id: 'timeline' as TabType, label: 'زمان‌بندی', icon: Calendar },
    { id: 'budget' as TabType, label: 'بودجه', icon: DollarSign },
  ]

  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { label: 'برنامه‌ریزی', variant: 'default' as const },
      1: { label: 'در حال انجام', variant: 'info' as const },
      2: { label: 'متوقف', variant: 'warning' as const },
      3: { label: 'تکمیل شده', variant: 'success' as const },
      4: { label: 'لغو شده', variant: 'danger' as const },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap[0]
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/projects"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-gray-600 mt-1">{project.code}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">پیشرفت</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project.progressPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-primary-500 rounded-full transition-all"
              style={{ width: `${project.progressPercentage}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تسک‌ها</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project.completedTaskCount || 0} / {project.taskCount || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">بودجه</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatRialSimple(project.actualCost)} / {formatRialSimple(project.budget)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تاریخ شروع</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {project.startDate ? formatPersianDate(project.startDate) : '-'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            {project.description && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">توضیحات</h3>
                <p className="text-gray-600">{project.description}</p>
              </Card>
            )}

            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">اطلاعات پروژه</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">کد پروژه:</span>
                    <span className="font-medium text-gray-900">{project.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">وضعیت:</span>
                    {getStatusBadge(project.status)}
                  </div>
                  {project.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ شروع:</span>
                      <span className="font-medium text-gray-900">
                        {formatPersianDate(project.startDate)}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ پایان:</span>
                      <span className="font-medium text-gray-900">
                        {formatPersianDate(project.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">کل تسک‌ها:</span>
                    <span className="font-medium text-gray-900">{project.taskCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">تسک‌های تکمیل شده:</span>
                    <span className="font-medium text-green-600">
                      {project.completedTaskCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">بودجه:</span>
                    <span className="font-medium text-gray-900">
                      {formatRialSimple(project.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">هزینه واقعی:</span>
                    <span className="font-medium text-gray-900">
                      {formatRialSimple(project.actualCost)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">تسک‌های پروژه</h3>
              <Link
                to="/app/tasks"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                مشاهده همه
              </Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>تسکی یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                      <Badge variant="info">
                        {task.status === 0
                          ? 'شروع نشده'
                          : task.status === 1
                          ? 'در حال انجام'
                          : 'تکمیل شده'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'resources' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">منابع پروژه</h3>
              <Link
                to="/app/resources"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                مشاهده همه
              </Link>
            </div>
            {projectResources.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>منبعی یافت نشد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{resource.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">نمودار گانت</h3>
            {id && <GanttChart projectId={id} />}
          </Card>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بودجه و هزینه</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">بودجه کل</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatRialSimple(project.budget)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">هزینه واقعی</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatRialSimple(project.actualCost)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                  <div>
                    <p className="text-sm text-primary-600">مانده بودجه</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">
                      {formatRialSimple(project.budget - project.actualCost)}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary-400" />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
