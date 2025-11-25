import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { projectApi, taskApi, reportsApi } from '../services/api'
import { Project, Task, TaskConstraint, TaskType } from '../types'
import GanttChart from '../components/GanttChart'
import { useUIStore } from '../store/uiStore'
import { useI18nStore } from '../store/i18nStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  BarChart3,
  Clock,
  FileText,
  Download,
  UploadCloud,
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
  const [progressModalTask, setProgressModalTask] = useState<Task | null>(null)
  const [progressValue, setProgressValue] = useState(0)
  const { showToast } = useUIStore()
  const { isRTL } = useI18nStore()
  const excelInputRef = useRef<HTMLInputElement | null>(null)
  const mspInputRef = useRef<HTMLInputElement | null>(null)

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>()
    tasks.forEach((task) => map.set(task.id, task))
    return map
  }, [tasks])

  const timelineTasks = useMemo(() => {
    const sorted = [...tasks]
    sorted.sort((a, b) => {
      if (a.wbsCode && b.wbsCode) {
        return a.wbsCode.localeCompare(b.wbsCode, 'fa', { numeric: true, sensitivity: 'base' })
      }
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    })
    return sorted
  }, [tasks])

  const constraintLabels: Record<number, string> = {
    [TaskConstraint.AsSoonAsPossible]: 'As Soon As Possible',
    [TaskConstraint.AsLateAsPossible]: 'As Late As Possible',
    [TaskConstraint.MustStartOn]: 'Must Start On',
    [TaskConstraint.MustFinishOn]: 'Must Finish On',
    [TaskConstraint.StartNoEarlierThan]: 'Start No Earlier Than',
    [TaskConstraint.StartNoLaterThan]: 'Start No Later Than',
    [TaskConstraint.FinishNoEarlierThan]: 'Finish No Earlier Than',
    [TaskConstraint.FinishNoLaterThan]: 'Finish No Later Than',
  }

  const projectNatureLabels: Record<number, string> = {
    0: 'طراحی و پیاده‌سازی',
    1: 'پشتیبانی',
    2: 'توسعه',
    3: 'تأمین',
  }

  const clampPercentage = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null
    }
    return Math.min(100, Math.max(0, value))
  }

  const getTaskLevel = (task: Task) =>
    Math.max(0, (task.wbsCode?.split('.').length || 1) - 1)

  const formatTaskDate = (date?: string) => (date ? formatPersianDate(date) : '-')

  const getConstraintLabel = (constraint: TaskConstraint) =>
    constraintLabels[constraint] || '-'

  const getDependenciesLabel = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return '-'
    return task.dependencies
      .map((dependency) => {
        const predecessor = taskMap.get(dependency.predecessorTaskId)
        return predecessor?.wbsCode || predecessor?.name || '---'
      })
      .join(', ')
  }

  const renderGaugeCard = (label: string, value: number | null | undefined, color: string, subtitle?: string) => {
    const normalized = clampPercentage(value)
    return (
      <Card className="p-4 flex items-center gap-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gray-100" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                normalized !== null
                  ? `conic-gradient(${color} ${normalized * 3.6}deg, #E5E7EB ${normalized * 3.6}deg)`
                  : '#E5E7EB',
            }}
          />
          <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center text-lg font-bold text-gray-900">
            {normalized !== null ? `${normalized}%` : '--'}
          </div>
        </div>
        <div>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <p className="text-lg font-semibold text-gray-900">{label}</p>
        </div>
      </Card>
    )
  }

  const handleOpenProgressModal = (task: Task) => {
    setProgressModalTask(task)
    setProgressValue(task.selfReportedProgress ?? task.percentComplete ?? 0)
  }

  const handleCloseProgressModal = () => {
    setProgressModalTask(null)
    setProgressValue(0)
  }

  const handleSaveProgress = async () => {
    if (!progressModalTask) return

    const normalizedValue = Math.min(100, Math.max(0, progressValue || 0))

    try {
      await taskApi.updateProgress(progressModalTask.id, {
        selfReportedProgress: normalizedValue,
      })
      showToast('پیشرفت خوداظهاری ثبت شد', 'success')
      handleCloseProgressModal()
      loadTasks()
      loadProject()
    } catch (error) {
      console.error('Failed to save progress', error)
      showToast('ثبت پیشرفت با خطا مواجه شد', 'error')
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: 'pdf' | 'excel' | 'msp') => {
    if (!id) return
    try {
      const response =
        type === 'pdf'
          ? await reportsApi.exportPdf(id)
          : type === 'excel'
          ? await reportsApi.exportExcel(id)
          : await reportsApi.exportMsp(id)

      const extension = type === 'pdf' ? 'pdf' : type === 'excel' ? 'xlsx' : 'xml'
      downloadBlob(response.data, `Project_${project?.code ?? id}_${type}.${extension}`)
      showToast(isRTL ? 'خروجی با موفقیت ایجاد شد' : 'Export generated successfully', 'success')
    } catch (error) {
      console.error('Export failed', error)
      showToast(isRTL ? 'خروجی گیری با خطا مواجه شد' : 'Export failed', 'error')
    }
  }

  const handleFileButtonClick = (type: 'excel' | 'msp') => {
    if (type === 'excel') {
      excelInputRef.current?.click()
    } else {
      mspInputRef.current?.click()
    }
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>, type: 'excel' | 'msp') => {
    if (!id) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const response =
        type === 'excel'
          ? await reportsApi.importExcel(id, file)
          : await reportsApi.importMsp(id, file)

      const data = response.data as { activitiesFound: number; activitiesWithSchedule: number; warnings: string[] }
      const message = isRTL
        ? `فایل پردازش شد. تعداد فعالیت‌ها: ${data.activitiesFound}`
        : `File processed. Activities: ${data.activitiesFound}`
      showToast(message, 'success')

      if (data.warnings?.length) {
        data.warnings.forEach((warning) => showToast(warning, 'warning'))
      }

      loadProject()
      loadTasks()
    } catch (error) {
      console.error('Import failed', error)
      showToast(isRTL ? 'بارگذاری فایل با خطا مواجه شد' : 'Import failed', 'error')
    }
  }

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

      {/* Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderGaugeCard('پیشرفت برنامه‌ای', project.progressPercentage, '#0ea5e9', 'Planned Progress')}
        {renderGaugeCard('پیشرفت خوداظهاری', project.selfReportedProgress, '#f97316', 'Self-Reported')}
        {renderGaugeCard('پیشرفت تایید شده', project.approvedProgress, '#10b981', 'Approved')}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-600">مرکز</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {project.center || '-'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">ماهیت پروژه:</span>
                    <span className="font-medium text-gray-900">
                      {projectNatureLabels[project.nature] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">مرکز/دپارتمان:</span>
                    <span className="font-medium text-gray-900">{project.center || '-'}</span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">مدیر پروژه:</span>
                    <span className="font-medium text-gray-900">{project.projectManagerName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">مالک پروژه:</span>
                    <span className="font-medium text-gray-900">{project.ownerName || '-'}</span>
                  </div>
                  {project.lastUpdatedByExecutor && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">آخرین بروزرسانی مجری:</span>
                      <span className="font-medium text-gray-900">
                        {formatPersianDate(project.lastUpdatedByExecutor)}
                      </span>
                    </div>
                  )}
                  {project.lastApprovedByClient && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">آخرین تایید کارفرما:</span>
                      <span className="font-medium text-gray-900">
                        {formatPersianDate(project.lastApprovedByClient)}
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
          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">شیت زمان‌بندی (مشابه MSP)</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ساختار شکست، روابط پیش‌نیازی و درصد پیشرفت هر فعالیت را در یک نمای جدولی ببینید.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleExport('pdf')}>
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleExport('excel')}>
                      Excel
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleExport('msp')}>
                      MSP
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<UploadCloud className="w-4 h-4" />} onClick={() => handleFileButtonClick('excel')}>
                      وارد کردن Excel
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<UploadCloud className="w-4 h-4" />} onClick={() => handleFileButtonClick('msp')}>
                      وارد کردن MSP
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">WBS</th>
                      <th className="px-4 py-3 text-left font-medium">عنوان فعالیت</th>
                      <th className="px-4 py-3 text-left font-medium">مدت (روز)</th>
                      <th className="px-4 py-3 text-left font-medium">شروع</th>
                      <th className="px-4 py-3 text-left font-medium">پایان</th>
                      <th className="px-4 py-3 text-left font-medium">پیشرفت برنامه‌ای</th>
                      <th className="px-4 py-3 text-left font-medium">خوداظهاری</th>
                      <th className="px-4 py-3 text-left font-medium">تایید شده</th>
                      <th className="px-4 py-3 text-left font-medium">روابط پیش‌نیازی</th>
                      <th className="px-4 py-3 text-left font-medium">Constraint</th>
                      <th className="px-4 py-3 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {timelineTasks.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                          {isRTL ? 'هیچ فعالیتی ثبت نشده است' : 'No activities available'}
                        </td>
                      </tr>
                    )}
                    {timelineTasks.map((task) => {
                      const level = getTaskLevel(task)
                      const isSummary = task.type === TaskType.Summary
                      const isEditable = level >= 1 && !isSummary
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{task.wbsCode}</td>
                          <td className="px-4 py-3">
                            <div
                              className="flex items-center gap-2 text-gray-900"
                              style={{ paddingInlineStart: `${level * 16}px` }}
                            >
                              {isSummary && <span className="w-2 h-2 rounded-full bg-gray-400" />}
                              <span className={isSummary ? 'font-semibold' : ''}>{task.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{task.duration ?? '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatTaskDate(task.startDate)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatTaskDate(task.endDate)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {task.percentComplete != null ? `${task.percentComplete}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {task.selfReportedProgress != null ? `${task.selfReportedProgress}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {task.approvedProgress != null ? `${task.approvedProgress}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{getDependenciesLabel(task)}</td>
                          <td className="px-4 py-3 text-gray-600">{getConstraintLabel(task.constraint)}</td>
                          <td className="px-4 py-3 text-right">
                            {isEditable && (
                              <Button size="sm" variant="outline" onClick={() => handleOpenProgressModal(task)}>
                                {isRTL ? 'ثبت خوداظهاری' : 'Self Report'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">نمودار گانت</h3>
              {id && <GanttChart projectId={id} />}
            </Card>
          </div>
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
      <input
        type="file"
        ref={excelInputRef}
        className="hidden"
        accept=".xlsx,.csv"
        onChange={(event) => handleFileInputChange(event, 'excel')}
      />
      <input
        type="file"
        ref={mspInputRef}
        className="hidden"
        accept=".xml,.mpp"
        onChange={(event) => handleFileInputChange(event, 'msp')}
      />
      <Modal
        isOpen={progressModalTask !== null}
        onClose={handleCloseProgressModal}
        title={progressModalTask ? `ثبت پیشرفت برای ${progressModalTask.name}` : ''}
        size="sm"
      >
        <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="text-sm text-gray-600">
            {isRTL
              ? 'درصد پیشرفت خوداظهاری این فعالیت را وارد کنید. مقدار باید بین ۰ تا ۱۰۰ باشد.'
              : 'Enter the self-reported progress for this activity (0 - 100).'}
          </p>
          <Input
            label={isRTL ? 'درصد پیشرفت' : 'Progress (%)'}
            type="number"
            min={0}
            max={100}
            value={progressValue}
            onChange={(e) => setProgressValue(Number(e.target.value))}
            required
          />
          <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3`}>
            <Button variant="outline" onClick={handleCloseProgressModal}>
              {isRTL ? 'لغو' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveProgress}>{isRTL ? 'ثبت' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
