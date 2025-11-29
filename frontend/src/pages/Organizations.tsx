import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Building2,
  Edit,
  Trash2,
  Users,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import api, { organizationsApi, projectApi } from '../services/api'
import type { Resource, Project } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import { useI18nStore } from '../store/i18nStore'

interface Organization {
  id: string
  name: string
  code?: string
  description?: string
  parentOrganizationId?: string
  parentOrganizationName?: string
  level: number
  managerId?: string
  managerName?: string
  isActive: boolean
  resourcesCount: number
  projectsCount: number
  subOrganizationsCount: number
  children?: Organization[]
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [treeView, setTreeView] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [parentOrganizations, setParentOrganizations] = useState<Organization[]>([])
  const [showAssignResourcesModal, setShowAssignResourcesModal] = useState(false)
  const [showAssignProjectsModal, setShowAssignProjectsModal] = useState(false)
  const [allResources, setAllResources] = useState<Resource[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const { showToast } = useUIStore()
  const { isRTL } = useI18nStore()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentOrganizationId: '',
    managerId: '',
  })

  useEffect(() => {
    loadOrganizations()
    loadTree()
    loadAllResources()
    loadAllProjects()
  }, [])

  useEffect(() => {
    if (viewMode === 'tree') {
      loadTree()
    } else {
      loadOrganizations()
    }
  }, [viewMode, searchTerm])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const response = await organizationsApi.getAll({
        pageNumber: 1,
        pageSize: 1000,
        searchTerm: searchTerm || undefined,
      })
      setOrganizations(response.data.items || [])
      
      // Load all for parent selection
      const allResponse = await organizationsApi.getAll({ pageNumber: 1, pageSize: 1000 })
      setParentOrganizations((allResponse.data.items || []) as Organization[])
    } catch (error: any) {
      console.error('Failed to load organizations:', error)
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در بارگذاری سازمان‌ها' : 'Failed to load organizations'),
        'error'
      )
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const loadTree = async () => {
    try {
      setLoading(true)
      const response = await organizationsApi.getTree()
      setTreeView(response.data || [])
      // Expand all by default
      const allIds = new Set<string>()
      const collectIds = (nodes: Organization[]) => {
        nodes.forEach(node => {
          allIds.add(node.id)
          if (node.children && node.children.length > 0) {
            collectIds(node.children)
          }
        })
      }
      collectIds(response.data || [])
      setExpandedNodes(allIds)
      
      // Also load flat list for parent selection
      const allResponse = await organizationsApi.getAll({ pageNumber: 1, pageSize: 1000 })
      setParentOrganizations((allResponse.data.items || []) as Organization[])
    } catch (error: any) {
      console.error('Failed to load organization tree:', error)
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در بارگذاری درخت سازمانی' : 'Failed to load organization tree'),
        'error'
      )
      setTreeView([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async () => {
    try {
      await organizationsApi.create({
        ...formData,
        parentOrganizationId: formData.parentOrganizationId || undefined,
        managerId: formData.managerId || undefined,
      })
      showToast(isRTL ? 'سازمان با موفقیت ایجاد شد' : 'Organization created successfully', 'success')
      setShowCreateModal(false)
      resetForm()
      if (viewMode === 'tree') {
        loadTree()
      } else {
        loadOrganizations()
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در ایجاد سازمان' : 'Failed to create organization'),
        'error'
      )
    }
  }

  const handleUpdateOrganization = async () => {
    if (!selectedOrganization) return
    try {
      await organizationsApi.update(selectedOrganization.id, {
        ...formData,
        managerId: formData.managerId || undefined,
      })
      showToast(isRTL ? 'سازمان با موفقیت به‌روزرسانی شد' : 'Organization updated successfully', 'success')
      setSelectedOrganization(null)
      resetForm()
      if (viewMode === 'tree') {
        loadTree()
      } else {
        loadOrganizations()
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در به‌روزرسانی سازمان' : 'Failed to update organization'),
        'error'
      )
    }
  }

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm(isRTL ? 'آیا مطمئن هستید که می‌خواهید این سازمان را حذف کنید؟' : 'Are you sure you want to delete this organization?')) {
      return
    }
    try {
      await organizationsApi.delete(id)
      showToast(isRTL ? 'سازمان با موفقیت حذف شد' : 'Organization deleted successfully', 'success')
      if (viewMode === 'tree') {
        loadTree()
      } else {
        loadOrganizations()
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در حذف سازمان' : 'Failed to delete organization'),
        'error'
      )
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      parentOrganizationId: '',
      managerId: '',
    })
  }

  const openCreateModal = () => {
    resetForm()
    setSelectedOrganization(null)
    setShowCreateModal(true)
  }

  const openEditModal = (org: Organization) => {
    setSelectedOrganization(org)
    setFormData({
      name: org.name,
      code: org.code || '',
      description: org.description || '',
      parentOrganizationId: org.parentOrganizationId || '',
      managerId: org.managerId || '',
    })
    setShowCreateModal(true)
  }

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const loadAllResources = async () => {
    try {
      const response = await api.get('/resources', { params: { pageNumber: 1, pageSize: 1000 } })
      setAllResources(response.data.items || [])
    } catch (error) {
      console.error('Failed to load resources:', error)
    }
  }

  const loadAllProjects = async () => {
    try {
      const response = await projectApi.getAll({ pageNumber: 1, pageSize: 1000 })
      setAllProjects(response.data.items || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleOpenAssignResources = (org: Organization) => {
    setSelectedOrganization(org)
    // Load current resources for this organization
    const orgResources = allResources.filter(r => r.organizationId === org.id)
    setSelectedResources(new Set(orgResources.map(r => r.id)))
    setShowAssignResourcesModal(true)
  }

  const handleOpenAssignProjects = (org: Organization) => {
    setSelectedOrganization(org)
    // Load current projects for this organization
    const orgProjects = allProjects.filter(p => p.organizationId === org.id)
    setSelectedProjects(new Set(orgProjects.map(p => p.id)))
    setShowAssignProjectsModal(true)
  }

  const handleAssignResources = async () => {
    if (!selectedOrganization) return

    try {
      // Update all selected resources
      const updatePromises = Array.from(selectedResources).map(resourceId => {
        return api.put(`/resources/${resourceId}`, {
          organizationId: selectedOrganization.id,
        })
      })

      // Remove organization from unselected resources that were previously assigned
      const previouslyAssigned = allResources.filter(
        r => r.organizationId === selectedOrganization.id && !selectedResources.has(r.id)
      )
      const removePromises = previouslyAssigned.map(resource => {
        return api.put(`/resources/${resource.id}`, {
          organizationId: undefined,
        })
      })

      await Promise.all([...updatePromises, ...removePromises])
      showToast(isRTL ? 'نیروها با موفقیت تخصیص داده شدند' : 'Resources assigned successfully', 'success')
      setShowAssignResourcesModal(false)
      setSelectedOrganization(null)
      setSelectedResources(new Set())
      loadAllResources()
      if (viewMode === 'tree') {
        loadTree()
      } else {
        loadOrganizations()
      }
    } catch (error: any) {
      console.error('Failed to assign resources:', error)
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در تخصیص نیروها' : 'Failed to assign resources'),
        'error'
      )
    }
  }

  const handleAssignProjects = async () => {
    if (!selectedOrganization) return

    try {
      // Update all selected projects
      const updatePromises = Array.from(selectedProjects).map(projectId => {
        return projectApi.update(projectId, {
          organizationId: selectedOrganization.id,
        })
      })

      // Remove organization from unselected projects that were previously assigned
      const previouslyAssigned = allProjects.filter(
        p => p.organizationId === selectedOrganization.id && !selectedProjects.has(p.id)
      )
      const removePromises = previouslyAssigned.map(project => {
        return projectApi.update(project.id, {
          organizationId: undefined,
        })
      })

      await Promise.all([...updatePromises, ...removePromises])
      showToast(isRTL ? 'پروژه‌ها با موفقیت تخصیص داده شدند' : 'Projects assigned successfully', 'success')
      setShowAssignProjectsModal(false)
      setSelectedOrganization(null)
      setSelectedProjects(new Set())
      loadAllProjects()
      if (viewMode === 'tree') {
        loadTree()
      } else {
        loadOrganizations()
      }
    } catch (error: any) {
      console.error('Failed to assign projects:', error)
      showToast(
        error.response?.data?.error || (isRTL ? 'خطا در تخصیص پروژه‌ها' : 'Failed to assign projects'),
        'error'
      )
    }
  }

  const renderTreeNode = (node: Organization, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-3 p-4 rounded-lg mb-2 transition-all
            hover:bg-gray-50 border border-gray-200
            ${level === 0 ? 'bg-gradient-to-r from-blue-50 to-white' : ''}
            ${level === 1 ? 'bg-gradient-to-r from-indigo-50 to-white' : ''}
            ${level >= 2 ? 'bg-white' : ''}
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <button
            onClick={() => toggleNode(node.id)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{node.name}</h3>
              {node.code && (
                <Badge variant="default" className="text-xs">
                  {node.code}
                </Badge>
              )}
              {!node.isActive && (
                <Badge variant="danger" className="text-xs">
                  {isRTL ? 'غیرفعال' : 'Inactive'}
                </Badge>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-gray-600 mt-1 truncate">{node.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {node.resourcesCount} {isRTL ? 'نیرو' : 'Resources'}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {node.projectsCount} {isRTL ? 'پروژه' : 'Projects'}
              </span>
              {hasChildren && (
                <span className="flex items-center gap-1">
                  <FolderTree className="w-4 h-4" />
                  {node.subOrganizationsCount} {isRTL ? 'زیرسازمان' : 'Sub-orgs'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenAssignResources(node)}
              leftIcon={<Users className="w-4 h-4" />}
              title={isRTL ? 'تخصیص نیروها' : 'Assign Resources'}
            >
              {isRTL ? 'نیروها' : 'Resources'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenAssignProjects(node)}
              leftIcon={<Briefcase className="w-4 h-4" />}
              title={isRTL ? 'تخصیص پروژه‌ها' : 'Assign Projects'}
            >
              {isRTL ? 'پروژه‌ها' : 'Projects'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditModal(node)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              {isRTL ? 'ویرایش' : 'Edit'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteOrganization(node.id)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              {isRTL ? 'حذف' : 'Delete'}
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading && organizations.length === 0 && treeView.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-white via-primary-50/30 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                {isRTL ? 'چارت سازمانی' : 'Organizational Chart'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isRTL
                  ? 'مدیریت ساختار سازمانی و تخصیص نیروها و پروژه‌ها'
                  : 'Manage organizational structure and assign resources and projects'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'tree'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <FolderTree className="w-4 h-4 inline mr-2" />
                {isRTL ? 'درختی' : 'Tree'}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                {isRTL ? 'لیست' : 'List'}
              </button>
            </div>

            <Button
              onClick={openCreateModal}
              leftIcon={<Plus className="w-5 h-5" />}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
            >
              {isRTL ? 'سازمان جدید' : 'New Organization'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={isRTL ? 'جستجوی سازمان...' : 'Search organizations...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      {viewMode === 'tree' ? (
        <Card className="p-6">
          {treeView.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {isRTL ? 'سازمانی وجود ندارد' : 'No organizations found'}
              </p>
              <Button
                onClick={openCreateModal}
                className="mt-4"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                {isRTL ? 'ایجاد اولین سازمان' : 'Create First Organization'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {treeView.map(node => renderTreeNode(node, 0))}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {isRTL ? 'سازمانی وجود ندارد' : 'No organizations found'}
              </p>
            </div>
          ) : (
            organizations.map(org => (
              <Card key={org.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      {org.code && (
                        <Badge variant="default" className="text-xs mt-1">
                          {org.code}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(org)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteOrganization(org.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {org.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{org.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {org.resourcesCount} {isRTL ? 'نیرو' : 'Resources'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>
                      {org.projectsCount} {isRTL ? 'پروژه' : 'Projects'}
                    </span>
                  </div>
                  {org.parentOrganizationName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FolderTree className="w-4 h-4" />
                      <span>{isRTL ? 'والد: ' : 'Parent: '}{org.parentOrganizationName}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
          setSelectedOrganization(null)
        }}
        title={selectedOrganization ? (isRTL ? 'ویرایش سازمان' : 'Edit Organization') : (isRTL ? 'سازمان جدید' : 'New Organization')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'نام' : 'Name'} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isRTL ? 'نام سازمان' : 'Organization name'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'کد' : 'Code'}
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder={isRTL ? 'کد سازمان' : 'Organization code'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'توضیحات' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder={isRTL ? 'توضیحات سازمان' : 'Organization description'}
            />
          </div>

          {!selectedOrganization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'سازمان والد' : 'Parent Organization'}
              </label>
              <select
                value={formData.parentOrganizationId}
                onChange={(e) => setFormData({ ...formData, parentOrganizationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{isRTL ? 'بدون والد (سازمان اصلی)' : 'None (Root Organization)'}</option>
                {(() => {
                  const orgs: Organization[] = parentOrganizations
                  return orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.code ? `(${org.code})` : ''}
                    </option>
                  ))
                })()}
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
                setSelectedOrganization(null)
              }}
            >
              {isRTL ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              onClick={selectedOrganization ? handleUpdateOrganization : handleCreateOrganization}
              className="bg-gradient-to-r from-primary-600 to-primary-700"
            >
              {selectedOrganization ? (isRTL ? 'ذخیره' : 'Save') : (isRTL ? 'ایجاد' : 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Resources Modal */}
      {showAssignResourcesModal && selectedOrganization && (
        <Modal
          isOpen={showAssignResourcesModal}
          onClose={() => {
            setShowAssignResourcesModal(false)
            setSelectedOrganization(null)
            setSelectedResources(new Set())
          }}
          title={isRTL ? `تخصیص نیروها به ${selectedOrganization.name}` : `Assign Resources to ${selectedOrganization.name}`}
          size="large"
        >
          <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-sm text-gray-600">
              {isRTL
                ? 'نیروهای مورد نظر را انتخاب کنید تا به این سازمان تخصیص داده شوند.'
                : 'Select resources to assign to this organization.'}
            </p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {allResources.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isRTL ? 'نیرویی یافت نشد' : 'No resources found'}
                </p>
              ) : (
                <div className="space-y-2">
                  {allResources.map((resource) => (
                    <label
                      key={resource.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResources.has(resource.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedResources)
                          if (e.target.checked) {
                            newSet.add(resource.id)
                          } else {
                            newSet.delete(resource.id)
                          }
                          setSelectedResources(newSet)
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {resource.firstName} {resource.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{resource.email}</p>
                        {resource.organizationId && (
                          <Badge variant="info" className="text-xs mt-1">
                            {isRTL ? 'تخصیص داده شده' : 'Assigned'}
                          </Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignResourcesModal(false)
                  setSelectedOrganization(null)
                  setSelectedResources(new Set())
                }}
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </Button>
              <Button onClick={handleAssignResources} className="bg-gradient-to-r from-primary-600 to-primary-700">
                {isRTL ? 'ذخیره' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Projects Modal */}
      {showAssignProjectsModal && selectedOrganization && (
        <Modal
          isOpen={showAssignProjectsModal}
          onClose={() => {
            setShowAssignProjectsModal(false)
            setSelectedOrganization(null)
            setSelectedProjects(new Set())
          }}
          title={isRTL ? `تخصیص پروژه‌ها به ${selectedOrganization.name}` : `Assign Projects to ${selectedOrganization.name}`}
          size="large"
        >
          <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-sm text-gray-600">
              {isRTL
                ? 'پروژه‌های مورد نظر را انتخاب کنید تا به این سازمان تخصیص داده شوند.'
                : 'Select projects to assign to this organization.'}
            </p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {allProjects.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isRTL ? 'پروژه‌ای یافت نشد' : 'No projects found'}
                </p>
              ) : (
                <div className="space-y-2">
                  {allProjects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(project.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedProjects)
                          if (e.target.checked) {
                            newSet.add(project.id)
                          } else {
                            newSet.delete(project.id)
                          }
                          setSelectedProjects(newSet)
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-600">{project.code}</p>
                        {project.organizationId && (
                          <Badge variant="info" className="text-xs mt-1">
                            {isRTL ? 'تخصیص داده شده' : 'Assigned'}
                          </Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignProjectsModal(false)
                  setSelectedOrganization(null)
                  setSelectedProjects(new Set())
                }}
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </Button>
              <Button onClick={handleAssignProjects} className="bg-gradient-to-r from-primary-600 to-primary-700">
                {isRTL ? 'ذخیره' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

