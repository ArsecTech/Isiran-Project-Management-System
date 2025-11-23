import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className,
  hover = false,
  padding = 'md',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-md border border-gray-200/50',
        'backdrop-blur-sm bg-gradient-to-br from-white to-gray-50/50',
        paddings[padding],
        hover && 'hover:shadow-xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}

