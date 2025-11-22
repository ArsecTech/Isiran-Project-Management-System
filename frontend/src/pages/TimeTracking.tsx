import { useEffect, useState } from 'react'
import { Clock, Plus, Calendar, Download } from 'lucide-react'
import api, { projectApi } from '../services/api'
import { Task, Project } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import { format } from 'date-fns'

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
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const { showToast } = useUIStore()
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
    if (formData.taskId) {
      // Load tasks for selected project
      loadTasks()
    }
  }, [formData.taskId])

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
      const errorMessage = error.response?.data?.error || 'خطا در بارگذاری ثبت‌های زمان'
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
      showToast('خطا در بارگذاری پروژه‌ها', 'error')
    }
  }

  const loadTasks = async () => {
    if (!selectedProject || selectedProject === 'all') {
      setTasks([])
      return
    }
    try {
      const response = await taskApi.getAll({
        pageNumber: 1,
        pageSize: 100,
        projectId: selectedProject,
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
      showToast('خطا در بارگذاری منابع', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/timetracking', formData)
      showToast('ثبت زمان با موفقیت انجام شد', 'success')
      setShowModal(false)
      setFormData({
        taskId: '',
        resourceId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        description: '',
        isBillable: true,
      })
      loadTimeEntries()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'خطا در ثبت زمان', 'error')
    }
  }

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billableHours = timeEntries
    .filter((e) => e.isBillable)
    .reduce((sum, entry) => sum + entry.hours, 0)
  const totalCost = timeEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ردیابی زمان</h1>
          <p className="text-gray-600 mt-2">ثبت و مدیریت زمان کار روی تسک‌ها</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          ثبت جدید
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
                ${totalCost.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پروژه
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه پروژه‌ها</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              از تاریخ
            </label>
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, start: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تا تاریخ
            </label>
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, end: e.target.value })
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
              پاک کردن فیلترها
            </Button>
          </div>
        </div>
      </Card>

      {/* Time Entries Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">ثبت‌های زمان</h2>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
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
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>ثبت زمانی یافت نشد</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تسک
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    منبع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    ساعات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    قابل صورتحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    هزینه
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(entry.date), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.taskName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.resourceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={entry.isBillable ? 'success' : 'default'}
                      >
                        {entry.isBillable ? 'بله' : 'خیر'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${entry.cost?.toFixed(2) || '0.00'}
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
        title="ثبت زمان جدید"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پروژه
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value)
                setFormData({ ...formData, taskId: '' })
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">انتخاب پروژه</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تسک
            </label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              required
              disabled={!selectedProject || selectedProject === 'all'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">ابتدا پروژه را انتخاب کنید</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              منبع
            </label>
            <select
              value={formData.resourceId}
              onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">انتخاب منبع</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.fullName || `${resource.firstName} ${resource.lastName}`}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="تاریخ"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="ساعات"
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
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) =>
                setFormData({ ...formData, isBillable: e.target.checked })
              }
              className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="text-sm text-gray-700">قابل صورتحساب</label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              انصراف
            </Button>
            <Button type="submit">ذخیره</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
