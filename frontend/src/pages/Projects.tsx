import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../services/api'
import { Project, PagedResult, ProjectStatus, ProjectPriority } from '../types'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useProjectStore } from '../store/projectStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'
import { format } from 'date-fns'

export default function Projects() {
  const { projects, setProjects, isLoading, setLoading } = useProjectStore()
  const { showToast } = useUIStore()
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
      const errorMessage = error.response?.data?.error || 'خطا در بارگذاری پروژه‌ها'
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
      [ProjectStatus.Planning]: { label: 'برنامه‌ریزی', variant: 'default' as const },
      [ProjectStatus.InProgress]: { label: 'در حال انجام', variant: 'info' as const },
      [ProjectStatus.OnHold]: { label: 'متوقف', variant: 'warning' as const },
      [ProjectStatus.Completed]: { label: 'تکمیل شده', variant: 'success' as const },
      [ProjectStatus.Cancelled]: { label: 'لغو شده', variant: 'danger' as const },
    }
    const statusInfo = statusMap[status] || statusMap[ProjectStatus.Planning]
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPageNumber(1)
    loadProjects()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">پروژه‌ها</h1>
          <p className="text-gray-600 mt-2">مدیریت پروژه‌های خود</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          پروژه جدید
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="جستجو در پروژه‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              فیلترها
            </Button>
            <Button type="submit">جستجو</Button>
          </div>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضعیت
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value={ProjectStatus.Planning}>برنامه‌ریزی</option>
                <option value={ProjectStatus.InProgress}>در حال انجام</option>
                <option value={ProjectStatus.OnHold}>متوقف</option>
                <option value={ProjectStatus.Completed}>تکمیل شده</option>
                <option value={ProjectStatus.Cancelled}>لغو شده</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اولویت
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value={ProjectPriority.Low}>کم</option>
                <option value={ProjectPriority.Medium}>متوسط</option>
                <option value={ProjectPriority.High}>بالا</option>
                <option value={ProjectPriority.Critical}>بحرانی</option>
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
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">پروژه‌ای یافت نشد</p>
          <Button onClick={() => setShowCreateModal(true)}>ایجاد پروژه جدید</Button>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">پیشرفت</span>
                  <span className="font-medium">{project.progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-primary-500 rounded-full transition-all"
                    style={{ width: `${project.progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span>{project.taskCount} تسک</span>
                  <span className="mx-2">•</span>
                  <span>{project.completedTaskCount} تکمیل شده</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPreviousPage}
          >
            قبلی
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            صفحه {pagination.pageNumber} از {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            بعدی
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
        title={selectedProject ? 'ویرایش پروژه' : 'پروژه جدید'}
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
  const [formData, setFormData] = useState({
    name: project?.name || '',
    code: project?.code || '',
    description: project?.description || '',
    status: project?.status ?? ProjectStatus.Planning,
    priority: project?.priority ?? ProjectPriority.Medium,
    startDate: project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    endDate: project?.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
    budget: project?.budget || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="نام پروژه"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="کد پروژه"
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
            وضعیت
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={ProjectStatus.Planning}>برنامه‌ریزی</option>
            <option value={ProjectStatus.InProgress}>در حال انجام</option>
            <option value={ProjectStatus.OnHold}>متوقف</option>
            <option value={ProjectStatus.Completed}>تکمیل شده</option>
            <option value={ProjectStatus.Cancelled}>لغو شده</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اولویت
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={ProjectPriority.Low}>کم</option>
            <option value={ProjectPriority.Medium}>متوسط</option>
            <option value={ProjectPriority.High}>بالا</option>
            <option value={ProjectPriority.Critical}>بحرانی</option>
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

      <Input
        label="بودجه ($)"
        type="number"
        step="0.01"
        min="0"
        value={formData.budget}
        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
      />

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit">ذخیره</Button>
      </div>
    </form>
  )
}
