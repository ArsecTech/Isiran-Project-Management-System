import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../services/api'
import api, { organizationsApi } from '../services/api'
import { Project, PagedResult, ProjectStatus, ProjectPriority, ProjectNature, Resource } from '../types'
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useProjectStore } from '../store/projectStore'
import { useI18nStore } from '../store/i18nStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
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
    nature: 'all',
    center: 'all',
  })
  const [groupByCenter, setGroupByCenter] = useState(true)
  const [expandedCenters, setExpandedCenters] = useState<Set<string>>(new Set())

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
      await projectApi.create(data)
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'ماهیت پروژه' : 'Project Nature'}
              </label>
              <select
                value={filters.nature}
                onChange={(e) => setFilters({ ...filters, nature: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="all">{isRTL ? 'همه' : 'All'}</option>
                <option value={ProjectNature.DesignAndImplementation}>{isRTL ? 'طراحی و پیاده‌سازی' : 'Design & Implementation'}</option>
                <option value={ProjectNature.Support}>{isRTL ? 'پشتیبانی' : 'Support'}</option>
                <option value={ProjectNature.Development}>{isRTL ? 'توسعه' : 'Development'}</option>
                <option value={ProjectNature.Procurement}>{isRTL ? 'تامین' : 'Procurement'}</option>
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
        <>
          {/* Group by Center Toggle */}
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {isRTL ? 'گروه‌بندی بر اساس مرکز' : 'Group by Center'}
              </span>
            </div>
            <button
              onClick={() => setGroupByCenter(!groupByCenter)}
              className={`px-4 py-2 rounded-lg transition-all ${
                groupByCenter
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {groupByCenter ? (isRTL ? 'غیرفعال' : 'Disable') : (isRTL ? 'فعال' : 'Enable')}
            </button>
          </div>

          {groupByCenter ? (
            <ProjectsByCenter
              projects={projects}
              expandedCenters={expandedCenters}
              setExpandedCenters={setExpandedCenters}
              onEdit={setSelectedProject}
              onDelete={handleDeleteProject}
              getStatusBadge={getStatusBadge}
              isRTL={isRTL}
              t={t}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => setSelectedProject(project)}
                  onDelete={() => handleDeleteProject(project.id)}
                  getStatusBadge={getStatusBadge}
                  isRTL={isRTL}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
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
  const [resources, setResources] = useState<Resource[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])

  useEffect(() => {
    loadResources()
    loadOrganizations()
  }, [])

  const loadResources = async () => {
    try {
      const response = await api.get('/resources', { params: { pageNumber: 1, pageSize: 100 } })
      setResources(response.data.items || [])
    } catch (error) {
      console.error('Failed to load resources:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await organizationsApi.getAll({ pageNumber: 1, pageSize: 1000 })
      setOrganizations(response.data.items || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const [formData, setFormData] = useState({
    name: project?.name || '',
    code: project?.code || '',
    description: project?.description || '',
    priority: project?.priority ?? ProjectPriority.Medium,
    nature: project?.nature ?? ProjectNature.DesignAndImplementation,
    center: project?.center || '',
    organizationId: project?.organizationId || '',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    budget: project?.budget || 0,
    projectManagerId: project?.projectManagerId || '',
    ownerId: project?.ownerId || '',
    // Only include these fields when editing
    ...(project ? {
      status: project.status ?? ProjectStatus.Planning,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate).toISOString().split('T')[0] : '',
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate).toISOString().split('T')[0] : '',
      actualCost: project.actualCost || 0,
      selfReportedProgress: project.selfReportedProgress ?? undefined,
      approvedProgress: project.approvedProgress ?? undefined,
      settings: project.settings || {
        autoSchedule: true,
        criticalPathEnabled: true,
        resourceLevelingEnabled: true,
        workingHoursPerDay: 8,
        workingDaysPerWeek: 5,
        calendarId: 'Standard',
        allowOvertime: false,
        defaultHourlyRate: 0,
        currency: 'IRR',
        timeZone: 'Asia/Tehran'
      },
    } : {}),
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
        {project && (
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
        )}

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'ماهیت پروژه' : 'Project Nature'}
          </label>
          <select
            value={formData.nature}
            onChange={(e) => setFormData({ ...formData, nature: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={ProjectNature.DesignAndImplementation}>{isRTL ? 'طراحی و پیاده‌سازی' : 'Design & Implementation'}</option>
            <option value={ProjectNature.Support}>{isRTL ? 'پشتیبانی' : 'Support'}</option>
            <option value={ProjectNature.Development}>{isRTL ? 'توسعه' : 'Development'}</option>
            <option value={ProjectNature.Procurement}>{isRTL ? 'تامین' : 'Procurement'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects.organization')}
          </label>
          <select
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value="">{t('projects.selectOrganization')}</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} {org.code ? `(${org.code})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects.center')}
          </label>
          <Input
            value={formData.center}
            onChange={(e) => setFormData({ ...formData, center: e.target.value })}
            placeholder={t('projects.centerPlaceholder')}
          />
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
        {project && (
          <>
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
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${t('projects.budget')} (${isRTL ? 'ریال' : 'Rial'})`}
          type="number"
          step="0.01"
          min="0"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
        />
        {project && (
          <Input
            label={`${isRTL ? 'هزینه واقعی' : 'Actual Cost'} (${isRTL ? 'ریال' : 'Rial'})`}
            type="number"
            step="0.01"
            min="0"
            value={formData.actualCost}
            onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })}
          />
        )}
      </div>

      {project && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={isRTL ? 'پیشرفت خوداظهاری (%)' : 'Self-Reported Progress (%)'}
            type="number"
            min="0"
            max="100"
            value={formData.selfReportedProgress ?? ''}
            onChange={(e) => setFormData({ ...formData, selfReportedProgress: e.target.value ? parseInt(e.target.value) : undefined })}
          />
          <Input
            label={isRTL ? 'پیشرفت تایید شده (%)' : 'Approved Progress (%)'}
            type="number"
            min="0"
            max="100"
            value={formData.approvedProgress ?? ''}
            onChange={(e) => setFormData({ ...formData, approvedProgress: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'مدیر پروژه' : 'Project Manager'}
          </label>
          <select
            value={formData.projectManagerId}
            onChange={(e) => setFormData({ ...formData, projectManagerId: e.target.value })}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isRTL ? 'مالک پروژه' : 'Project Owner'}
          </label>
          <select
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
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

      {/* Project Settings Section - Only show when editing */}
      {project && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{isRTL ? 'تنظیمات پروژه' : 'Project Settings'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.autoSchedule}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, autoSchedule: e.target.checked }
              })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="mr-2 text-sm text-gray-700">{isRTL ? 'زمان‌بندی خودکار' : 'Auto Schedule'}</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.criticalPathEnabled}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, criticalPathEnabled: e.target.checked }
              })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="mr-2 text-sm text-gray-700">{isRTL ? 'فعال‌سازی مسیر بحرانی' : 'Critical Path Enabled'}</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.resourceLevelingEnabled}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, resourceLevelingEnabled: e.target.checked }
              })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="mr-2 text-sm text-gray-700">{isRTL ? 'فعال‌سازی تراز منابع' : 'Resource Leveling Enabled'}</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.allowOvertime}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, allowOvertime: e.target.checked }
              })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="mr-2 text-sm text-gray-700">{isRTL ? 'اجازه اضافه‌کاری' : 'Allow Overtime'}</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input
            label={isRTL ? 'ساعات کاری روزانه' : 'Working Hours Per Day'}
            type="number"
            min="1"
            max="24"
            value={formData.settings.workingHoursPerDay}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, workingHoursPerDay: parseInt(e.target.value) || 8 }
            })}
          />
          <Input
            label={isRTL ? 'روزهای کاری هفتگی' : 'Working Days Per Week'}
            type="number"
            min="1"
            max="7"
            value={formData.settings.workingDaysPerWeek}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, workingDaysPerWeek: parseInt(e.target.value) || 5 }
            })}
          />
          <Input
            label={`${isRTL ? 'نرخ ساعتی پیش‌فرض' : 'Default Hourly Rate'} (${isRTL ? 'ریال' : 'Rial'})`}
            type="number"
            step="0.01"
            min="0"
            value={formData.settings.defaultHourlyRate}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, defaultHourlyRate: parseFloat(e.target.value) || 0 }
            })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isRTL ? 'واحد پول' : 'Currency'}
            </label>
            <select
              value={formData.settings.currency}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, currency: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="IRR">{isRTL ? 'ریال' : 'Rial (IRR)'}</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        </div>
      )}

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

// Project Card Component
interface ProjectCardProps {
  project: Project
  onEdit: () => void
  onDelete: () => void
  getStatusBadge: (status: ProjectStatus) => JSX.Element
  isRTL: boolean
  t: (key: string) => string
}

function ProjectCard({ project, onEdit, onDelete, getStatusBadge, isRTL, t }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const getNatureLabel = (nature: ProjectNature) => {
    const labels = {
      [ProjectNature.DesignAndImplementation]: isRTL ? 'طراحی و پیاده‌سازی' : 'Design & Implementation',
      [ProjectNature.Support]: isRTL ? 'پشتیبانی' : 'Support',
      [ProjectNature.Development]: isRTL ? 'توسعه' : 'Development',
      [ProjectNature.Procurement]: isRTL ? 'تامین' : 'Procurement',
    }
    return labels[nature] || ''
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
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
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1`}>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onEdit()
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {isRTL ? 'ویرایش' : 'Edit'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onDelete()
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {getStatusBadge(project.status)}
        {project.center && (
          <Badge variant="default">
            <Building2 className="w-3 h-3 mr-1" />
            {project.center}
          </Badge>
        )}
        {project.nature !== undefined && (
          <Badge variant="info">{getNatureLabel(project.nature)}</Badge>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {project.projectManagerName && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">{isRTL ? 'مدیر پروژه:' : 'PM:'}</span> {project.projectManagerName}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-gray-600">{isRTL ? 'پیشرفت برنامه‌ای' : 'Planned Progress'}</span>
          <span className="font-medium">{project.progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
            style={{ width: `${project.progressPercentage}%` }}
          />
        </div>
        {project.selfReportedProgress !== undefined && project.selfReportedProgress !== null && (
          <>
            <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isRTL ? 'پیشرفت خوداظهاری' : 'Self-Reported'}</span>
              <span className="font-medium text-orange-600">{project.selfReportedProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-orange-500 rounded-full transition-all"
                style={{ width: `${project.selfReportedProgress}%` }}
              />
            </div>
          </>
        )}
        {project.approvedProgress !== undefined && project.approvedProgress !== null && (
          <>
            <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isRTL ? 'پیشرفت تایید شده' : 'Approved Progress'}</span>
              <span className="font-medium text-green-600">{project.approvedProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-green-500 rounded-full transition-all"
                style={{ width: `${project.approvedProgress}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className={`flex items-center justify-between pt-4 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''} flex items-center gap-2`}>
          <span>{project.taskCount} {t('projects.tasks')}</span>
          <span>•</span>
          <span>{project.completedTaskCount} {t('projects.completed')}</span>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all transform hover:scale-110"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all transform hover:scale-110"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

// Projects Grouped by Center Component
interface ProjectsByCenterProps {
  projects: Project[]
  expandedCenters: Set<string>
  setExpandedCenters: (centers: Set<string>) => void
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  getStatusBadge: (status: ProjectStatus) => JSX.Element
  isRTL: boolean
  t: (key: string) => string
}

function ProjectsByCenter({
  projects,
  expandedCenters,
  setExpandedCenters,
  onEdit,
  onDelete,
  getStatusBadge,
  isRTL,
  t,
}: ProjectsByCenterProps) {
  // Group projects by center
  const projectsByCenter = projects.reduce((acc, project) => {
    const center = project.center || (isRTL ? 'بدون مرکز' : 'No Center')
    if (!acc[center]) {
      acc[center] = []
    }
    acc[center].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  const toggleCenter = (center: string) => {
    const newExpanded = new Set(expandedCenters)
    if (newExpanded.has(center)) {
      newExpanded.delete(center)
    } else {
      newExpanded.add(center)
    }
    setExpandedCenters(newExpanded)
  }

  // Expand all by default
  useEffect(() => {
    const allCenters = Object.keys(projectsByCenter)
    if (expandedCenters.size === 0 && allCenters.length > 0) {
      setExpandedCenters(new Set(allCenters))
    }
  }, [projects.length])

  return (
    <div className="space-y-4">
      {Object.entries(projectsByCenter).map(([center, centerProjects]) => {
        const isExpanded = expandedCenters.has(center)
        return (
          <Card key={center} className="overflow-hidden">
            <button
              onClick={() => toggleCenter(center)}
              className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Building2 className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">{center}</h3>
                <Badge variant="default">{centerProjects.length} {isRTL ? 'پروژه' : 'Projects'}</Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {centerProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={() => onEdit(project)}
                      onDelete={() => onDelete(project.id)}
                      getStatusBadge={getStatusBadge}
                      isRTL={isRTL}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
