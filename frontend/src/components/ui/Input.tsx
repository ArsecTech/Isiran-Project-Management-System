import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { useI18nStore } from '../../store/i18nStore'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const { isRTL } = useI18nStore()
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`absolute ${isRTL ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10`}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={clsx(
              'w-full px-4 py-3 border rounded-xl transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'bg-white shadow-sm',
              leftIcon && (isRTL ? 'pr-10' : 'pl-10'),
              rightIcon && (isRTL ? 'pl-10' : 'pr-10'),
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className={`absolute ${isRTL ? 'left' : 'right'}-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10`}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

