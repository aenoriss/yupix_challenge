'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLoading } from '@/hooks/useLoading'

declare global {
  interface Window {
    UnicornStudio: any
  }
}

export function UnicornBackground() {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const { setUnicornReady } = useLoading()
  
  useEffect(() => {
    const loadUnicornStudio = () => {
      if (!window.UnicornStudio) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js'
        script.onload = () => {
          if (window.UnicornStudio) {
            window.UnicornStudio.init()
            setUnicornReady(true)
          }
        }
        document.head.appendChild(script)
      } else {
        setTimeout(() => {
          if (window.UnicornStudio && window.UnicornStudio.init) {
            window.UnicornStudio.init()
            setUnicornReady(true)
          }
        }, 100)
      }
    }

    loadUnicornStudio()
  }, [pathname])

  return (
    <div className="fixed inset-0 z-0" ref={containerRef}>
      <div 
        data-us-project="nhT61VGiX4tOa7QO086O" 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}