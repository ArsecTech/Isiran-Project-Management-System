import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'
import { formatPersianDate, parsePersianDate, parsePersianDateToDate } from '../../utils/dateUtils'

interface PersianDatePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  required?: boolean
  className?: string
  error?: string
}

export default function PersianDatePicker({
  value,
  onChange,
  label,
  required,
  className = '',
  error,
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      try {
        // Value is in YYYY-MM-DD format (Gregorian)
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setSelectedDate(date)
          setDisplayValue(formatPersianDate(date.toISOString()))
        } else {
          // If invalid date, set to today
          const today = new Date()
          setSelectedDate(today)
          setDisplayValue('')
        }
      } catch {
        // If error, set to today
        const today = new Date()
        setSelectedDate(today)
        setDisplayValue('')
      }
    } else {
      // If no value, set to today for calendar display
      const today = new Date()
      setSelectedDate(today)
      setDisplayValue('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setDisplayValue(formatPersianDate(date.toISOString()))
    setIsOpen(false)
    if (onChange) {
      onChange(date.toISOString().split('T')[0])
    }
  }

  const getToday = () => {
    const today = new Date()
    return today
  }

  const getPersianMonthName = (date: Date) => {
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    // Convert to Persian date
    const persianDateStr = formatPersianDate(date.toISOString())
    const persianDate = parsePersianDate(persianDateStr)
    return persianMonths[persianDate.month - 1]
  }

  const getPersianYear = (date: Date) => {
    const persianDateStr = formatPersianDate(date.toISOString())
    const persianDate = parsePersianDate(persianDateStr)
    return persianDate.year
  }

  const renderCalendar = () => {
    // Use selectedDate or default to today
    const dateToUse = selectedDate || new Date()

    // Convert to Persian calendar for display
    const persianDateStr = formatPersianDate(dateToUse.toISOString())
    const persianDate = parsePersianDate(persianDateStr)
    
    // Calculate days in Persian month
    const daysInPersianMonth = persianDate.month <= 6 ? 31 : persianDate.month <= 11 ? 30 : 29
    
    // Calculate first day of month in Persian calendar (simplified)
    const firstDayOfMonth = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), 1)
    const firstDayPersian = parsePersianDate(formatPersianDate(firstDayOfMonth.toISOString()))
    const startDayOfWeek = (firstDayPersian.day - 1) % 7 // Simplified calculation

    const days = []
    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />)
    }

    // Days of the month (in Persian)
    for (let day = 1; day <= daysInPersianMonth; day++) {
      // Convert Persian day to Gregorian for selection
      const tempPersianDate = `${persianDate.year}/${persianDate.month}/${day}`
      const gregorianDate = parsePersianDateToDate(tempPersianDate)
      
      const isToday = gregorianDate.toDateString() === getToday().toDateString()
      const isSelected = value && gregorianDate.toISOString().split('T')[0] === value

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(gregorianDate)}
          className={`
            w-10 h-10 rounded-lg text-sm font-medium transition-all
            ${isSelected ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : ''}
            ${isToday && !isSelected ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : ''}
            ${!isSelected && !isToday ? 'hover:bg-gray-100 text-gray-700 hover:scale-110' : ''}
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          readOnly
          value={displayValue}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3 pr-10 border rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
          `}
          placeholder="انتخاب تاریخ"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <Calendar className="w-5 h-5" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 w-80 bg-gradient-to-br from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const currentDate = selectedDate || new Date()
                const newDate = new Date(currentDate)
                newDate.setMonth(newDate.getMonth() - 1)
                setSelectedDate(newDate)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110"
            >
              ‹
            </button>
            <div className="text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              {getPersianMonthName(selectedDate || new Date())} {getPersianYear(selectedDate || new Date())}
            </div>
            <button
              type="button"
              onClick={() => {
                const currentDate = selectedDate || new Date()
                const newDate = new Date(currentDate)
                newDate.setMonth(newDate.getMonth() + 1)
                setSelectedDate(newDate)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day: string) => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => handleDateSelect(getToday())}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              امروز
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

