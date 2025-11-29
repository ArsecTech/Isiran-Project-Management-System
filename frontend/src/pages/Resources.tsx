import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  List,
  Grid,
  Calendar,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  Clock,
} from 'lucide-react'
import api from '../services/api'
import { Resource, PagedResult, ResourceType, ResourceStatus } from '../types'
import { useUIStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import { formatRialSimple } from '../utils/dateUtils'
import { useI18nStore } from '../store/i18nStore'

type ViewMode = 'list' | 'grid' | 'calendar'

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const { showToast } = useUIStore()
  const { t, isRTL } = useI18nStore()

  useEffect(() => {
    loadResources()
  }, [selectedType, selectedStatus, searchTerm])

  const loadResources = async () => {
    try {
      setLoading(true)
      const response = await api.get<PagedResult<Resource>>('/resources', {
        params: {
          pageNumber: 1,
          pageSize: 100,
        },
      })
      setResources(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to load resources:', error)
      const errorMessage = error.response?.data?.error || t('resources.loadError')
      showToast(errorMessage, 'error')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResource = async (data: Partial<Resource>) => {
    try {
      await api.post('/resources', data)
      showToast(t('resources.createSuccess'), 'success')
      setShowCreateModal(false)
      loadResources()
    } catch (error) {
      showToast(t('resources.createError'), 'error')
    }
  }

  const handleUpdateResource = async (id: string, data: Partial<Resource>) => {
    try {
      await api.put(`/resources/${id}`, data)
      showToast(t('resources.updateSuccess'), 'success')
      setSelectedResource(null)
      loadResources()
    } catch (error) {
      showToast(t('resources.updateError'), 'error')
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm(t('resources.deleteConfirm'))) {
      return
    }
    try {
      await api.delete(`/resources/${id}`)
      showToast(t('resources.deleteSuccess'), 'success')
      loadResources()
    } catch (error) {
      showToast(t('resources.deleteError'), 'error')
    }
  }

  const getTypeLabel = (type: number) => {
    const types = [
      t('resources.type.employee'),
      t('resources.type.contractor'),
      t('resources.type.equipment'),
      t('resources.type.material')
    ]
    return types[type] || t('resources.unknown')
  }

  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { labelKey: 'resources.status.active', variant: 'success' as const },
      1: { labelKey: 'resources.status.inactive', variant: 'default' as const },
      2: { labelKey: 'resources.status.onLeave', variant: 'warning' as const },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap[0]
    return <Badge variant={statusInfo.variant}>{t(statusInfo.labelKey)}</Badge>
  }

  const filteredResources = resources.filter((resource) => {
    if (searchTerm && !resource.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !resource.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (selectedType !== 'all' && resource.type !== parseInt(selectedType)) {
      return false
    }
    if (selectedStatus !== 'all' && resource.status !== parseInt(selectedStatus)) {
      return false
    }
    return true
  })

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('resources.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('resources.manageResources')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {t('resources.create')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('resources.totalResources')}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">{resources.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('resources.activeResources')}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
                {resources.filter(r => r.status === 0).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('resources.employees')}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
                {resources.filter(r => r.type === 0).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('resources.averageRate')}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
                {resources.length > 0 
                  ? formatRialSimple(Math.round(resources.reduce((sum, r) => sum + (r.standardRate || 0), 0) / resources.length))
                  : formatRialSimple(0)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
        <div className={`flex flex-col lg:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder={t('resources.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filters */}
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('resources.allTypes')}</option>
            <option value={ResourceType.Work}>{t('resources.type.employee')}</option>
            <option value={ResourceType.Material}>{t('resources.type.material')}</option>
            <option value={ResourceType.Cost}>{t('resources.type.cost')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('resources.allStatuses')}</option>
              <option value="0">{t('resources.status.active')}</option>
              <option value="1">{t('resources.status.inactive')}</option>
              <option value="2">{t('resources.status.onLeave')}</option>
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
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('resources.name')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('resources.type')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('resources.status')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('resources.email')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('resources.standardRate')}</th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-500 text-lg font-medium">{t('resources.noResources')}</p>
                        <Button onClick={() => setShowCreateModal(true)} variant="outline" size="sm">
                          {t('resources.createNew')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold ${isRTL ? 'ml-3' : 'mr-3'} shadow-md`}>
                            {resource.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{resource.fullName}</p>
                            {resource.jobTitle && (
                              <p className="text-sm text-gray-500">{resource.jobTitle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getTypeLabel(resource.type)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(resource.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{resource.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {resource.standardRate != null ? `${formatRialSimple(resource.standardRate, false)} ${t('resources.perHour')}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => setSelectedResource(resource)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all transform hover:scale-110"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all transform hover:scale-110"
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {t('resources.noResources')}
            </div>
          ) : (
            filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3">
                      {resource.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{resource.fullName}</h3>
                      {resource.jobTitle && (
                        <p className="text-sm text-gray-500">{resource.jobTitle}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(resource.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {resource.email}
                  </div>
                  {resource.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {resource.phoneNumber}
                    </div>
                  )}
                  {resource.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {resource.department}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {resource.standardRate != null ? `${formatRialSimple(resource.standardRate, false)}${t('resources.perHour')}` : '-'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Badge variant="info">{getTypeLabel(resource.type)}</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedResource(resource)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gradient-to-br from-white to-gray-50/50">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {t('resources.calendarViewComingSoon')}
          </p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || selectedResource !== null}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedResource(null)
        }}
        title={selectedResource ? t('resources.edit') : t('resources.create')}
        size="lg"
      >
        <ResourceForm
          resource={selectedResource}
          onSubmit={(data) => {
            if (selectedResource) {
              handleUpdateResource(selectedResource.id, data)
            } else {
              handleCreateResource(data)
            }
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedResource(null)
          }}
        />
      </Modal>
    </div>
  )
}

// Resource Form Component
interface ResourceFormProps {
  resource?: Resource | null
  onSubmit: (data: Partial<Resource>) => void
  onCancel: () => void
}

function ResourceForm({ resource, onSubmit, onCancel }: ResourceFormProps) {
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
    firstName: resource?.firstName || '',
    lastName: resource?.lastName || '',
    email: resource?.email || '',
    phoneNumber: resource?.phoneNumber || '',
    type: resource?.type ?? ResourceType.Work,
    status: resource?.status ?? ResourceStatus.Active,
    maxUnits: resource?.maxUnits ?? 100,
    standardRate: resource?.standardRate ?? 0,
    overtimeRate: resource?.overtimeRate ?? 0,
    department: resource?.department || '',
    jobTitle: resource?.jobTitle || '',
    managerId: resource?.managerId || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('resources.firstName')}
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <Input
          label={t('resources.lastName')}
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>

      <Input
        label={t('resources.email')}
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <Input
        label={t('resources.phoneNumber')}
        type="tel"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('resources.type')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={ResourceType.Work}>{t('resources.type.employee')}</option>
            <option value={ResourceType.Material}>{t('resources.type.material')}</option>
            <option value={ResourceType.Cost}>{t('resources.type.cost')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('resources.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <option value={ResourceStatus.Active}>{t('resources.status.active')}</option>
            <option value={ResourceStatus.Inactive}>{t('resources.status.inactive')}</option>
            <option value={ResourceStatus.OnLeave}>{t('resources.status.onLeave')}</option>
            <option value={ResourceStatus.Terminated}>{t('resources.status.terminated')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('resources.maxUnitsPercent')}
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={formData.maxUnits}
          onChange={(e) => setFormData({ ...formData, maxUnits: parseFloat(e.target.value) })}
        />
        <Input
          label={`${t('resources.standardRate')} (${t('resources.rialPerHour')})`}
          type="number"
          step="0.01"
          min="0"
          value={formData.standardRate}
          onChange={(e) => setFormData({ ...formData, standardRate: parseFloat(e.target.value) })}
        />
      </div>

      <Input
        label={`${t('resources.overtimeRate')} (${t('resources.rialPerHour')})`}
        type="number"
        step="0.01"
        min="0"
        value={formData.overtimeRate}
        onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('resources.department')}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        />
        <Input
          label={t('resources.jobTitle')}
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('resources.manager')}
        </label>
        <select
          value={formData.managerId}
          onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <option value="">{t('resources.notAssigned')}</option>
          {resources.filter(r => r.id !== resource?.id).map((res) => (
            <option key={res.id} value={res.id}>
              {res.fullName}
            </option>
          ))}
        </select>
      </div>

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
