import { useState, useEffect } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          relative
          bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700
          rounded-2xl
          flex items-center justify-center
          shadow-lg shadow-primary-500/50
          transition-all duration-300
          hover:shadow-xl hover:shadow-primary-500/60
          hover:scale-105
          group
        `}
      >
        {/* Animated background glow */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
          style={{
            animation: mounted ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
        
        {/* Letter I with modern design */}
        <span
          className="relative z-10 text-white font-bold"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          I
        </span>
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-white/20 rounded-bl-2xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-white/20 rounded-tr-2xl" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`
              ${textSizeClasses[size]}
              font-bold
              bg-gradient-to-r from-gray-900 to-gray-700
              bg-clip-text text-transparent
              leading-tight
            `}
          >
            IPMS
          </span>
          <span
            className="text-xs text-gray-500 font-medium leading-tight"
            style={{ fontSize: size === 'sm' ? '0.65rem' : size === 'md' ? '0.7rem' : '0.8rem' }}
          >
            IsIran Project Management System
          </span>
        </div>
      )}
    </div>
  )
}

