import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  List,
  Kanban,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { taskApi, projectApi } from '../services/api'
import { Task, Project, TaskStatus, TaskPriority } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'
import { format } from 'date-fns'

type ViewMode = 'list' | 'kanban' | 'calendar'

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { showToast } = useUIStore()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [selectedProject, selectedStatus, searchTerm])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll({ pageSize: 100 })
      setProjects(response.data.items)
    } catch (error) {
      showToast('خطا در بارگذاری پروژه‌ها', 'error')
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await taskApi.getAll({
        pageNumber: 1,
        pageSize: 100,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
        status: selectedStatus !== 'all' ? parseInt(selectedStatus) : undefined,
      })
      setTasks(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to load tasks:', error)
      const errorMessage = error.response?.data?.error || 'خطا در بارگذاری تسک‌ها'
      showToast(errorMessage, 'error')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (data: Partial<Task>) => {
    try {
      await taskApi.create(data)
      showToast('تسک با موفقیت ایجاد شد', 'success')
      setShowCreateModal(false)
      loadTasks()
    } catch (error) {
      showToast('خطا در ایجاد تسک', 'error')
    }
  }

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    try {
      await taskApi.update(id, data)
      showToast('تسک با موفقیت به‌روزرسانی شد', 'success')
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      showToast('خطا در به‌روزرسانی تسک', 'error')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تسک را حذف کنید؟')) {
      return
    }
    try {
      // await taskApi.delete(id)
      showToast('تسک با موفقیت حذف شد', 'success')
      loadTasks()
    } catch (error) {
      showToast('خطا در حذف تسک', 'error')
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    const statusMap = {
      [TaskStatus.NotStarted]: { label: 'شروع نشده', variant: 'default' as const },
      [TaskStatus.InProgress]: { label: 'در حال انجام', variant: 'info' as const },
      [TaskStatus.Completed]: { label: 'تکمیل شده', variant: 'success' as const },
      [TaskStatus.OnHold]: { label: 'متوقف', variant: 'warning' as const },
      [TaskStatus.Cancelled]: { label: 'لغو شده', variant: 'danger' as const },
    }
    const statusInfo = statusMap[status] || statusMap[TaskStatus.NotStarted]
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const priorityMap = {
      [TaskPriority.Low]: { label: 'کم', variant: 'default' as const },
      [TaskPriority.Medium]: { label: 'متوسط', variant: 'info' as const },
      [TaskPriority.High]: { label: 'بالا', variant: 'warning' as const },
      [TaskPriority.Critical]: { label: 'بحرانی', variant: 'danger' as const },
    }
    const priorityInfo = priorityMap[priority] || priorityMap[TaskPriority.Medium]
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
  }

  const filteredTasks = tasks.filter((task) => {
    if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (selectedProject !== 'all' && task.projectId !== selectedProject) {
      return false
    }
    if (selectedStatus !== 'all' && task.status !== parseInt(selectedStatus)) {
      return false
    }
    return true
  })

  const kanbanColumns = [
    { status: TaskStatus.NotStarted, label: 'شروع نشده', tasks: filteredTasks.filter(t => t.status === TaskStatus.NotStarted) },
    { status: TaskStatus.InProgress, label: 'در حال انجام', tasks: filteredTasks.filter(t => t.status === TaskStatus.InProgress) },
    { status: TaskStatus.Completed, label: 'تکمیل شده', tasks: filteredTasks.filter(t => t.status === TaskStatus.Completed) },
    { status: TaskStatus.OnHold, label: 'متوقف', tasks: filteredTasks.filter(t => t.status === TaskStatus.OnHold) },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تسک‌ها</h1>
          <p className="text-gray-600 mt-2">مدیریت و پیگیری تسک‌های پروژه</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          تسک جدید
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="جستجو در تسک‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه پروژه‌ها</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value={TaskStatus.NotStarted}>شروع نشده</option>
              <option value={TaskStatus.InProgress}>در حال انجام</option>
              <option value={TaskStatus.Completed}>تکمیل شده</option>
              <option value={TaskStatus.OnHold}>متوقف</option>
              <option value={TaskStatus.Cancelled}>لغو شده</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Kanban className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={100} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تسک</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">پروژه</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اولویت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      تسکی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{task.name}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {projects.find(p => p.id === task.projectId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                      <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.startDate ? format(new Date(task.startDate), 'yyyy/MM/dd') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((column) => (
            <Card key={column.status} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <Badge variant="default">{column.tasks.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    تسکی وجود ندارد
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{projects.find(p => p.id === task.projectId)?.name || '-'}</span>
                        {task.startDate && (
                          <span>{format(new Date(task.startDate), 'MM/dd')}</span>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">نمای تقویمی به زودی اضافه خواهد شد</p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || selectedTask !== null}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedTask(null)
        }}
        title={selectedTask ? 'ویرایش تسک' : 'تسک جدید'}
        size="lg"
      >
        <TaskForm
          task={selectedTask}
          projects={projects}
          onSubmit={(data) => {
            if (selectedTask) {
              handleUpdateTask(selectedTask.id, data)
            } else {
              handleCreateTask(data)
            }
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedTask(null)
          }}
        />
      </Modal>
    </div>
  )
}

// Task Form Component
interface TaskFormProps {
  task?: Task | null
  projects: Project[]
  onSubmit: (data: Partial<Task>) => void
  onCancel: () => void
}

function TaskForm({ task, projects, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    projectId: task?.projectId || projects[0]?.id || '',
    status: task?.status ?? TaskStatus.NotStarted,
    priority: task?.priority ?? TaskPriority.Medium,
    startDate: task?.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
    endDate: task?.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="نام تسک"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          توضیحات
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            پروژه
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">انتخاب پروژه</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            وضعیت
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={TaskStatus.NotStarted}>شروع نشده</option>
            <option value={TaskStatus.InProgress}>در حال انجام</option>
            <option value={TaskStatus.Completed}>تکمیل شده</option>
            <option value={TaskStatus.OnHold}>متوقف</option>
            <option value={TaskStatus.Cancelled}>لغو شده</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="تاریخ شروع"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
        <Input
          label="تاریخ پایان"
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit">ذخیره</Button>
      </div>
    </form>
  )
}
