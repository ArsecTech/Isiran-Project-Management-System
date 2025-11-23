import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200',
    success: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
    warning: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
    danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200',
    info: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

