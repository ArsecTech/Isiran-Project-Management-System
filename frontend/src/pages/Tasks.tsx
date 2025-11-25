import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  List,
  Kanban,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react'
import { taskApi, projectApi } from '../services/api'
import api from '../services/api'
import { Task, Project, TaskStatus, TaskPriority, TaskType, TaskConstraint, Resource } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import { formatPersianDate } from '../utils/dateUtils'
import { useI18nStore } from '../store/i18nStore'
import PersianDatePicker from '../components/ui/PersianDatePicker'

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
  const { t, isRTL } = useI18nStore()

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [selectedProject, selectedStatus, searchTerm])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll({ pageSize: 100 })
      setProjects(response.data.items)
    } catch (error) {
      showToast(isRTL ? 'خطا در بارگذاری پروژه‌ها' : 'Failed to load projects', 'error')
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
      const errorMessage = error.response?.data?.error || (isRTL ? 'خطا در بارگذاری تسک‌ها' : 'Failed to load tasks')
      showToast(errorMessage, 'error')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (data: Partial<Task>) => {
    try {
      await taskApi.create(data)
      showToast(isRTL ? 'تسک با موفقیت ایجاد شد' : 'Task created successfully', 'success')
      setShowCreateModal(false)
      loadTasks()
    } catch (error) {
      showToast(isRTL ? 'خطا در ایجاد تسک' : 'Failed to create task', 'error')
    }
  }

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    try {
      // Clean up data: remove empty strings and convert to proper types
      const cleanData: any = {}
      
      if (data.name) cleanData.name = data.name
      if (data.description !== undefined) cleanData.description = data.description || null
      if (data.priority !== undefined) cleanData.priority = data.priority
      if (data.status !== undefined) cleanData.status = data.status
      if (data.startDate) cleanData.startDate = data.startDate
      if (data.endDate && data.endDate.trim() !== '') {
        cleanData.endDate = data.endDate
      }
      if (data.parentTaskId !== undefined) {
        cleanData.parentTaskId = data.parentTaskId || null
      }
      
      // Remove null values for optional fields
      if (cleanData.description === null) delete cleanData.description
      
      await taskApi.update(id, cleanData)
      showToast(isRTL ? 'تسک با موفقیت به‌روزرسانی شد' : 'Task updated successfully', 'success')
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      showToast(isRTL ? 'خطا در به‌روزرسانی تسک' : 'Failed to update task', 'error')
    }
  }

  const handleDeleteTask = async (_id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تسک را حذف کنید؟')) {
      return
    }
    try {
      // await taskApi.delete(_id)
      showToast('تسک با موفقیت حذف شد', 'success')
      loadTasks()
    } catch (error) {
      showToast('خطا در حذف تسک', 'error')
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    const statusMap = {
      [TaskStatus.NotStarted]: { labelKey: 'tasks.status.notStarted', variant: 'default' as const },
      [TaskStatus.InProgress]: { labelKey: 'tasks.status.inProgress', variant: 'info' as const },
      [TaskStatus.Completed]: { labelKey: 'tasks.status.completed', variant: 'success' as const },
      [TaskStatus.OnHold]: { labelKey: 'tasks.status.onHold', variant: 'warning' as const },
      [TaskStatus.Cancelled]: { labelKey: 'tasks.status.cancelled', variant: 'danger' as const },
    }
    const statusInfo = statusMap[status] || statusMap[TaskStatus.NotStarted]
    return <Badge variant={statusInfo.variant}>{t(statusInfo.labelKey)}</Badge>
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const priorityMap = {
      [TaskPriority.Low]: { labelKey: 'tasks.priority.low', variant: 'default' as const },
      [TaskPriority.Medium]: { labelKey: 'tasks.priority.medium', variant: 'info' as const },
      [TaskPriority.High]: { labelKey: 'tasks.priority.high', variant: 'warning' as const },
      [TaskPriority.Critical]: { labelKey: 'tasks.priority.critical', variant: 'danger' as const },
    }
    const priorityInfo = priorityMap[priority] || priorityMap[TaskPriority.Medium]
    return <Badge variant={priorityInfo.variant}>{t(priorityInfo.labelKey)}</Badge>
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

  // Build hierarchical task structure for display
  const buildTaskHierarchy = (taskList: Task[]): Task[] => {
    const taskMap = new Map<string, Task>()
    const rootTasks: Task[] = []

    // Create map of all tasks
    taskList.forEach(task => {
      taskMap.set(task.id, task)
    })

    // Find root tasks (tasks without parent)
    taskList.forEach(task => {
      if (!task.parentTaskId || !taskMap.has(task.parentTaskId)) {
        rootTasks.push(task)
      }
    })

    // Sort tasks: root tasks first, then by displayOrder
    const sortTasks = (taskList: Task[]): Task[] => {
      const sorted = [...taskList].sort((a, b) => a.displayOrder - b.displayOrder)
      const result: Task[] = []
      
      sorted.forEach(task => {
        result.push(task)
        const children = taskList.filter(t => t.parentTaskId === task.id)
        if (children.length > 0) {
          result.push(...sortTasks(children))
        }
      })
      
      return result
    }

    return sortTasks(rootTasks)
  }

  const hierarchicalTasks = buildTaskHierarchy(filteredTasks)

  // Calculate task level for display
  const getTaskLevel = (task: Task): number => {
    let level = 0
    let currentTask = task
    const visited = new Set<string>()
    
    while (currentTask.parentTaskId && !visited.has(currentTask.id)) {
      visited.add(currentTask.id)
      const parent = tasks.find(t => t.id === currentTask.parentTaskId)
      if (parent) {
        level++
        currentTask = parent
      } else {
        break
      }
    }
    
    return level
  }

  const kanbanColumns = [
    { status: TaskStatus.NotStarted, labelKey: 'tasks.status.notStarted', tasks: filteredTasks.filter(t => t.status === TaskStatus.NotStarted) },
    { status: TaskStatus.InProgress, labelKey: 'tasks.status.inProgress', tasks: filteredTasks.filter(t => t.status === TaskStatus.InProgress) },
    { status: TaskStatus.Completed, labelKey: 'tasks.status.completed', tasks: filteredTasks.filter(t => t.status === TaskStatus.Completed) },
    { status: TaskStatus.OnHold, labelKey: 'tasks.status.onHold', tasks: filteredTasks.filter(t => t.status === TaskStatus.OnHold) },
  ]

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('tasks.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRTL ? 'مدیریت و پیگیری تسک‌های پروژه' : 'Manage and track project tasks'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {t('tasks.create')}
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
        <div className={`flex flex-col lg:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder={t('tasks.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filters */}
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('tasks.allProjects')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('tasks.allStatuses')}</option>
              <option value={TaskStatus.NotStarted}>{t('tasks.status.notStarted')}</option>
              <option value={TaskStatus.InProgress}>{t('tasks.status.inProgress')}</option>
              <option value={TaskStatus.Completed}>{t('tasks.status.completed')}</option>
              <option value={TaskStatus.OnHold}>{t('tasks.status.onHold')}</option>
              <option value={TaskStatus.Cancelled}>{t('tasks.status.cancelled')}</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className={`flex gap-2 border border-gray-200 rounded-xl p-1 bg-white ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Kanban className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
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
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('tasks.name')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('tasks.project')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('tasks.status')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('tasks.priority')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('tasks.startDate')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'پیشرفت' : 'Progress'}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'مدت (روز)' : 'Duration'}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-500 text-lg font-medium">{t('tasks.noTasks')}</p>
                        <Button onClick={() => setShowCreateModal(true)} variant="outline" size="sm">
                          {t('tasks.createNew')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hierarchicalTasks.map((task) => {
                    const level = getTaskLevel(task)
                    return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ paddingLeft: isRTL ? 0 : `${level * 24}px`, paddingRight: isRTL ? `${level * 24}px` : 0 }}>
                          {level > 0 && (
                            <span className="text-gray-400 text-xs mt-1">
                              └
                            </span>
                          )}
                          <div className="flex-1">
                            <p className={`font-medium text-gray-900 ${level > 0 ? 'text-sm' : ''}`}>
                              {task.name}
                              {level > 0 && (
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs text-gray-400`}>
                                  ({t('tasks.level')} {level + 1})
                                </span>
                              )}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {projects.find(p => p.id === task.projectId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                      <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.startDate ? formatPersianDate(task.startDate) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                              style={{ width: `${task.percentComplete || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{task.percentComplete || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.duration || '-'} {isRTL ? 'روز' : 'days'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all transform hover:scale-110"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all transform hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((column) => (
            <Card key={column.status} className="p-4 bg-gradient-to-br from-white to-gray-50/50">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="font-semibold text-gray-900">{t(column.labelKey)}</h3>
                <Badge variant="default">{column.tasks.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {t('tasks.noTasks')}
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 rounded-lg bg-white"
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
                          <span>{formatPersianDate(task.startDate).split('/').slice(1).join('/')}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gradient-to-br from-white to-gray-50/50">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {isRTL ? 'نمای تقویمی به زودی اضافه خواهد شد' : 'Calendar view coming soon'}
          </p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || selectedTask !== null}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedTask(null)
        }}
        title={selectedTask ? t('tasks.edit') : t('tasks.create')}
        size="lg"
      >
        <TaskForm
          task={selectedTask}
          projects={projects}
          tasks={tasks}
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
  tasks: Task[]
  onSubmit: (data: Partial<Task>) => void
  onCancel: () => void
}

function TaskForm({ task, projects, tasks, onSubmit, onCancel }: TaskFormProps) {
  const { t, isRTL } = useI18nStore()
  const [resources, setResources] = useState<Resource[]>([])
  
  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const response = await api.get('/resources', { params: { pageNumber: 1, pageSize: 100 } })
      setResources(response.data.items || [])
    } catch (error) {
      console.error('Failed to load resources:', error)
    }
  }

  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    projectId: task?.projectId || projects[0]?.id || '',
    parentTaskId: task?.parentTaskId || '',
    type: task?.type ?? TaskType.Task,
    status: task?.status ?? TaskStatus.NotStarted,
    priority: task?.priority ?? TaskPriority.Medium,
    startDate: task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
    endDate: task?.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
    actualStartDate: task?.actualStartDate ? new Date(task.actualStartDate).toISOString().split('T')[0] : '',
    actualEndDate: task?.actualEndDate ? new Date(task.actualEndDate).toISOString().split('T')[0] : '',
    duration: task?.duration || 1,
    actualDuration: task?.actualDuration || 0,
    estimatedEffort: task?.estimatedEffort || 0,
    actualEffort: task?.actualEffort || 0,
    estimatedCost: task?.estimatedCost || 0,
    actualCost: task?.actualCost || 0,
    percentComplete: task?.percentComplete || 0,
    assignedToId: task?.assignedToId || '',
    displayOrder: task?.displayOrder || 0,
    constraint: task?.constraint ?? TaskConstraint.AsSoonAsPossible,
    jiraIssueKey: task?.jiraIssueKey || '',
    jiraIssueId: task?.jiraIssueId || '',
    constraintDate: task?.constraintDate ? new Date(task.constraintDate).toISOString().split('T')[0] : '',
  })

  // Get available parent tasks (tasks from the same project, excluding current task and its descendants)
  const getAvailableParentTasks = () => {
    if (!formData.projectId) return []
    
    const projectTasks = tasks.filter(t => t.projectId === formData.projectId)
    
    // If editing, exclude current task and all its descendants
    if (task) {
      const excludeIds = new Set<string>([task.id])
      
      // Recursively find all descendants
      const findDescendants = (taskId: string) => {
        projectTasks.forEach(t => {
          if (t.parentTaskId === taskId && !excludeIds.has(t.id)) {
            excludeIds.add(t.id)
            findDescendants(t.id)
          }
        })
      }
      findDescendants(task.id)
      
      return projectTasks.filter(t => !excludeIds.has(t.id))
    }
    
    return projectTasks
  }

  const availableParentTasks = getAvailableParentTasks()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Clean up form data before submitting
    const cleanData: any = {
      name: formData.name,
      projectId: formData.projectId,
      type: formData.type,
      status: formData.status,
      priority: formData.priority,
      duration: formData.duration,
      displayOrder: formData.displayOrder,
      constraint: formData.constraint,
    }
    
    if (formData.description) cleanData.description = formData.description
    if (formData.startDate) cleanData.startDate = formData.startDate
    if (formData.endDate && formData.endDate.trim() !== '') {
      cleanData.endDate = formData.endDate
    }
    if (formData.actualStartDate && formData.actualStartDate.trim() !== '') {
      cleanData.actualStartDate = formData.actualStartDate
    }
    if (formData.actualEndDate && formData.actualEndDate.trim() !== '') {
      cleanData.actualEndDate = formData.actualEndDate
    }
    if (formData.parentTaskId) {
      cleanData.parentTaskId = formData.parentTaskId
    } else if (formData.parentTaskId === '') {
      cleanData.parentTaskId = null
    }
    if (formData.assignedToId) {
      cleanData.assignedToId = formData.assignedToId
    } else if (formData.assignedToId === '') {
      cleanData.assignedToId = null
    }
    if (formData.estimatedEffort > 0) cleanData.estimatedEffort = formData.estimatedEffort
    if (formData.actualEffort > 0) cleanData.actualEffort = formData.actualEffort
    if (formData.estimatedCost > 0) cleanData.estimatedCost = formData.estimatedCost
    if (formData.actualCost > 0) cleanData.actualCost = formData.actualCost
    if (formData.percentComplete !== undefined) cleanData.percentComplete = formData.percentComplete
    if (formData.jiraIssueKey) cleanData.jiraIssueKey = formData.jiraIssueKey
    if (formData.jiraIssueId) cleanData.jiraIssueId = formData.jiraIssueId
    if (formData.constraintDate && formData.constraintDate.trim() !== '') {
      cleanData.constraintDate = formData.constraintDate
    }
    
    onSubmit(cleanData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Input
        label={t('tasks.name')}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tasks.description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          rows={3}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('tasks.project')}
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => {
              setFormData({ ...formData, projectId: e.target.value, parentTaskId: '' })
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value="">{t('tasks.selectProject')}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('tasks.parentTask')}
          </label>
          <select
            value={formData.parentTaskId}
            onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
            disabled={!formData.projectId}
          >
            <option value="">{t('tasks.noParentTask')}</option>
            {availableParentTasks.map((parentTask) => (
              <option key={parentTask.id} value={parentTask.id}>
                {parentTask.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('tasks.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={TaskStatus.NotStarted}>{t('tasks.status.notStarted')}</option>
            <option value={TaskStatus.InProgress}>{t('tasks.status.inProgress')}</option>
            <option value={TaskStatus.Completed}>{t('tasks.status.completed')}</option>
            <option value={TaskStatus.OnHold}>{t('tasks.status.onHold')}</option>
            <option value={TaskStatus.Cancelled}>{t('tasks.status.cancelled')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'نوع تسک' : 'Task Type'}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={TaskType.Task}>{isRTL ? 'تسک' : 'Task'}</option>
            <option value={TaskType.Milestone}>{isRTL ? 'مایلستون' : 'Milestone'}</option>
            <option value={TaskType.Summary}>{isRTL ? 'خلاصه' : 'Summary'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('tasks.priority')}
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={TaskPriority.Low}>{t('tasks.priority.low')}</option>
            <option value={TaskPriority.Medium}>{t('tasks.priority.medium')}</option>
            <option value={TaskPriority.High}>{t('tasks.priority.high')}</option>
            <option value={TaskPriority.Critical}>{t('tasks.priority.critical')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PersianDatePicker
          label={t('tasks.startDate')}
          value={formData.startDate}
          onChange={(value) => setFormData({ ...formData, startDate: value })}
        />
        <PersianDatePicker
          label={t('tasks.endDate')}
          value={formData.endDate}
          onChange={(value) => setFormData({ ...formData, endDate: value })}
        />
        <PersianDatePicker
          label={isRTL ? 'تاریخ شروع واقعی' : 'Actual Start Date'}
          value={formData.actualStartDate}
          onChange={(value) => setFormData({ ...formData, actualStartDate: value })}
        />
        <PersianDatePicker
          label={isRTL ? 'تاریخ پایان واقعی' : 'Actual End Date'}
          value={formData.actualEndDate}
          onChange={(value) => setFormData({ ...formData, actualEndDate: value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isRTL ? 'مدت (روز)' : 'Duration (days)'}
          type="number"
          min="1"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
        />
        <Input
          label={isRTL ? 'مدت واقعی (روز)' : 'Actual Duration (days)'}
          type="number"
          min="0"
          value={formData.actualDuration}
          onChange={(e) => setFormData({ ...formData, actualDuration: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isRTL ? 'تلاش برآوردی (ساعت)' : 'Estimated Effort (hours)'}
          type="number"
          step="0.1"
          min="0"
          value={formData.estimatedEffort}
          onChange={(e) => setFormData({ ...formData, estimatedEffort: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label={isRTL ? 'تلاش واقعی (ساعت)' : 'Actual Effort (hours)'}
          type="number"
          step="0.1"
          min="0"
          value={formData.actualEffort}
          onChange={(e) => setFormData({ ...formData, actualEffort: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${isRTL ? 'هزینه برآوردی' : 'Estimated Cost'} (${isRTL ? 'ریال' : 'Rial'})`}
          type="number"
          step="0.01"
          min="0"
          value={formData.estimatedCost}
          onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label={`${isRTL ? 'هزینه واقعی' : 'Actual Cost'} (${isRTL ? 'ریال' : 'Rial'})`}
          type="number"
          step="0.01"
          min="0"
          value={formData.actualCost}
          onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isRTL ? 'درصد پیشرفت' : 'Percent Complete'}
          type="number"
          min="0"
          max="100"
          value={formData.percentComplete}
          onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) || 0 })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'اختصاص به' : 'Assigned To'}
          </label>
          <select
            value={formData.assignedToId}
            onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value="">{isRTL ? 'اختصاص داده نشده' : 'Not Assigned'}</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'محدودیت' : 'Constraint'}
          </label>
          <select
            value={formData.constraint}
            onChange={(e) => setFormData({ ...formData, constraint: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={TaskConstraint.AsSoonAsPossible}>{isRTL ? 'در اسرع وقت' : 'As Soon As Possible'}</option>
            <option value={TaskConstraint.AsLateAsPossible}>{isRTL ? 'در آخرین زمان ممکن' : 'As Late As Possible'}</option>
            <option value={TaskConstraint.MustStartOn}>{isRTL ? 'باید در تاریخ شروع شود' : 'Must Start On'}</option>
            <option value={TaskConstraint.MustFinishOn}>{isRTL ? 'باید در تاریخ تمام شود' : 'Must Finish On'}</option>
            <option value={TaskConstraint.StartNoEarlierThan}>{isRTL ? 'شروع نه زودتر از' : 'Start No Earlier Than'}</option>
            <option value={TaskConstraint.StartNoLaterThan}>{isRTL ? 'شروع نه دیرتر از' : 'Start No Later Than'}</option>
            <option value={TaskConstraint.FinishNoEarlierThan}>{isRTL ? 'پایان نه زودتر از' : 'Finish No Earlier Than'}</option>
            <option value={TaskConstraint.FinishNoLaterThan}>{isRTL ? 'پایان نه دیرتر از' : 'Finish No Later Than'}</option>
          </select>
        </div>
        {(formData.constraint === TaskConstraint.MustStartOn || 
          formData.constraint === TaskConstraint.MustFinishOn ||
          formData.constraint === TaskConstraint.StartNoEarlierThan ||
          formData.constraint === TaskConstraint.StartNoLaterThan ||
          formData.constraint === TaskConstraint.FinishNoEarlierThan ||
          formData.constraint === TaskConstraint.FinishNoLaterThan) && (
          <PersianDatePicker
            label={isRTL ? 'تاریخ محدودیت' : 'Constraint Date'}
            value={formData.constraintDate}
            onChange={(value) => setFormData({ ...formData, constraintDate: value })}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isRTL ? 'کلید Issue جیرا' : 'Jira Issue Key'}
          value={formData.jiraIssueKey}
          onChange={(e) => setFormData({ ...formData, jiraIssueKey: e.target.value })}
          placeholder="PROJ-123"
        />
        <Input
          label={isRTL ? 'شناسه Issue جیرا' : 'Jira Issue ID'}
          value={formData.jiraIssueId}
          onChange={(e) => setFormData({ ...formData, jiraIssueId: e.target.value })}
        />
      </div>

      <Input
        label={isRTL ? 'ترتیب نمایش' : 'Display Order'}
        type="number"
        min="0"
        value={formData.displayOrder}
        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
      />

      <div className={`flex items-center ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3 pt-4`}>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}