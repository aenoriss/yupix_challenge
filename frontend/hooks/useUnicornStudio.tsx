'use client'

import { useEffect, useRef, useState } from 'react'

interface UnicornSceneOptions {
  elementId: string
  projectId?: string
  filePath?: string
  fps?: number
  scale?: number
  dpi?: number
  lazyLoad?: boolean
  fixed?: boolean
  altText?: string
  ariaLabel?: string
  production?: boolean
  interactivity?: {
    mouse?: {
      disableMobile?: boolean
      disabled?: boolean
    }
  }
}

interface UnicornScene {
  destroy: () => void
  resize: () => void
  paused: boolean
}

declare global {
  interface Window {
    UnicornStudio: {
      addScene: (options: UnicornSceneOptions) => Promise<UnicornScene>
      destroy: () => void
      init: () => Promise<any[]>
      isInitialized: boolean
    }
  }
}

export function useUnicornStudio() {
  const [isReady, setIsReady] = useState(false)
  const sceneRef = useRef<UnicornScene | null>(null)

  useEffect(() => {
    const checkUnicornStudio = () => {
      if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
        window.UnicornStudio.init()
          .then(() => {
            window.UnicornStudio.isInitialized = true
            setIsReady(true)
          })
          .catch((err) => {
            console.error('Failed to initialize Unicorn Studio:', err)
          })
      } else if (window.UnicornStudio?.isInitialized) {
        setIsReady(true)
      }
    }

    if (typeof window !== 'undefined') {
      const script = document.querySelector('script[src*="unicornStudio"]')
      if (script) {
        script.addEventListener('load', checkUnicornStudio)
        checkUnicornStudio()
      } else {
        const newScript = document.createElement('script')
        newScript.src = '/unicornStudio.umd.js'
        newScript.onload = checkUnicornStudio
        document.head.appendChild(newScript)
      }
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy()
      }
    }
  }, [])

  const addScene = async (options: UnicornSceneOptions): Promise<UnicornScene | null> => {
    if (!isReady || !window.UnicornStudio) {
      console.error('Unicorn Studio not ready')
      return null
    }

    try {
      const scene = await window.UnicornStudio.addScene(options)
      sceneRef.current = scene
      return scene
    } catch (err) {
      console.error('Failed to add scene:', err)
      return null
    }
  }

  const destroyScene = () => {
    if (sceneRef.current) {
      sceneRef.current.destroy()
      sceneRef.current = null
    }
  }

  const pauseScene = (paused: boolean) => {
    if (sceneRef.current) {
      sceneRef.current.paused = paused
    }
  }

  const resizeScene = () => {
    if (sceneRef.current) {
      sceneRef.current.resize()
    }
  }

  return {
    isReady,
    addScene,
    destroyScene,
    pauseScene,
    resizeScene,
    scene: sceneRef.current
  }
}