import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../services/api'
import { Project, PagedResult, ProjectStatus, ProjectPriority } from '../types'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useProjectStore } from '../store/projectStore'
import { useI18nStore } from '../store/i18nStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'
import { formatPersianDate, formatRialSimple } from '../utils/dateUtils'
import PersianDatePicker from '../components/ui/PersianDatePicker'

export default function Projects() {
  const { projects, setProjects, isLoading, setLoading } = useProjectStore()
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pagination, setPagination] = useState<PagedResult<Project> | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
  })

  useEffect(() => {
    loadProjects()
  }, [pageNumber, searchTerm, filters])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectApi.getAll({
        pageNumber,
        pageSize: 12,
        searchTerm: searchTerm || undefined,
        status: filters.status !== 'all' ? parseInt(filters.status) : undefined,
        priority: filters.priority !== 'all' ? parseInt(filters.priority) : undefined,
      })
      setProjects(response.data.items || [])
      setPagination(response.data)
    } catch (error: any) {
      console.error('Failed to load projects:', error)
      const errorMessage = error.response?.data?.error || (isRTL ? 'خطا در بارگذاری پروژه‌ها' : 'Failed to load projects')
      showToast(errorMessage, 'error')
      setProjects([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (data: Partial<Project>) => {
    try {
      const response = await projectApi.create(data)
      showToast('پروژه با موفقیت ایجاد شد', 'success')
      setShowCreateModal(false)
      loadProjects()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'خطا در ایجاد پروژه', 'error')
    }
  }

  const handleUpdateProject = async (id: string, data: Partial<Project>) => {
    try {
      await projectApi.update(id, data)
      showToast('پروژه با موفقیت به‌روزرسانی شد', 'success')
      setSelectedProject(null)
      loadProjects()
    } catch (error) {
      showToast('خطا در به‌روزرسانی پروژه', 'error')
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پروژه را حذف کنید؟')) {
      return
    }
    try {
      await projectApi.delete(id)
      showToast('پروژه با موفقیت حذف شد', 'success')
      loadProjects()
    } catch (error) {
      showToast('خطا در حذف پروژه', 'error')
    }
  }

  const getStatusBadge = (status: ProjectStatus) => {
    const statusMap = {
      [ProjectStatus.Planning]: { labelKey: 'projects.status.planning', variant: 'default' as const },
      [ProjectStatus.InProgress]: { labelKey: 'projects.status.inProgress', variant: 'info' as const },
      [ProjectStatus.OnHold]: { labelKey: 'projects.status.onHold', variant: 'warning' as const },
      [ProjectStatus.Completed]: { labelKey: 'projects.status.completed', variant: 'success' as const },
      [ProjectStatus.Cancelled]: { labelKey: 'projects.status.cancelled', variant: 'danger' as const },
    }
    const statusInfo = statusMap[status] || statusMap[ProjectStatus.Planning]
    return <Badge variant={statusInfo.variant}>{t(statusInfo.labelKey)}</Badge>
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPageNumber(1)
    loadProjects()
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('projects.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRTL ? 'مدیریت پروژه‌های خود' : 'Manage your projects'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {t('projects.create')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
        <form onSubmit={handleSearch} className={`flex flex-col lg:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1">
            <Input
              placeholder={t('projects.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              {t('common.filter')}
            </Button>
            <Button type="submit">{t('common.search')}</Button>
          </div>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projects.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="all">{t('projects.allStatuses')}</option>
                <option value={ProjectStatus.Planning}>{t('projects.status.planning')}</option>
                <option value={ProjectStatus.InProgress}>{t('projects.status.inProgress')}</option>
                <option value={ProjectStatus.OnHold}>{t('projects.status.onHold')}</option>
                <option value={ProjectStatus.Completed}>{t('projects.status.completed')}</option>
                <option value={ProjectStatus.Cancelled}>{t('projects.status.cancelled')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projects.priority')}
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="all">{t('projects.allPriorities')}</option>
                <option value={ProjectPriority.Low}>{t('projects.priority.low')}</option>
                <option value={ProjectPriority.Medium}>{t('projects.priority.medium')}</option>
                <option value={ProjectPriority.High}>{t('projects.priority.high')}</option>
                <option value={ProjectPriority.Critical}>{t('projects.priority.critical')}</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={250} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-white to-gray-50/50">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4 text-lg font-medium">{t('projects.noProjects')}</p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {t('projects.createNew')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link
                    to={`/app/projects/${project.id}`}
                    className="block group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600">{project.code}</p>
                  </Link>
                </div>
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                {getStatusBadge(project.status)}
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{t('projects.progress')}</span>
                  <span className="font-medium">{project.progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                    style={{ width: `${project.progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between pt-4 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''} flex items-center gap-2`}>
                  <span>{project.taskCount} {t('projects.tasks')}</span>
                  <span>•</span>
                  <span>{project.completedTaskCount} {t('projects.completed')}</span>
                </div>
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all transform hover:scale-110"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all transform hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={`flex items-center justify-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} gap-2`}>
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPreviousPage}
          >
            {t('projects.previous')}
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600 font-medium">
            {t('projects.page')} {pagination.pageNumber} {t('projects.of')} {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            {t('projects.next')}
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || selectedProject !== null}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedProject(null)
        }}
        title={selectedProject ? t('projects.edit') : t('projects.create')}
        size="lg"
      >
        <ProjectForm
          project={selectedProject}
          onSubmit={(data) => {
            if (selectedProject) {
              handleUpdateProject(selectedProject.id, data)
            } else {
              handleCreateProject(data)
            }
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedProject(null)
          }}
        />
      </Modal>
    </div>
  )
}

// Project Form Component
interface ProjectFormProps {
  project?: Project | null
  onSubmit: (data: Partial<Project>) => void
  onCancel: () => void
}

function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const { t, isRTL } = useI18nStore()
  const [formData, setFormData] = useState({
    name: project?.name || '',
    code: project?.code || '',
    description: project?.description || '',
    status: project?.status ?? ProjectStatus.Planning,
    priority: project?.priority ?? ProjectPriority.Medium,
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    budget: project?.budget || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Input
        label={t('projects.name')}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label={t('projects.code')}
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('projects.description')}
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
            {t('projects.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={ProjectStatus.Planning}>{t('projects.status.planning')}</option>
            <option value={ProjectStatus.InProgress}>{t('projects.status.inProgress')}</option>
            <option value={ProjectStatus.OnHold}>{t('projects.status.onHold')}</option>
            <option value={ProjectStatus.Completed}>{t('projects.status.completed')}</option>
            <option value={ProjectStatus.Cancelled}>{t('projects.status.cancelled')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects.priority')}
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={ProjectPriority.Low}>{t('projects.priority.low')}</option>
            <option value={ProjectPriority.Medium}>{t('projects.priority.medium')}</option>
            <option value={ProjectPriority.High}>{t('projects.priority.high')}</option>
            <option value={ProjectPriority.Critical}>{t('projects.priority.critical')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PersianDatePicker
          label={t('projects.startDate')}
          value={formData.startDate}
          onChange={(value) => setFormData({ ...formData, startDate: value })}
        />
        <PersianDatePicker
          label={t('projects.endDate')}
          value={formData.endDate}
          onChange={(value) => setFormData({ ...formData, endDate: value })}
        />
      </div>

      <Input
        label={`${t('projects.budget')} (${isRTL ? 'ریال' : 'Rial'})`}
        type="number"
        step="0.01"
        min="0"
        value={formData.budget}
        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
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
