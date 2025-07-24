'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface UnicornStudioProps {
  projectId: string
  className?: string
  width?: number | string
  height?: number | string
  scale?: number
  dpi?: number
  lazyLoad?: boolean
  disableMobile?: boolean
  disableMouse?: boolean
  altText?: string
  ariaLabel?: string
}

declare global {
  interface Window {
    UnicornStudio: any
  }
}

export function UnicornStudio({
  projectId,
  className = '',
  width = '100%',
  height = '100%',
  scale = 1,
  dpi = 1.5,
  lazyLoad = true,
  disableMobile = false,
  disableMouse = false,
  altText = 'Unicorn Studio Scene',
  ariaLabel = 'Interactive 3D Scene'
}: UnicornStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.UnicornStudio) return

    const container = containerRef.current
    container.setAttribute('data-us-project', projectId)
    container.setAttribute('data-us-scale', scale.toString())
    container.setAttribute('data-us-dpi', dpi.toString())
    container.setAttribute('data-us-lazyload', lazyLoad.toString())
    container.setAttribute('data-us-disablemobile', disableMobile.toString())
    container.setAttribute('data-us-disablemouse', disableMouse.toString())
    container.setAttribute('data-us-alttext', altText)
    container.setAttribute('data-us-arialabel', ariaLabel)

    window.UnicornStudio.init()
      .then((scenes: any) => {
        console.log('Unicorn Studio scenes initialized:', scenes)
      })
      .catch((err: any) => {
        console.error('Failed to initialize Unicorn Studio:', err)
      })

    return () => {
      if (window.UnicornStudio && window.UnicornStudio.destroy) {
        window.UnicornStudio.destroy()
      }
    }
  }, [scriptLoaded, projectId, scale, dpi, lazyLoad, disableMobile, disableMouse, altText, ariaLabel])

  return (
    <>
      <Script
        src="/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className={className}
        style={{ width, height }}
      />
    </>
  )
}