'use client'

import { useEffect } from 'react'
import { useLoading } from '@/hooks/useLoading'
import { LoadingScreen } from './LoadingScreen'
import { usePathname } from 'next/navigation'

export function LoadingManager({ children }: { children: React.ReactNode }) {
  const { isLoading, setLoading, setUnicornReady, reset } = useLoading()
  const pathname = usePathname()
  
  useEffect(() => {
    reset()
    
    const checkUnicornStudio = () => {
      if (window.UnicornStudio) {
        setUnicornReady(true)
        setTimeout(() => setLoading(false), 300)
      } else {
        setTimeout(checkUnicornStudio, 100)
      }
    }
    
    const timer = setTimeout(() => {
      checkUnicornStudio()
    }, 100)
    
    const fallbackTimer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
    }
  }, [pathname, reset, setLoading, setUnicornReady])
  
  return (
    <>
      {isLoading && <LoadingScreen />}
      <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
        {children}
      </div>
    </>
  )
}