import { useState, useEffect } from 'react'
import { Task, TaskType, TaskPriority, TaskStatus, Project, Resource } from '../types'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal from './ui/Modal'
import { useI18nStore } from '../store/i18nStore'
import { Calendar, Clock, User, FileText, Tag } from 'lucide-react'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Task>) => Promise<void>
  projects: Project[]
  resources: Resource[]
  parentTasks?: Task[]
  initialData?: Partial<Task>
  projectId?: string // If provided, task will be created for this project
  defaultStartDate?: Date
  defaultDuration?: number
}

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  projects,
  resources,
  parentTasks = [],
  initialData,
  projectId,
  defaultStartDate,
  defaultDuration,
}: TaskFormProps) {
  const { isRTL } = useI18nStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    description: '',
    type: TaskType.Task,
    priority: TaskPriority.Medium,
    status: TaskStatus.NotStarted,
    startDate: defaultStartDate?.toISOString().split('T')[0] || '',
    duration: defaultDuration || 1,
    projectId: projectId || '',
    parentTaskId: '',
    assignedToId: '',
    estimatedEffort: undefined,
    estimatedCost: undefined,
    constraint: 0, // AsSoonAsPossible
    constraintDate: '',
    jiraIssueKey: undefined,
    jiraIssueId: undefined,
    ...initialData,
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          type: initialData.type ?? TaskType.Task,
          priority: initialData.priority ?? TaskPriority.Medium,
          status: initialData.status ?? TaskStatus.NotStarted,
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
          duration: initialData.duration || 1,
          projectId: initialData.projectId || projectId || '',
          parentTaskId: initialData.parentTaskId || '',
          assignedToId: initialData.assignedToId || '',
          estimatedEffort: initialData.estimatedEffort,
          estimatedCost: initialData.estimatedCost,
          constraint: initialData.constraint ?? 0,
          constraintDate: initialData.constraintDate ? new Date(initialData.constraintDate).toISOString().split('T')[0] : '',
          jiraIssueKey: initialData.jiraIssueKey,
          jiraIssueId: initialData.jiraIssueId,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          type: TaskType.Task,
          priority: TaskPriority.Medium,
          status: TaskStatus.NotStarted,
          startDate: defaultStartDate?.toISOString().split('T')[0] || '',
          duration: defaultDuration || 1,
          projectId: projectId || '',
          parentTaskId: '',
          assignedToId: '',
          estimatedEffort: undefined,
          estimatedCost: undefined,
          constraint: 0,
          constraintDate: '',
          jiraIssueKey: undefined,
          jiraIssueId: undefined,
        })
      }
    }
  }, [isOpen, initialData, projectId, defaultStartDate, defaultDuration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.projectId) {
      return
    }

    setLoading(true)
    try {
      const submitData: Partial<Task> = {
        ...formData,
        projectId: formData.projectId,
        parentTaskId: formData.parentTaskId || undefined,
        assignedToId: formData.assignedToId || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        duration: formData.duration || 1,
        estimatedEffort: formData.estimatedEffort ? Number(formData.estimatedEffort) : undefined,
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined,
        constraintDate: formData.constraintDate ? new Date(formData.constraintDate).toISOString() : undefined,
        jiraIssueKey: formData.jiraIssueKey || undefined,
        jiraIssueId: formData.jiraIssueId || undefined,
        status: formData.status ?? TaskStatus.NotStarted,
        constraint: formData.constraint ?? 0,
      }
      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Failed to submit task:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find(p => p.id === formData.projectId)
  const availableParentTasks = parentTasks.filter(
    t => t.projectId === formData.projectId && (!initialData || t.id !== initialData.id)
  )

  // Calculate end date from start date and duration
  const endDate = formData.startDate && formData.duration
    ? new Date(new Date(formData.startDate).getTime() + (formData.duration - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? (isRTL ? 'ویرایش تسک' : 'Edit Task') : (isRTL ? 'تسک جدید' : 'New Task')}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            {isRTL ? 'اطلاعات پایه' : 'Basic Information'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'نام تسک' : 'Task Name'} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isRTL ? 'نام تسک را وارد کنید' : 'Enter task name'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'پروژه' : 'Project'} *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={!!projectId}
            >
              <option value="">{isRTL ? 'انتخاب پروژه' : 'Select Project'}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'توضیحات' : 'Description'}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder={isRTL ? 'توضیحات تسک' : 'Task description'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                {isRTL ? 'نوع' : 'Type'}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) as TaskType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={TaskType.Task}>{isRTL ? 'تسک' : 'Task'}</option>
                <option value={TaskType.Milestone}>{isRTL ? 'مایلستون' : 'Milestone'}</option>
                <option value={TaskType.Summary}>{isRTL ? 'خلاصه' : 'Summary'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'اولویت' : 'Priority'}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) as TaskPriority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={TaskPriority.Low}>{isRTL ? 'کم' : 'Low'}</option>
                <option value={TaskPriority.Medium}>{isRTL ? 'متوسط' : 'Medium'}</option>
                <option value={TaskPriority.High}>{isRTL ? 'بالا' : 'High'}</option>
                <option value={TaskPriority.Critical}>{isRTL ? 'بحرانی' : 'Critical'}</option>
              </select>
            </div>
          </div>

          {selectedProject && availableParentTasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'تسک والد' : 'Parent Task'}
              </label>
              <select
                value={formData.parentTaskId || ''}
                onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{isRTL ? 'بدون والد (تسک اصلی)' : 'No Parent (Main Task)'}</option>
                {availableParentTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            {isRTL ? 'زمان‌بندی' : 'Scheduling'}
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'تاریخ شروع' : 'Start Date'}
              </label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'مدت (روز)' : 'Duration (Days)'}
              </label>
              <Input
                type="number"
                min="1"
                value={formData.duration || 1}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'تاریخ پایان' : 'End Date'}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  if (e.target.value && formData.startDate) {
                    const start = new Date(formData.startDate)
                    const end = new Date(e.target.value)
                    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                    setFormData({ ...formData, duration: days })
                  }
                }}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Assignment & Resources */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            {isRTL ? 'اختصاص و منابع' : 'Assignment & Resources'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'اختصاص به' : 'Assigned To'}
            </label>
            <select
              value={formData.assignedToId || ''}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{isRTL ? 'اختصاص داده نشده' : 'Unassigned'}</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.firstName} {resource.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                {isRTL ? 'تلاش برآورد شده (ساعت)' : 'Estimated Effort (Hours)'}
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedEffort || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedEffort: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder={isRTL ? 'ساعات' : 'Hours'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'هزینه برآورد شده' : 'Estimated Cost'}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCost || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedCost: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder={isRTL ? 'هزینه' : 'Cost'}
              />
            </div>
          </div>
        </div>

        {/* Constraints & Advanced */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" />
            {isRTL ? 'محدودیت‌ها و تنظیمات پیشرفته' : 'Constraints & Advanced Settings'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'وضعیت' : 'Status'}
              </label>
              <select
                value={formData.status ?? TaskStatus.NotStarted}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) as TaskStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={TaskStatus.NotStarted}>{isRTL ? 'شروع نشده' : 'Not Started'}</option>
                <option value={TaskStatus.InProgress}>{isRTL ? 'در حال انجام' : 'In Progress'}</option>
                <option value={TaskStatus.Completed}>{isRTL ? 'تکمیل شده' : 'Completed'}</option>
                <option value={TaskStatus.OnHold}>{isRTL ? 'متوقف شده' : 'On Hold'}</option>
                <option value={TaskStatus.Cancelled}>{isRTL ? 'لغو شده' : 'Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'محدودیت' : 'Constraint'}
              </label>
              <select
                value={formData.constraint ?? 0}
                onChange={(e) => setFormData({ ...formData, constraint: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={0}>{isRTL ? 'در اسرع وقت' : 'As Soon As Possible'}</option>
                <option value={1}>{isRTL ? 'در آخرین زمان ممکن' : 'As Late As Possible'}</option>
                <option value={2}>{isRTL ? 'باید در تاریخ شروع شود' : 'Must Start On'}</option>
                <option value={3}>{isRTL ? 'باید در تاریخ پایان یابد' : 'Must Finish On'}</option>
                <option value={4}>{isRTL ? 'زودتر از تاریخ شروع نشود' : 'Start No Earlier Than'}</option>
                <option value={5}>{isRTL ? 'دیرتر از تاریخ شروع نشود' : 'Start No Later Than'}</option>
                <option value={6}>{isRTL ? 'زودتر از تاریخ پایان نیابد' : 'Finish No Earlier Than'}</option>
                <option value={7}>{isRTL ? 'دیرتر از تاریخ پایان نیابد' : 'Finish No Later Than'}</option>
              </select>
            </div>
          </div>

          {(formData.constraint === 2 || formData.constraint === 3 || 
            formData.constraint === 4 || formData.constraint === 5 || 
            formData.constraint === 6 || formData.constraint === 7) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'تاریخ محدودیت' : 'Constraint Date'}
              </label>
              <Input
                type="date"
                value={formData.constraintDate || ''}
                onChange={(e) => setFormData({ ...formData, constraintDate: e.target.value })}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'کلید Jira Issue' : 'Jira Issue Key'}
              </label>
              <Input
                value={formData.jiraIssueKey || ''}
                onChange={(e) => setFormData({ ...formData, jiraIssueKey: e.target.value })}
                placeholder={isRTL ? 'مثال: PROJ-123' : 'e.g., PROJ-123'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'شناسه Jira Issue' : 'Jira Issue ID'}
              </label>
              <Input
                value={formData.jiraIssueId || ''}
                onChange={(e) => setFormData({ ...formData, jiraIssueId: e.target.value })}
                placeholder={isRTL ? 'شناسه Jira' : 'Jira ID'}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {isRTL ? 'انصراف' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={loading || !formData.name || !formData.projectId}>
            {loading ? (isRTL ? 'در حال ذخیره...' : 'Saving...') : initialData ? (isRTL ? 'ذخیره' : 'Save') : (isRTL ? 'ایجاد' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

