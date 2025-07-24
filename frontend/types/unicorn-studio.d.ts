declare module 'unicorn-studio' {
  export interface UnicornSceneOptions {
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

  export interface UnicornScene {
    destroy: () => void
    resize: () => void
    paused: boolean
  }

  export interface UnicornStudioInstance {
    init: () => Promise<UnicornScene[]>
    addScene: (options: UnicornSceneOptions) => Promise<UnicornScene>
    destroy: () => void
    isInitialized: boolean
  }

  const UnicornStudio: UnicornStudioInstance
  export default UnicornStudio
}