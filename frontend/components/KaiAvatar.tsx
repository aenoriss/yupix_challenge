'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface KaiAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function KaiAvatar({ size = 'md', className, onClick }: KaiAvatarProps) {
  const [glarePosition, setGlarePosition] = useState({ x: 30, y: 30 })
  
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  }
  
  const glareSize = {
    sm: { main: 'w-8 h-8', secondary: 'w-4 h-4' },
    md: { main: 'w-12 h-12', secondary: 'w-6 h-6' },
    lg: { main: 'w-16 h-16', secondary: 'w-8 h-8' }
  }
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlarePosition({
        x: 20 + Math.random() * 30,
        y: 20 + Math.random() * 30
      })
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setGlarePosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) })
  }
  
  return (
    <div 
      className={cn("relative group", className)}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setGlarePosition({ x: 30, y: 30 })}
    >
      <img 
        src="/kai.png"
        alt="Kai AI Assistant"
        className={cn(
          sizeClasses[size],
          "rounded-full object-cover shadow-lg transition-transform group-hover:scale-105",
          onClick && "cursor-pointer"
        )}
      />
      <div 
        className={cn(
          "absolute bg-white/50 rounded-full blur-xl transition-all duration-500",
          glareSize[size].main
        )}
        style={{
          left: `${glarePosition.x}%`,
          top: `${glarePosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div 
        className={cn(
          "absolute bg-white/30 rounded-full blur-lg transition-all duration-700",
          glareSize[size].secondary
        )}
        style={{
          left: `${glarePosition.x + 15}%`,
          top: `${glarePosition.y + 10}%`,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  )
}