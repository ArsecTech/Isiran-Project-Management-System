import { useEffect, useState } from 'react'
import { Clock, Plus, Calendar, Download } from 'lucide-react'
import api, { projectApi, taskApi } from '../services/api'
import { Task, Project } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import { formatPersianDate, formatRialSimple } from '../utils/dateUtils'
import { useI18nStore } from '../store/i18nStore'
import PersianDatePicker from '../components/ui/PersianDatePicker'

interface TimeEntry {
  id: string
  taskId: string
  taskName: string
  resourceId: string
  resourceName: string
  date: string
  hours: number
  description?: string
  isBillable: boolean
  cost?: number
}

export default function TimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedProjectInModal, setSelectedProjectInModal] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()
  const [formData, setFormData] = useState({
    taskId: '',
    resourceId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: '',
    isBillable: true,
  })

  useEffect(() => {
    loadTimeEntries()
    loadProjects()
    loadResources()
  }, [selectedProject, dateFilter])

  useEffect(() => {
    // Load tasks when project is selected in modal
    if (selectedProjectInModal && selectedProjectInModal !== 'all') {
      loadTasksForProject(selectedProjectInModal)
    } else {
      setTasks([])
    }
  }, [selectedProjectInModal])

  const loadTimeEntries = async () => {
    try {
      setLoading(true)
      const params: any = {
        pageNumber: 1,
        pageSize: 100,
      }
      if (dateFilter.start) params.startDate = dateFilter.start
      if (dateFilter.end) params.endDate = dateFilter.end
      if (selectedProject !== 'all') params.projectId = selectedProject

      const response = await api.get<{ items: TimeEntry[] }>('/timetracking', { params })
      setTimeEntries(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to load time entries:', error)
      const errorMessage = error.response?.data?.error || (isRTL ? 'خطا در بارگذاری ثبت‌های زمان' : 'Failed to load time entries')
      showToast(errorMessage, 'error')
      setTimeEntries([])
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll({ pageSize: 100 })
      setProjects(response.data.items)
    } catch (error) {
      showToast(isRTL ? 'خطا در بارگذاری پروژه‌ها' : 'Failed to load projects', 'error')
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    if (!projectId || projectId === 'all') {
      setTasks([])
      return
    }
    try {
      const response = await taskApi.getAll({
        pageNumber: 1,
        pageSize: 100,
        projectId: projectId,
      })
      setTasks(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to load tasks:', error)
      setTasks([])
    }
  }

  const loadResources = async () => {
    try {
      const response = await api.get('/resources', {
        params: { pageNumber: 1, pageSize: 100 },
      })
      setResources(response.data.items || [])
    } catch (error) {
      showToast(isRTL ? 'خطا در بارگذاری منابع' : 'Failed to load resources', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/timetracking', formData)
      showToast(isRTL ? 'ثبت زمان با موفقیت انجام شد' : 'Time entry created successfully', 'success')
      setShowModal(false)
      setFormData({
        taskId: '',
        resourceId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        description: '',
        isBillable: true,
      })
      setSelectedProjectInModal('all')
      setTasks([])
      loadTimeEntries()
    } catch (error: any) {
      showToast(error.response?.data?.error || (isRTL ? 'خطا در ثبت زمان' : 'Failed to create time entry'), 'error')
    }
  }

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billableHours = timeEntries
    .filter((e) => e.isBillable)
    .reduce((sum, entry) => sum + entry.hours, 0)
  const totalCost = timeEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0)

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('timeTracking.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('timeTracking.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            setShowModal(true)
            setSelectedProjectInModal('all')
            setFormData({
              taskId: '',
              resourceId: '',
              date: new Date().toISOString().split('T')[0],
              hours: 0,
              description: '',
              isBillable: true,
            })
            setTasks([])
          }}
          leftIcon={<Plus className="w-5 h-5" />}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {t('timeTracking.create')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کل ساعات</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalHours.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ساعات قابل صورتحساب</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {billableHours.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کل هزینه</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatRialSimple(totalCost)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
        <div className={`flex flex-col lg:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.project')}
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('timeTracking.allProjects')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <PersianDatePicker
              label={t('timeTracking.fromDate')}
              value={dateFilter.start}
              onChange={(value) =>
                setDateFilter({ ...dateFilter, start: value })
              }
            />
          </div>
          <div>
            <PersianDatePicker
              label={t('timeTracking.toDate')}
              value={dateFilter.end}
              onChange={(value) =>
                setDateFilter({ ...dateFilter, end: value })
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setDateFilter({ start: '', end: '' })
                setSelectedProject('all')
              }}
            >
              {t('timeTracking.clearFilters')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Time Entries Table */}
      <Card className="p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50/50">
        <div className={`p-6 border-b border-gray-200 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('timeTracking.timeEntries')}
          </h2>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            {isRTL ? 'خروجی' : 'Export'}
          </Button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={60} />
              ))}
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 text-lg font-medium mb-2">{t('timeTracking.noEntries')}</p>
              <Button onClick={() => setShowModal(true)} variant="outline" size="sm">
                {t('timeTracking.createNew')}
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.date')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.task')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.resource')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.hours')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.isBillable')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('timeTracking.totalCost')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPersianDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{entry.taskName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.resourceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {entry.hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={entry.isBillable ? 'success' : 'default'}
                      >
                        {entry.isBillable ? (isRTL ? 'بله' : 'Yes') : (isRTL ? 'خیر' : 'No')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {entry.cost != null ? formatRialSimple(entry.cost) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('timeTracking.create')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.project')}
            </label>
            <select
              value={selectedProjectInModal}
              onChange={(e) => {
                const newProjectId = e.target.value
                setSelectedProjectInModal(newProjectId)
                setFormData({ ...formData, taskId: '' })
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('tasks.selectProject')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeTracking.task')}
            </label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              required
              disabled={!selectedProjectInModal || selectedProjectInModal === 'all'}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="">{t('tasks.selectProjectFirst')}</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeTracking.resource')}
            </label>
            <select
              value={formData.resourceId}
              onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="">{isRTL ? 'انتخاب منبع' : 'Select Resource'}</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.fullName || `${resource.firstName} ${resource.lastName}`}
                </option>
              ))}
            </select>
          </div>

          <PersianDatePicker
            label={t('timeTracking.date')}
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            required
          />

          <Input
            label={t('timeTracking.hours')}
            type="number"
            step="0.25"
            min="0"
            value={formData.hours}
            onChange={(e) =>
              setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeTracking.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) =>
                setFormData({ ...formData, isBillable: e.target.checked })
              }
              className={`${isRTL ? 'ml-2' : 'mr-2'} w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500`}
            />
            <label className="text-sm text-gray-700">{t('timeTracking.isBillable')}</label>
          </div>

          <div className={`flex items-center ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3 pt-4`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
