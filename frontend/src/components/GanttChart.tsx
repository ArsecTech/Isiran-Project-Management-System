import { useEffect, useState, useRef } from 'react'
import { ganttApi } from '../services/api'
import { format, addDays, differenceInDays } from 'date-fns'

interface GanttChartProps {
  projectId: string
}

interface GanttTask {
  taskId: string
  calculatedStartDate?: string
  calculatedEndDate?: string
  calculatedDuration: number
  isOnCriticalPath: boolean
}

interface GanttData {
  taskSchedules: GanttTask[]
  projectStartDate?: string
  projectEndDate?: string
  totalDuration: number
}

export default function GanttChart({ projectId }: GanttChartProps) {
  const [data, setData] = useState<GanttData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week')
  const ganttRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadGanttData()
  }, [projectId])

  const loadGanttData = async () => {
    try {
      setLoading(true)
      const response = await ganttApi.getSchedule(projectId)
      setData(response.data)
    } catch (error) {
      console.error('Failed to load Gantt data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return <div className="text-center py-12">Loading Gantt chart...</div>
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
    const headers: { date: Date; label: string }[] = []
    let current = new Date(startDate)

    while (current <= endDate) {
      headers.push({
        date: new Date(current),
        label: format(current, zoom === 'day' ? 'MMM dd' : zoom === 'week' ? 'MMM dd' : 'MMM yyyy'),
      })

      if (zoom === 'day') {
        current = addDays(current, 1)
      } else if (zoom === 'week') {
        current = addDays(current, 7)
      } else {
        current = addDays(current, 30)
      }
    }

    return headers
  }

  const dateHeaders = generateDateHeaders()

  const getTaskPosition = (taskStart?: string, taskEnd?: string) => {
    if (!taskStart || !taskEnd) return { left: 0, width: 0 }

    const start = new Date(taskStart)
    const end = new Date(taskEnd)

    const daysFromStart = differenceInDays(start, startDate)
    const taskDuration = differenceInDays(end, start)

    const leftPercent = (daysFromStart / totalDays) * 100
    const widthPercent = (taskDuration / totalDays) * 100

    return {
      left: Math.max(0, leftPercent),
      width: Math.max(2, widthPercent),
    }
  }

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setZoom('day')}
            className={`px-3 py-1 rounded ${
              zoom === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setZoom('week')}
            className={`px-3 py-1 rounded ${
              zoom === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setZoom('month')}
            className={`px-3 py-1 rounded ${
              zoom === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={ganttRef} className="overflow-x-auto border border-gray-200 rounded-lg">
        <div className="min-w-full">
          {/* Date Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-64 border-r border-gray-200 p-2 font-semibold text-gray-700">
              Task
            </div>
            <div className="flex-1 flex">
              {dateHeaders.map((header, index) => (
                <div
                  key={index}
                  className="flex-1 border-r border-gray-200 p-2 text-sm text-gray-600 text-center"
                >
                  {header.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white">
            {data.taskSchedules.map((task, index) => {
              const position = getTaskPosition(
                task.calculatedStartDate,
                task.calculatedEndDate
              )

              return (
                <div
                  key={task.taskId}
                  className="flex border-b border-gray-200 hover:bg-gray-50"
                >
                  <div className="w-64 border-r border-gray-200 p-2 text-sm text-gray-700">
                    Task {index + 1}
                  </div>
                  <div className="flex-1 relative h-10">
                    {task.calculatedStartDate && task.calculatedEndDate && (
                      <div
                        className={`absolute top-1 h-8 rounded ${
                          task.isOnCriticalPath
                            ? 'bg-red-500'
                            : 'bg-primary-500'
                        } text-white text-xs flex items-center justify-center px-2 cursor-move hover:opacity-80`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          minWidth: '20px',
                        }}
                        title={`${task.calculatedStartDate} - ${task.calculatedEndDate}`}
                      >
                        {task.calculatedDuration}d
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

