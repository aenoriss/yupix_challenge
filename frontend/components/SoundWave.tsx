import { useEffect, useRef } from 'react'

interface SoundWaveProps {
  isActive: boolean
  audioLevel?: number
}

export function SoundWave({ isActive, audioLevel = 0 }: SoundWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 200
    canvas.height = 60

    let bars = 40
    let barWidth = canvas.width / bars / 2
    let animationOffset = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isActive) {
        ctx.fillStyle = 'hsl(var(--primary))'
        
        for (let i = 0; i < bars; i++) {
          const x = i * (barWidth * 2) + barWidth / 2
          const variance = Math.sin(animationOffset + i * 0.5) * 0.5 + 0.5
          const height = isActive 
            ? Math.max(4, (audioLevel * 40 + variance * 20))
            : 4
          
          ctx.fillRect(x, (canvas.height - height) / 2, barWidth, height)
        }
        
        animationOffset += 0.1
      } else {
        ctx.fillStyle = 'hsl(var(--muted-foreground))'
        for (let i = 0; i < bars; i++) {
          const x = i * (barWidth * 2) + barWidth / 2
          ctx.fillRect(x, (canvas.height - 4) / 2, barWidth, 4)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioLevel])

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[200px] h-[60px]"
    />
  )
}