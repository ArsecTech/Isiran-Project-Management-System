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
  taskSchedules: GanttTask[] // Root tasks only (for rendering)
  allTasks: GanttTask[] // All tasks (for summary cards)
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
  
  // Ensure expandedTasks is set when data changes
  useEffect(() => {
    if (data && data.taskSchedules && data.taskSchedules.length > 0) {
      const collectAllTaskIds = (tasks: GanttTask[], taskIds: Set<string> = new Set()): Set<string> => {
        tasks.forEach(task => {
          taskIds.add(task.taskId)
          if (task.subTasks && task.subTasks.length > 0) {
            collectAllTaskIds(task.subTasks, taskIds)
          }
        })
        return taskIds
      }
      
      const allTaskIds = collectAllTaskIds(data.taskSchedules)
      const currentIds = Array.from(expandedTasks).sort()
      const newIds = Array.from(allTaskIds).sort()
      const idsMatch = currentIds.length === newIds.length && 
                       currentIds.every((id, idx) => id === newIds[idx])
      
      if (!idsMatch) {
        console.log('🟦 [Gantt] useEffect: Updating expandedTasks from', expandedTasks.size, 'to', allTaskIds.size)
        console.log('🟦 [Gantt] Current IDs:', currentIds)
        console.log('🟦 [Gantt] New IDs:', newIds)
        setExpandedTasks(allTaskIds)
      }
    }
  }, [data?.taskSchedules]) // Only depend on taskSchedules, not the whole data object

  const loadGanttData = async () => {
    try {
      setLoading(true)
      const response = await ganttApi.getSchedule(projectId)
      console.log('🟦 [Gantt] Raw API response:', JSON.stringify(response.data, null, 2))
      console.log('🟦 [Gantt] TaskSchedules from API:', response.data.taskSchedules?.length || 0)
      console.log('🟦 [Gantt] TaskSchedules details:', response.data.taskSchedules?.map((t: any) => ({
        taskId: t.taskId,
        taskName: t.taskName,
        parentTaskId: t.parentTaskId,
        level: t.level
      })))
      
      const allTasksFlat = (response.data.taskSchedules || []).map((t: any) => ({
        taskId: t.taskId,
        taskName: t.taskName || t.name || '',
        calculatedStartDate: t.calculatedStartDate,
        calculatedEndDate: t.calculatedEndDate,
        calculatedDuration: t.calculatedDuration || 0,
        isOnCriticalPath: t.isOnCriticalPath || false,
        parentTaskId: t.parentTaskId,
        level: t.level || 0,
        subTasks: [],
        percentComplete: t.percentComplete,
        status: t.status
      }))
      
      const hierarchicalData = buildHierarchicalTasks(response.data.taskSchedules || [])
      console.log('🟦 [Gantt] After buildHierarchicalTasks:', hierarchicalData.length, 'root tasks')
      console.log('🟦 [Gantt] Root tasks details:', hierarchicalData.map(t => ({
        id: t.taskId,
        name: t.taskName,
        subTasksCount: t.subTasks?.length || 0,
        subTaskIds: t.subTasks?.map(st => st.taskId) || [],
        subTasksDetails: t.subTasks?.map(st => ({
          id: st.taskId,
          name: st.taskName,
          subTasksCount: st.subTasks?.length || 0
        })) || []
      })))
      
      // Set all tasks as expanded by default (to show full hierarchy)
      const collectAllTaskIds = (tasks: GanttTask[], taskIds: Set<string> = new Set()): Set<string> => {
        tasks.forEach(task => {
          taskIds.add(task.taskId)
          console.log('🟦 [Gantt] Adding to expanded:', task.taskId, task.taskName, 'hasSubTasks:', task.subTasks?.length || 0)
          if (task.subTasks && task.subTasks.length > 0) {
            collectAllTaskIds(task.subTasks, taskIds)
          }
        })
        return taskIds
      }
      
      const allTaskIds = collectAllTaskIds(hierarchicalData)
      console.log('🟦 [Gantt] Before setExpandedTasks - allTaskIds:', Array.from(allTaskIds))
      console.log('🟦 [Gantt] Hierarchical data structure:', JSON.stringify(hierarchicalData.map(t => ({
        id: t.taskId,
        name: t.taskName,
        subTasks: t.subTasks?.map(st => ({
          id: st.taskId,
          name: st.taskName,
          subTasks: st.subTasks?.map(sst => ({
            id: sst.taskId,
            name: sst.taskName
          })) || []
        })) || []
      })), null, 2))
      
      // Set data first
      setData({
        ...response.data,
        taskSchedules: hierarchicalData, // Root tasks only (for rendering)
        allTasks: allTasksFlat // All tasks (for summary cards)
      })
      
      // Then set expanded tasks - ensure it happens after data is set
      setExpandedTasks(new Set(allTaskIds))
      console.log('🟦 [Gantt] Set expanded tasks:', allTaskIds.size, 'tasks')
      console.log('🟦 [Gantt] Expanded task IDs:', Array.from(allTaskIds))
    } catch (error) {
      console.error('❌ [Gantt] Failed to load Gantt data:', error)
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
    console.log('🔵 [Gantt] buildHierarchicalTasks - START')
    console.log('🔵 [Gantt] Input tasks count:', tasks?.length || 0)
    console.log('🔵 [Gantt] Input tasks:', JSON.stringify(tasks, null, 2))
    
    if (!tasks || tasks.length === 0) return []
    
    // Step 1: Remove duplicate tasks by taskId (keep first occurrence)
    const uniqueTasks = new Map<string, any>()
    tasks.forEach(task => {
      if (task.taskId && !uniqueTasks.has(task.taskId)) {
        uniqueTasks.set(task.taskId, task)
      } else if (task.taskId) {
        console.log('🟡 [Gantt] Duplicate task found in input:', task.taskId, task.taskName)
      }
    })
    const deduplicatedTasks = Array.from(uniqueTasks.values())
    console.log('🔵 [Gantt] After deduplication:', deduplicatedTasks.length, 'tasks')
    
    const taskMap = new Map<string, GanttTask>()
    const rootTasks: GanttTask[] = []
    const childTaskIds = new Set<string>() // Track all tasks that are children

    // Step 2: Create all tasks with their data
    deduplicatedTasks.forEach(task => {
      taskMap.set(task.taskId, {
        taskId: task.taskId,
        taskName: task.taskName || task.name || '',
        calculatedStartDate: task.calculatedStartDate,
        calculatedEndDate: task.calculatedEndDate,
        calculatedDuration: task.calculatedDuration || 0,
        isOnCriticalPath: task.isOnCriticalPath || false,
        parentTaskId: task.parentTaskId,
        level: 0, // Will be calculated later
        subTasks: [],
        percentComplete: task.percentComplete,
        status: task.status
      })
      
      // Track which tasks are children (have a parent)
      if (task.parentTaskId) {
        childTaskIds.add(task.taskId)
        console.log('🟢 [Gantt] Child task:', task.taskId, task.taskName, '-> Parent:', task.parentTaskId)
      } else {
        console.log('🔴 [Gantt] Root task:', task.taskId, task.taskName)
      }
    })
    console.log('🔵 [Gantt] Total tasks in map:', taskMap.size)
    console.log('🔵 [Gantt] Child tasks count:', childTaskIds.size)
    console.log('🔵 [Gantt] Child task IDs:', Array.from(childTaskIds))

    // Step 3: Build hierarchy - assign children to parents
    // Use a Set to track which tasks have been added as children
    const tasksAddedAsChildren = new Set<string>()
    
    deduplicatedTasks.forEach(task => {
      if (task.parentTaskId && taskMap.has(task.parentTaskId) && taskMap.has(task.taskId)) {
        // Only add if this task hasn't been added as a child before
        if (!tasksAddedAsChildren.has(task.taskId)) {
          const parentTask = taskMap.get(task.parentTaskId)!
          const childTask = taskMap.get(task.taskId)!
          
          // Ensure subTasks array exists
          if (!parentTask.subTasks) {
            parentTask.subTasks = []
          }
          
          // Double check: only add if not already in subTasks
          const alreadyExists = parentTask.subTasks.some(st => st.taskId === task.taskId)
          if (!alreadyExists) {
            // Triple check: ensure childTask is not the same as parentTask (prevent self-reference)
            if (childTask.taskId !== parentTask.taskId) {
              parentTask.subTasks.push(childTask)
              tasksAddedAsChildren.add(task.taskId)
              console.log('✅ [Gantt] Added child:', task.taskId, task.taskName, 'to parent:', task.parentTaskId, parentTask.taskName, 'Parent now has', parentTask.subTasks.length, 'subTasks')
            } else {
              console.log('❌ [Gantt] Cannot add task as child of itself:', task.taskId, task.taskName)
            }
          } else {
            console.log('⚠️ [Gantt] Child already exists in parent subTasks:', task.taskId, task.taskName, 'parent:', parentTask.taskId)
          }
        } else {
          console.log('⚠️ [Gantt] Task already added as child (skipping):', task.taskId, task.taskName)
        }
      } else if (task.parentTaskId) {
        console.log('❌ [Gantt] Cannot add child - parent or child not found:', {
          taskId: task.taskId,
          taskName: task.taskName,
          parentTaskId: task.parentTaskId,
          parentExists: taskMap.has(task.parentTaskId),
          childExists: taskMap.has(task.taskId)
        })
      }
    })
    console.log('🔵 [Gantt] Tasks added as children:', Array.from(tasksAddedAsChildren))

    // Step 4: Clean up any remaining duplicates in subTasks (without clearing valid subTasks)
    const cleanSubTasks = (task: GanttTask, parentPath: Set<string> = new Set()) => {
      // Check for circular reference: if this task is in the parent path, it's a circular reference
      if (parentPath.has(task.taskId)) {
        console.log('⚠️ [Gantt] Circular reference detected for task:', task.taskId, task.taskName, 'parentPath:', Array.from(parentPath))
        // Don't clear subTasks, just return to prevent infinite recursion
        return
      }
      
      // Create new path including current task
      const newPath = new Set(parentPath)
      newPath.add(task.taskId)
      
      if (task.subTasks && task.subTasks.length > 0) {
        // Remove duplicates using Map (keep first occurrence)
        const uniqueSubTasksMap = new Map<string, GanttTask>()
        task.subTasks.forEach(subTask => {
          if (!uniqueSubTasksMap.has(subTask.taskId)) {
            // Check for circular reference before adding
            if (!newPath.has(subTask.taskId)) {
              uniqueSubTasksMap.set(subTask.taskId, subTask)
              // Recursively clean subTasks with the new path
              cleanSubTasks(subTask, new Set(newPath))
            } else {
              console.log('⚠️ [Gantt] Circular reference detected - skipping subTask:', subTask.taskId, subTask.taskName, 'in parent:', task.taskId)
            }
          } else {
            console.log('⚠️ [Gantt] Duplicate subTask found and removed:', subTask.taskId, subTask.taskName, 'in parent:', task.taskId)
          }
        })
        task.subTasks = Array.from(uniqueSubTasksMap.values())
        console.log('🔵 [Gantt] Cleaned subTasks for:', task.taskId, task.taskName, '->', task.subTasks.length, 'unique subTasks')
      }
    }

    // Step 5: Calculate levels recursively
    const calculateLevels = (task: GanttTask, level: number = 0, visited: Set<string> = new Set()) => {
      // Prevent infinite loops
      if (visited.has(task.taskId)) {
        console.log('⚠️ [Gantt] Already visited in calculateLevels for:', task.taskId)
        return
      }
      visited.add(task.taskId)
      
      task.level = level
      
      if (task.subTasks && task.subTasks.length > 0) {
        // Recursively calculate levels for children
        task.subTasks.forEach(subTask => {
          if (!visited.has(subTask.taskId)) {
            calculateLevels(subTask, level + 1, new Set(visited))
          }
        })
      }
    }

    // Step 6: Find root tasks (tasks that are NOT children) and calculate levels
    const rootTaskIds = new Set<string>()
    deduplicatedTasks.forEach(task => {
      if (!childTaskIds.has(task.taskId)) {
        rootTaskIds.add(task.taskId)
      }
    })
    console.log('🔵 [Gantt] Root task IDs found:', Array.from(rootTaskIds))
    
    // Step 7: Clean duplicates from all tasks before adding to root
    // Clean subTasks for all tasks in the map first
    taskMap.forEach((task) => {
      cleanSubTasks(task, new Set())
    })
    
    // Step 8: Only add unique root tasks
    rootTaskIds.forEach(rootTaskId => {
      if (taskMap.has(rootTaskId)) {
        const rootTask = taskMap.get(rootTaskId)!
        // Make sure this task hasn't been added as a child
        if (!tasksAddedAsChildren.has(rootTaskId)) {
          rootTasks.push(rootTask)
          calculateLevels(rootTask, 0)
          console.log('✅ [Gantt] Added root task:', rootTaskId, rootTask.taskName, 'subTasks count:', rootTask.subTasks?.length || 0)
          if (rootTask.subTasks && rootTask.subTasks.length > 0) {
            console.log('✅ [Gantt] Root task subTasks:', rootTask.subTasks.map(st => ({
              id: st.taskId,
              name: st.taskName,
              subTasksCount: st.subTasks?.length || 0
            })))
          }
        } else {
          console.log('⚠️ [Gantt] Root task was already added as child (skipping):', rootTaskId)
        }
      } else {
        console.log('❌ [Gantt] Root task not found in map:', rootTaskId)
      }
    })
    console.log('🔵 [Gantt] Final root tasks count:', rootTasks.length)
    console.log('🔵 [Gantt] Final root tasks with subTasks:', rootTasks.map(rt => ({
      id: rt.taskId,
      name: rt.taskName,
      subTasksCount: rt.subTasks?.length || 0,
      subTasks: rt.subTasks?.map(st => ({
        id: st.taskId,
        name: st.taskName,
        subTasksCount: st.subTasks?.length || 0
      })) || []
    })))

    return rootTasks
  }
  
  // Helper function to collect all task IDs recursively
  const collectAllTaskIds = (tasks: GanttTask[], taskIds: Set<string> = new Set()): Set<string> => {
    tasks.forEach(task => {
      taskIds.add(task.taskId)
      if (task.subTasks && task.subTasks.length > 0) {
        collectAllTaskIds(task.subTasks, taskIds)
      }
    })
    return taskIds
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

  // data.taskSchedules already contains only root tasks from buildHierarchicalTasks
  // So we can use them directly - subTasks will be rendered recursively
  // IMPORTANT: Only render root tasks here, subTasks will be rendered inside renderTask
  const rootTasksOnly = data.taskSchedules || []
  console.log('🟠 [Gantt] Root tasks only (for rendering):', rootTasksOnly.length)
  console.log('🟠 [Gantt] Expanded tasks state:', {
    size: expandedTasks.size,
    hasAll: Array.from(expandedTasks)
  })
  console.log('🟠 [Gantt] Root task IDs:', rootTasksOnly.map(t => ({ 
    id: t.taskId, 
    name: t.taskName, 
    subTasksCount: t.subTasks?.length || 0,
    subTaskIds: t.subTasks?.map(st => st.taskId) || [],
    isExpanded: expandedTasks.has(t.taskId),
    subTasksDetails: t.subTasks?.map(st => ({
      id: st.taskId,
      name: st.taskName,
      subTasksCount: st.subTasks?.length || 0,
      isExpanded: expandedTasks.has(st.taskId)
    })) || []
  })))

  if (rootTasksOnly.length === 0) {
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

  const renderTask = (task: GanttTask, index: number, parentTask?: GanttTask, renderedTaskIds: Set<string> = new Set()) => {
    // Prevent duplicate rendering
    if (renderedTaskIds.has(task.taskId)) {
      console.log('⚠️ [Gantt] Task already rendered, skipping:', task.taskId, task.taskName)
      return null
    }
    renderedTaskIds.add(task.taskId)
    
    const position = getTaskPosition(
      task.calculatedStartDate,
      task.calculatedEndDate
    )
    const hasSubTasks = task.subTasks && task.subTasks.length > 0
    const isExpanded = expandedTasks.has(task.taskId)
    const taskLevel = task.level || 0
    
    // Always log for debugging
    console.log('🎨 [Gantt] Rendering task:', {
      taskId: task.taskId,
      taskName: task.taskName,
      level: taskLevel,
      hasSubTasks,
      subTasksCount: task.subTasks?.length || 0,
      subTaskIds: task.subTasks?.map(st => st.taskId) || [],
      isExpanded,
      expandedTasksSize: expandedTasks.size,
      isInExpandedSet: expandedTasks.has(task.taskId)
    })
    // Better indentation: 32px per level with visual connectors
    const indentLevel = taskLevel * 32
    const isLastChild = parentTask && parentTask.subTasks && 
      parentTask.subTasks[parentTask.subTasks.length - 1]?.taskId === task.taskId

    // Calculate summary bar for parent tasks
    const getSummaryBar = () => {
      if (!hasSubTasks || !isExpanded || !task.subTasks || task.subTasks.length === 0) return null
      
      const subTaskDates = task.subTasks
        .filter(st => st.calculatedStartDate && st.calculatedEndDate)
        .map(st => ({
          start: new Date(st.calculatedStartDate!),
          end: new Date(st.calculatedEndDate!)
        }))
      
      if (subTaskDates.length === 0) return null
      
      const minStart = new Date(Math.min(...subTaskDates.map(d => d.start.getTime())))
      const maxEnd = new Date(Math.max(...subTaskDates.map(d => d.end.getTime())))
      
      const summaryPosition = getTaskPosition(
        minStart.toISOString(),
        maxEnd.toISOString()
      )
      
      return { position: summaryPosition, start: minStart, end: maxEnd }
    }

    const summaryBar = getSummaryBar()

    return (
      <div key={task.taskId} className="relative">
        {/* Connector Lines for Hierarchy */}
        {taskLevel > 0 && (
          <div 
            className="absolute top-0 bottom-0 z-0"
            style={{
              left: `${indentLevel - 20}px`,
              width: '3px',
            }}
          >
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 w-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 opacity-60"></div>
            {/* Horizontal connector to parent */}
            <div 
              className="absolute top-1/2 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 opacity-60"
              style={{
                left: '-20px',
                width: '20px',
                top: '50%',
              }}
            />
            {/* Vertical line extension if not last child */}
            {!isLastChild && (
              <div 
                className="absolute top-0 bottom-0 w-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 opacity-60"
                style={{
                  left: '-20px',
                  height: '100%',
                }}
              />
            )}
          </div>
        )}

        <div
          className={`flex border-b-2 transition-all duration-300 group relative min-w-max ${
            taskLevel === 0 
              ? 'border-blue-200/50 bg-gradient-to-r from-blue-50/40 via-white to-white hover:from-blue-50 hover:via-blue-50/30 hover:to-white hover:shadow-md' 
              : taskLevel === 1
              ? 'border-indigo-200/50 bg-gradient-to-r from-indigo-50/30 via-white to-white hover:from-indigo-50 hover:via-indigo-50/20 hover:to-white hover:shadow-md'
              : 'border-purple-200/50 bg-gradient-to-r from-purple-50/20 via-white to-white hover:from-purple-50 hover:via-purple-50/10 hover:to-white hover:shadow-md'
          }`}
          style={{ minHeight: hasSubTasks ? '80px' : '70px' }}
        >
          {/* Task Name Column */}
          <div 
            className={`w-72 border-r-2 border-gray-200 p-5 flex items-center transition-all duration-300 relative z-10 shrink-0 sticky left-0 backdrop-blur-sm ${
              taskLevel === 0 
                ? 'bg-gradient-to-br from-blue-50/60 via-blue-50/30 to-white shadow-sm' 
                : taskLevel === 1
                ? 'bg-gradient-to-br from-indigo-50/40 via-indigo-50/20 to-white shadow-sm'
                : 'bg-gradient-to-br from-purple-50/20 to-white shadow-sm'
            }`}
            style={{ 
              paddingLeft: `${20 + indentLevel}px`,
              paddingRight: '20px',
              left: '0',
            }}
          >
            <div className="flex-1 flex items-center gap-3">
              {hasSubTasks ? (
                <button
                  onClick={() => toggleTaskExpansion(task.taskId)}
                  className={`p-2 hover:bg-gray-200 rounded-xl transition-all flex-shrink-0 shadow-md hover:shadow-lg transform hover:scale-110 ${
                    isExpanded ? 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700' : 'bg-white text-gray-600'
                  }`}
                  title={isExpanded ? (isRTL ? 'بستن' : 'Collapse') : (isRTL ? 'باز کردن' : 'Expand')}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div className="w-9 flex-shrink-0" />
              )}
              
              {/* Level Indicator */}
              {taskLevel > 0 && (
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 shadow-sm ${
                  taskLevel === 1 ? 'bg-gradient-to-b from-indigo-400 to-indigo-600' : 'bg-gradient-to-b from-purple-400 to-purple-600'
                }`} />
              )}
              
              <div
                className={`w-4 h-4 rounded-full flex-shrink-0 shadow-lg border-2 border-white ${getStatusColor(task.status)}`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-gray-900 truncate ${
                    taskLevel === 0 ? 'font-bold text-base' : taskLevel === 1 ? 'font-semibold text-sm' : 'font-medium text-sm'
                  }`}>
                    {task.taskName || `تسک ${index + 1}`}
                  </span>
                  {task.isOnCriticalPath && (
                    <Badge variant="danger" className="text-xs px-2 py-1 flex-shrink-0 animate-pulse shadow-md">
                      ⚡ {isRTL ? 'بحرانی' : 'Critical'}
                    </Badge>
                  )}
                  {taskLevel > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-semibold border border-gray-200">
                      L{taskLevel + 1}
                    </span>
                  )}
                </div>
                {task.calculatedStartDate && task.calculatedEndDate && (
                  <div className="text-xs text-gray-600 mt-2 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    {formatPersianDate(task.calculatedStartDate)} - {formatPersianDate(task.calculatedEndDate)}
                  </div>
                )}
                {task.percentComplete !== undefined && (
                  <div className="mt-3">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-300">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 transition-all duration-500 shadow-md"
                        style={{ width: `${task.percentComplete}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 mt-1 font-semibold">
                      {task.percentComplete}% {isRTL ? 'تکمیل شده' : 'Complete'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Column */}
          <div className="flex-1 relative bg-gradient-to-b from-gray-50 via-white to-gray-50/50 min-w-max">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex min-w-max">
              {dateHeaders.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-36 border-r-2 shrink-0 transition-colors ${
                    idx % 7 === 0 ? 'border-primary-300 bg-primary-50/20' : 'border-gray-200'
                  } ${idx % 7 === 0 ? 'border-solid' : 'border-dashed'}`}
                ></div>
              ))}
            </div>

            {/* Summary Bar for Parent Tasks */}
            {summaryBar && (
              <div
                className="absolute top-3 h-4 rounded-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 opacity-50 border-2 border-dashed border-gray-600 z-0 shadow-lg"
                style={{
                  left: `${summaryBar.position.left}%`,
                  width: `${summaryBar.position.width}%`,
                  minWidth: '50px',
                }}
                title={`${isRTL ? 'خلاصه' : 'Summary'}: ${formatPersianDate(summaryBar.start)} - ${formatPersianDate(summaryBar.end)}`}
              />
            )}

            {/* Task Bar */}
            {task.calculatedStartDate && task.calculatedEndDate && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 rounded-xl ${getTaskColor(
                  task
                )} text-white flex items-center justify-between px-4 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:z-20 group/task border-3 border-white/40 shadow-xl ${
                  hasSubTasks ? 'h-14' : 'h-12'
                }`}
                style={{
                  left: `${position.left}%`,
                  width: `${position.width}%`,
                  minWidth: '80px',
                }}
                title={`${task.taskName}\n${formatPersianDate(
                  task.calculatedStartDate
                )} - ${formatPersianDate(task.calculatedEndDate)}\n${
                  task.calculatedDuration
                } ${isRTL ? 'روز' : 'days'}\n${task.percentComplete !== undefined ? `${task.percentComplete}% ${isRTL ? 'تکمیل شده' : 'Complete'}` : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 bg-white rounded-full shadow-lg flex-shrink-0 ${
                    task.isOnCriticalPath ? 'animate-pulse ring-2 ring-red-300' : ''
                  }`}></div>
                  <span className={`font-bold truncate ${
                    hasSubTasks ? 'text-sm' : 'text-xs'
                  }`}>
                    {task.taskName}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {task.percentComplete !== undefined && task.percentComplete > 0 && (
                    <div className="text-xs font-bold bg-white/40 px-2.5 py-1 rounded-lg shadow-md backdrop-blur-sm">
                      {task.percentComplete}%
                    </div>
                  )}
                  <div className="text-xs font-bold bg-white/30 px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md backdrop-blur-sm">
                    {task.calculatedDuration} {isRTL ? 'روز' : 'd'}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator on Task Bar */}
            {task.percentComplete !== undefined && task.percentComplete > 0 && 
             task.calculatedStartDate && task.calculatedEndDate && (
              <div
                className={`absolute top-1/2 translate-y-3 rounded-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 shadow-lg ${
                  task.isOnCriticalPath ? 'ring-2 ring-red-400' : ''
                }`}
                style={{
                  left: `${position.left}%`,
                  width: `${(position.width * task.percentComplete) / 100}%`,
                  minWidth: '6px',
                }}
              />
            )}
          </div>
        </div>
        
        {/* Render SubTasks (supports multiple levels) - Only render if expanded */}
        {/* CRITICAL: Only render subTasks here, they should NOT be in the root tasks list */}
        {(() => {
          console.log('🔍 [Gantt] Checking subTasks render for:', task.taskId, task.taskName, {
            hasSubTasks,
            isExpanded,
            subTasksCount: task.subTasks?.length || 0,
            expandedTasksHas: expandedTasks.has(task.taskId),
            expandedTasksSize: expandedTasks.size
          })
          
          if (!hasSubTasks) {
            console.log('❌ [Gantt] No subTasks for:', task.taskId)
            return null
          }
          
          if (!isExpanded) {
            console.log('❌ [Gantt] Task not expanded:', task.taskId, 'expandedTasks.has:', expandedTasks.has(task.taskId))
            return null
          }
          
          if (!task.subTasks || task.subTasks.length === 0) {
            console.log('❌ [Gantt] subTasks array is empty for:', task.taskId)
            return null
          }
          
          console.log('✅ [Gantt] Rendering subTasks for:', task.taskId, 'count:', task.subTasks.length)
          
          return (
            <div className={`relative transition-all duration-300 ${
              task.level === 0 ? 'bg-gradient-to-r from-blue-50/30 via-blue-50/20 to-transparent border-l-4 border-blue-400 shadow-inner' : 
              task.level === 1 ? 'bg-gradient-to-r from-indigo-50/25 via-indigo-50/15 to-transparent border-l-4 border-indigo-400 shadow-inner' : 
              'bg-gradient-to-r from-purple-50/20 via-purple-50/10 to-transparent border-l-4 border-purple-400 shadow-inner'
            }`}>
              {task.subTasks
                .filter((subTask, idx, arr) => {
                  // Remove duplicates: only keep first occurrence
                  return arr.findIndex(t => t.taskId === subTask.taskId) === idx
                })
                .map((subTask, subIndex) => {
                  console.log('🟠 [Gantt] Rendering subTask:', subTask.taskId, subTask.taskName, 'of parent:', task.taskId, 'subIndex:', subIndex)
                  return renderTask(subTask, index * 1000 + subIndex, task, renderedTaskIds)
                })}
            </div>
          )
        })()}
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="ltr">
      {/* Header with Controls */}
      <Card className="p-6 bg-gradient-to-br from-white via-primary-50/30 to-white shadow-xl border border-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                {isRTL ? 'نمودار گانت' : 'Gantt Chart'}
              </h3>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {data.allTasks?.length || data.taskSchedules.length} {isRTL ? 'تسک' : 'tasks'} • {totalDays} {isRTL ? 'روز' : 'days'} • {formatPersianDate(startDate)} - {formatPersianDate(endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Version Selector */}
            <div className="relative">
              <select
                value={selectedVersion || 'current'}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                dir="ltr"
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
              className="border-2 hover:bg-primary-50 hover:border-primary-300 transition-all shadow-sm hover:shadow-md"
            >
              {isRTL ? 'ذخیره نسخه' : 'Save Version'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
              className="border-2 hover:bg-primary-50 hover:border-primary-300 transition-all shadow-sm hover:shadow-md"
            >
              {isRTL ? 'تاریخچه' : 'History'}
            </Button>

      {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1.5 border border-gray-200 shadow-inner">
          <button
            onClick={() => setZoom('day')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 ${
                  zoom === 'day'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-white'
                }`}
              >
                {isRTL ? 'روزانه' : 'Day'}
          </button>
          <button
            onClick={() => setZoom('week')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 ${
                  zoom === 'week'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-white'
                }`}
              >
                {isRTL ? 'هفتگی' : 'Week'}
          </button>
          <button
            onClick={() => setZoom('month')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 ${
                  zoom === 'month'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-white'
                }`}
              >
                {isRTL ? 'ماهانه' : 'Month'}
          </button>
        </div>
      </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-gradient-to-br from-white via-gray-50 to-white shadow-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'تسک اصلی (سطح 1)' : 'Main Task (Level 1)'}</span>
          </div>
          {/* <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'زیرتسک (سطح 2)' : 'Sub-task (Level 2)'}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'زیرزیرتسک (سطح 3)' : 'Sub-sub-task (Level 3)'}</span>
          </div> */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-md animate-pulse"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'مسیر بحرانی' : 'Critical Path'}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm border-2 border-white"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'در حال انجام' : 'In Progress'}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm border-2 border-white"></div>
            <span className="text-sm text-gray-800 font-semibold">{isRTL ? 'تکمیل شده' : 'Completed'}</span>
          </div>
        </div>
      </Card>

      {/* Gantt Chart */}
      <Card className="p-0 overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white shadow-2xl border-2 border-gray-200">
        <div 
          ref={ganttRef} 
          className="overflow-auto scrollbar-thin scrollbar-thumb-primary-400 scrollbar-track-gray-100 hover:scrollbar-thumb-primary-500"
          style={{ 
            maxHeight: '75vh',
            height: '75vh',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="inline-block min-w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-50 via-white to-primary-50 border-b-4 border-primary-300 shadow-xl">
              <div className="flex min-w-max">
                <div className="w-72 border-r-4 border-primary-300 p-5 bg-gradient-to-br from-primary-50 to-white font-bold text-gray-900 flex items-center shrink-0 sticky left-0 z-30 shadow-xl backdrop-blur-sm">
                  <span className="text-base">{isRTL ? 'نام تسک' : 'Task Name'}</span>
            </div>
                <div className="flex min-w-max">
              {dateHeaders.map((header, index) => (
                <div
                  key={index}
                      className={`w-36 border-r-2 border-gray-200 p-4 text-center shrink-0 transition-colors ${
                        header.isWeekend ? 'bg-gradient-to-b from-red-50 to-red-100 border-red-200' : 'bg-white hover:bg-gray-50'
                      }`}
                >
                      <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {header.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1.5 whitespace-nowrap font-medium">
                        {formatPersianDate(header.date)}
                      </div>
                </div>
              ))}
                </div>
            </div>
          </div>

          {/* Tasks - Only render root tasks, subTasks will be rendered recursively */}
          {/* CRITICAL: rootTasksOnly should ONLY contain root tasks (no children) */}
            <div className="bg-white relative min-w-max">
              {(() => {
                const renderedTaskIds = new Set<string>()
                return rootTasksOnly
                  .filter((task, idx, arr) => {
                    // Safety check: ensure no duplicates in root tasks
                    return arr.findIndex(t => t.taskId === task.taskId) === idx
                  })
                  .map((task, index) => {
                    console.log('🟠 [Gantt] Rendering root task:', task.taskId, task.taskName, 'index:', index, 'subTasksCount:', task.subTasks?.length || 0)
                    return renderTask(task, index, undefined, renderedTaskIds)
                  })
                  .filter(task => task !== null)
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-2 border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 font-semibold uppercase tracking-wide mb-2">{isRTL ? 'کل تسک‌ها' : 'Total Tasks'}</div>
              <div className="text-4xl font-bold text-blue-900 mt-1 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                {data.allTasks?.length || data.taskSchedules.length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg transform rotate-6 hover:rotate-12 transition-transform">
              <GitBranch className="w-10 h-10 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-2 border-red-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-700 font-semibold uppercase tracking-wide mb-2">{isRTL ? 'مسیر بحرانی' : 'Critical Path'}</div>
              <div className="text-4xl font-bold text-red-900 mt-1 bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
                {(data.allTasks || data.taskSchedules).filter((t) => t.isOnCriticalPath).length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg transform -rotate-6 hover:-rotate-12 transition-transform">
              <div className="w-10 h-10 bg-white rounded-lg opacity-90"></div>
            </div>
                  </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-2 border-green-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-700 font-semibold uppercase tracking-wide mb-2">{isRTL ? 'مدت زمان کل' : 'Total Duration'}</div>
              <div className="text-4xl font-bold text-green-900 mt-1 bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">{totalDays} {isRTL ? 'روز' : 'days'}</div>
                      </div>
            <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg transform rotate-6 hover:rotate-12 transition-transform">
              <Calendar className="w-10 h-10 text-white" />
                  </div>
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
