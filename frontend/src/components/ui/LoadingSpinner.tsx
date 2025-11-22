import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <Loader2 className={clsx('animate-spin text-primary-600', sizes[size])} />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  )
}

