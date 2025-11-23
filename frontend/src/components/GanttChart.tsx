import { useEffect, useState, useRef } from 'react'
import { ganttApi } from '../services/api'
import { addDays, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { formatPersianDate } from '../utils/dateUtils'
import { Calendar, ChevronDown, ChevronRight, GitBranch, History, Save } from 'lucide-react'
import { useI18nStore } from '../store/i18nStore'
import Button from './ui/Button'
import Card from './ui/Card'
import Badge from './ui/Badge'

interface GanttChartProps {
  projectId: string
}

interface GanttTask {
  taskId: string
  taskName: string
  calculatedStartDate?: string
  calculatedEndDate?: string
  calculatedDuration: number
  isOnCriticalPath: boolean
  parentTaskId?: string
  level: number
  subTasks?: GanttTask[]
  percentComplete?: number
  status?: number
}

interface GanttData {
  taskSchedules: GanttTask[]
  projectStartDate?: string
  projectEndDate?: string
  totalDuration: number
}

interface GanttVersion {
  id: string
  name: string
  createdAt: string
  description?: string
}

export default function GanttChart({ projectId }: GanttChartProps) {
  const [data, setData] = useState<GanttData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [versions, setVersions] = useState<GanttVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const ganttRef = useRef<HTMLDivElement>(null)
  const { isRTL } = useI18nStore()

  useEffect(() => {
    loadGanttData()
    loadVersions()
  }, [projectId, selectedVersion])

  const loadGanttData = async () => {
    try {
      setLoading(true)
      const response = await ganttApi.getSchedule(projectId)
      const hierarchicalData = buildHierarchicalTasks(response.data.taskSchedules || [])
      setData({
        ...response.data,
        taskSchedules: hierarchicalData
      })
    } catch (error) {
      console.error('Failed to load Gantt data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    // TODO: Implement version loading from API
    // For now, use mock data
    setVersions([
      { id: 'current', name: 'نسخه فعلی', createdAt: new Date().toISOString() },
      { id: 'v1', name: 'نسخه 1.0', createdAt: new Date().toISOString() },
    ])
  }

  const buildHierarchicalTasks = (tasks: any[]): GanttTask[] => {
    const taskMap = new Map<string, GanttTask>()
    const rootTasks: GanttTask[] = []

    // First pass: create all tasks with their data
    tasks.forEach(task => {
      taskMap.set(task.taskId, {
        ...task,
        level: task.level || 0,
        subTasks: []
      })
    })

    // Second pass: build hierarchy recursively (supports multiple levels)
    const buildTaskLevel = (taskId: string, parentLevel: number = -1): number => {
      const task = taskMap.get(taskId)
      if (!task) return 0

      const currentLevel = parentLevel + 1
      task.level = currentLevel

      // Find all children of this task
      const children = tasks.filter(t => t.parentTaskId === taskId)
      
      if (children.length > 0) {
        task.subTasks = []
        children.forEach(child => {
          const childTask = taskMap.get(child.taskId)!
          task.subTasks!.push(childTask)
          // Recursively build child levels
          buildTaskLevel(child.taskId, currentLevel)
        })
      }

      return currentLevel
    }

    // Find root tasks (tasks without parent)
    tasks.forEach(task => {
      if (!task.parentTaskId || !taskMap.has(task.parentTaskId)) {
        const rootTask = taskMap.get(task.taskId)!
        rootTasks.push(rootTask)
        // Build hierarchy starting from root
        buildTaskLevel(task.taskId, -1)
      }
    })

    // Set expanded by default for all tasks (to show hierarchy)
    tasks.forEach(task => {
      setExpandedTasks(prev => new Set(prev).add(task.taskId))
    })

    return rootTasks
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const flattenTasks = (tasks: GanttTask[]): GanttTask[] => {
    const result: GanttTask[] = []
    tasks.forEach(task => {
      result.push(task)
      if (task.subTasks && task.subTasks.length > 0 && expandedTasks.has(task.taskId)) {
        result.push(...flattenTasks(task.subTasks))
      }
    })
    return result
  }

  const saveVersion = async () => {
    // TODO: Implement version saving
    const newVersion: GanttVersion = {
      id: `v${versions.length + 1}`,
      name: newVersionName || `نسخه ${versions.length + 1}`,
      createdAt: new Date().toISOString(),
    }
    setVersions([...versions, newVersion])
    setShowVersionModal(false)
    setNewVersionName('')
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600">{isRTL ? 'در حال بارگذاری نمودار گانت...' : 'Loading Gantt chart...'}</p>
        </div>
      </div>
    )
  }

  const flatTasks = flattenTasks(data.taskSchedules)

  if (flatTasks.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg font-medium">{isRTL ? 'تسکی برای نمایش وجود ندارد' : 'No tasks to display'}</p>
        <p className="text-gray-500 text-sm mt-2">{isRTL ? 'برای شروع، تسک‌هایی به پروژه اضافه کنید' : 'Add tasks to the project to get started'}</p>
      </div>
    )
  }

  const startDate = data.projectStartDate
    ? new Date(data.projectStartDate)
    : new Date()
  const endDate = data.projectEndDate
    ? new Date(data.projectEndDate)
    : addDays(startDate, data.totalDuration)

  const totalDays = differenceInDays(endDate, startDate) + 1

  // Generate date headers based on zoom level
  const generateDateHeaders = () => {
    const headers: { date: Date; label: string; isWeekend?: boolean }[] = []
    let current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      if (zoom === 'day') {
        headers.push({
          date: new Date(current),
          label: formatPersianDate(current).split('/')[2], // فقط روز
          isWeekend,
        })
        current = addDays(current, 1)
      } else if (zoom === 'week') {
        const weekStart = startOfWeek(current, { weekStartsOn: 6 }) // شنبه
        const weekEnd = endOfWeek(current, { weekStartsOn: 6 })
        const persianStart = formatPersianDate(weekStart)
        const persianEnd = formatPersianDate(weekEnd)
        headers.push({
          date: new Date(weekStart),
          label: `${persianStart.split('/')[2]}-${persianEnd.split('/')[2]}`,
        })
        current = addDays(weekEnd, 1)
      } else {
        const monthStart = startOfMonth(current)
        const persianDate = formatPersianDate(monthStart)
        headers.push({
          date: new Date(monthStart),
          label: persianDate.split('/').slice(0, 2).join('/'), // ماه/سال
        })
        current = addDays(endOfMonth(current), 1)
      }
    }

    return headers
  }

  const dateHeaders = generateDateHeaders()

  const getTaskPosition = (taskStart?: string, taskEnd?: string) => {
    if (!taskStart || !taskEnd) return { left: 0, right: 0, width: 0 }

    const start = new Date(taskStart)
    const end = new Date(taskEnd)

    const daysFromStart = differenceInDays(start, startDate)
    const taskDuration = differenceInDays(end, start) + 1

    const leftPercent = (daysFromStart / totalDays) * 100
    const widthPercent = (taskDuration / totalDays) * 100

    // For RTL, calculate right position
    const rightPercent = 100 - (leftPercent + widthPercent)

    return {
      left: Math.max(0, leftPercent),
      right: Math.max(0, rightPercent),
      width: Math.max(1, widthPercent),
    }
  }

  const getTaskColor = (task: GanttTask) => {
    if (task.isOnCriticalPath) {
      return 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 shadow-lg shadow-red-500/50'
    }
    // Different colors for different levels (up to 3 levels)
    const level = task.level || 0
    if (level === 0) {
      // Root level - blue
      return 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-md shadow-blue-500/30'
    } else if (level === 1) {
      // Second level - indigo
      return 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30'
    } else {
      // Third level and beyond - purple
      return 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-md shadow-purple-500/30'
    }
  }

  const getStatusColor = (status?: number) => {
    switch (status) {
      case 1: return 'bg-green-500' // InProgress
      case 2: return 'bg-emerald-600' // Completed
      case 3: return 'bg-yellow-500' // OnHold
      case 4: return 'bg-gray-500' // Cancelled
      default: return 'bg-gray-400' // NotStarted
    }
  }

  const renderTask = (task: GanttTask, index: number) => {
    const position = getTaskPosition(
      task.calculatedStartDate,
      task.calculatedEndDate
    )
    const hasSubTasks = task.subTasks && task.subTasks.length > 0
    const isExpanded = expandedTasks.has(task.taskId)
    // Support up to 3 levels with proper indentation (24px per level)
    const indentLevel = Math.min((task.level || 0), 2) * 24

    return (
      <div key={task.taskId}>
        <div
          className="flex border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all group"
          style={{ minHeight: '60px' }}
        >
          {/* Task Name Column */}
          <div 
            className="w-64 border-r border-gray-200 p-4 bg-white flex items-center group-hover:bg-gray-50 transition-colors"
            style={{ paddingLeft: `${16 + indentLevel}px` }}
          >
            <div className="flex-1 flex items-center gap-2">
              {hasSubTasks ? (
                <button
                  onClick={() => toggleTaskExpansion(task.taskId)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title={isExpanded ? 'بستن' : 'باز کردن'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-6 flex-shrink-0" />
              )}
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(task.status)}`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-gray-900 text-sm truncate ${
                    task.level === 0 ? 'font-bold' : task.level === 1 ? 'font-semibold' : ''
                  }`}>
                    {task.taskName || `تسک ${index + 1}`}
                  </span>
                  {task.isOnCriticalPath && (
                    <Badge variant="danger" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                      بحرانی
                    </Badge>
                  )}
                </div>
                {task.calculatedStartDate && task.calculatedEndDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPersianDate(task.calculatedStartDate)} -{' '}
                    {formatPersianDate(task.calculatedEndDate)}
                  </div>
                )}
                {task.percentComplete !== undefined && (
                  <div className="mt-1">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                        style={{ width: `${task.percentComplete}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {task.percentComplete}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Column */}
          <div className="flex-1 relative bg-gradient-to-b from-gray-50 to-white">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {dateHeaders.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 border-r border-gray-200 border-dashed"
                ></div>
              ))}
            </div>

            {/* Task Bar */}
            {task.calculatedStartDate && task.calculatedEndDate && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg ${getTaskColor(
                  task
                )} text-white flex items-center justify-between px-3 cursor-pointer transition-all hover:scale-105 hover:shadow-xl group/task`}
                style={isRTL ? {
                  right: `${position.right}%`,
                  width: `${position.width}%`,
                  minWidth: '60px',
                } : {
                  left: `${position.left}%`,
                  width: `${position.width}%`,
                  minWidth: '60px',
                }}
                title={`${task.taskName}\n${formatPersianDate(
                  task.calculatedStartDate
                )} - ${formatPersianDate(task.calculatedEndDate)}\n${
                  task.calculatedDuration
                } روز`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                  <span className="text-xs font-semibold truncate">
                    {task.taskName}
                  </span>
                </div>
                <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded ml-2 whitespace-nowrap">
                  {task.calculatedDuration} روز
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Render SubTasks (supports multiple levels) */}
        {hasSubTasks && isExpanded && task.subTasks && (
          <div className={`${
            task.level === 0 ? 'bg-blue-50/30' : 
            task.level === 1 ? 'bg-indigo-50/20' : 
            'bg-gray-50/10'
          }`}>
            {task.subTasks.map((subTask, subIndex) => 
              renderTask(subTask, index * 100 + subIndex)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Controls */}
      <Card className="p-4 bg-gradient-to-br from-white to-gray-50/50">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {isRTL ? 'نمودار گانت' : 'Gantt Chart'}
              </h3>
              <p className="text-sm text-gray-500">
                {flatTasks.length} {isRTL ? 'تسک' : 'tasks'} • {totalDays} {isRTL ? 'روز' : 'days'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Version Selector */}
            <div className="relative">
              <select
                value={selectedVersion || 'current'}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionModal(true)}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isRTL ? 'ذخیره نسخه' : 'Save Version'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
            >
              {isRTL ? 'تاریخچه' : 'History'}
            </Button>

            {/* Zoom Controls */}
            <div className={`flex items-center gap-1 bg-gray-100 rounded-xl p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setZoom('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  zoom === 'day'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {isRTL ? 'روزانه' : 'Day'}
              </button>
              <button
                onClick={() => setZoom('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  zoom === 'week'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {isRTL ? 'هفتگی' : 'Week'}
              </button>
              <button
                onClick={() => setZoom('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  zoom === 'month'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {isRTL ? 'ماهانه' : 'Month'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-3 bg-gradient-to-br from-white to-gray-50/50">
        <div className={`flex flex-wrap items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'تسک اصلی (سطح 1)' : 'Main Task (Level 1)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'زیرتسک (سطح 2)' : 'Sub-task (Level 2)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'زیرزیرتسک (سطح 3)' : 'Sub-sub-task (Level 3)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'مسیر بحرانی' : 'Critical Path'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'در حال انجام' : 'In Progress'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span className="text-sm text-gray-700 font-medium">{isRTL ? 'تکمیل شده' : 'Completed'}</span>
          </div>
        </div>
      </Card>

      {/* Gantt Chart */}
      <Card className="p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50/50">
        <div ref={ganttRef} className="overflow-x-auto" style={{ maxHeight: '600px' }}>
          <div className="min-w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 border-b-2 border-gray-300 shadow-md">
              <div className="flex">
                <div className="w-64 border-r-2 border-gray-300 p-4 bg-white font-bold text-gray-800 flex items-center">
                  <span>{isRTL ? 'نام تسک' : 'Task Name'}</span>
                </div>
                <div className="flex-1 flex">
                  {dateHeaders.map((header, index) => (
                    <div
                      key={index}
                      className={`flex-1 border-r border-gray-200 p-3 text-center min-w-[120px] ${
                        header.isWeekend ? 'bg-red-50' : 'bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-800">
                        {header.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPersianDate(header.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white">
              {flatTasks.map((task, index) => renderTask(task, index))}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <div className="text-sm text-blue-700 font-medium">{isRTL ? 'کل تسک‌ها' : 'Total Tasks'}</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {flatTasks.length}
              </div>
            </div>
            <GitBranch className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <div className="text-sm text-red-700 font-medium">{isRTL ? 'مسیر بحرانی' : 'Critical Path'}</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {flatTasks.filter((t) => t.isOnCriticalPath).length}
              </div>
            </div>
            <div className="w-8 h-8 bg-red-600 rounded-lg opacity-50"></div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <div className="text-sm text-green-700 font-medium">{isRTL ? 'مدت زمان کل' : 'Total Duration'}</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{totalDays} {isRTL ? 'روز' : 'days'}</div>
            </div>
            <Calendar className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVersionModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
            <h3 className="text-lg font-bold mb-4">{isRTL ? 'ذخیره نسخه جدید' : 'Save New Version'}</h3>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder={isRTL ? 'نام نسخه' : 'Version name'}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4"
            />
            <div className={`flex gap-2 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
              <Button variant="outline" onClick={() => setShowVersionModal(false)}>
                {isRTL ? 'انصراف' : 'Cancel'}
              </Button>
              <Button onClick={saveVersion} className="bg-gradient-to-r from-primary-600 to-primary-700">
                {isRTL ? 'ذخیره' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
