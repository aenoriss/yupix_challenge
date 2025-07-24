'use client'

import { useEffect, useState, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Pencil, GripVertical, Calendar } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Category } from '@/types/task'

interface TodoItemProps {
  id: string
  text: string
  completed: boolean
  dueDate?: string | null
  category?: Category | null
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  index?: number
  isInitialRender?: boolean
}

export function TodoItem({ id, text, completed, dueDate, category, onToggle, onDelete, onEdit, index = 0, isInitialRender = false }: TodoItemProps) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const hasRenderedBefore = useRef(false)
  const [isToggling, setIsToggling] = useState(false)
  const previousCompleted = useRef(completed)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  // Determine if we should animate
  const shouldAnimate = isInitialRender || (!hasRenderedBefore.current && !hasAnimated)
  
  const style: React.CSSProperties = {
    transform: isToggling && completed ? 
      `${CSS.Transform.toString(transform)} translateX(20px)` : 
      CSS.Transform.toString(transform),
    transition: isToggling && completed ? 'transform 0.1s ease-out' : transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: shouldAnimate ? `${200 + (index * 50)}ms` : isToggling ? '0ms' : '0ms',
    zIndex: isToggling ? 50 : isDragging ? 40 : 'auto',
    position: isToggling ? 'relative' as const : undefined,
  }

  useEffect(() => {
    // Mark as rendered
    hasRenderedBefore.current = true
    
    // Mark as animated after the animation completes
    const timer = setTimeout(() => {
      setHasAnimated(true)
    }, 500 + (index * 50)) // Account for initial delay + animation delay
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => {
    // Detect completion state change
    if (previousCompleted.current !== completed && hasRenderedBefore.current) {
      setIsToggling(true)
      // Reset after animation completes
      const timer = setTimeout(() => {
        setIsToggling(false)
      }, 600) // Match slide left/right duration
      return () => clearTimeout(timer)
    }
    previousCompleted.current = completed
  }, [completed])
  
  const handleToggle = () => {
    // Don't trigger if already animating
    if (isToggling) return
    
    setIsToggling(true)
    // Delay the actual toggle to allow animation to start
    setTimeout(() => {
      onToggle(id)
    }, 300) // Halfway through the animation
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing ${
        shouldAnimate ? 'animate-slide-down' : ''
      } ${
        isToggling && completed ? 'animate-slide-left' : ''
      } ${
        isToggling && !completed && hasRenderedBefore.current ? 'animate-slide-right' : ''
      }`}>
      <div className="touch-none">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Checkbox
        checked={completed}
        onCheckedChange={handleToggle}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`${completed ? 'line-through text-muted-foreground' : ''}`}>
            {text}
          </span>
          {category && (
            <div 
              className="px-2 py-0.5 rounded-full text-xs text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </div>
          )}
        </div>
        {dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(dueDate), 'MMM d, yyyy')}
          </div>
        )}
      </div>
      {!completed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(id)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  )
}