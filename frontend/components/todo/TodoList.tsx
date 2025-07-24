'use client'

import { useState, useEffect } from 'react'
import { TodoItem } from './TodoItem'
import { Task } from '@/types/task'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface TodoListProps {
  todos: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onReorder: (taskId: string, newOrder: number, isCompleted: boolean) => void
}

export function TodoList({ todos = [], onToggle, onDelete, onEdit, onReorder }: TodoListProps) {
  const [items, setItems] = useState(todos)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isInitialRender, setIsInitialRender] = useState(true)

  useEffect(() => {
    setItems(todos)
  }, [todos])
  
  useEffect(() => {
    // Mark initial render as complete after a short delay
    const timer = setTimeout(() => {
      setIsInitialRender(false)
    }, 1000) // Keep true for 1 second to allow all animations to play
    return () => clearTimeout(timer)
  }, [])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && over) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id)
        const newIndex = items.findIndex((item) => item._id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })

      const newIndex = items.findIndex((item) => item._id === over.id)
      const movedTask = items.find((item) => item._id === active.id)
      if (movedTask) {
        onReorder(active.id as string, newIndex, movedTask.completed)
      }
    }
    
    setActiveId(null)
  }
  if (todos.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <img 
          src="/kai.png"
          alt="Kai"
          className="w-24 h-24 mx-auto rounded-full object-cover opacity-50"
        />
        <p className="text-muted-foreground">
          No todos yet. Add one above!
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(t => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((todo, index) => (
            <TodoItem
              key={todo._id}
              id={todo._id}
              text={todo.title}
              completed={todo.completed}
              dueDate={todo.dueDate}
              category={todo.categoryId}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              index={index}
              isInitialRender={isInitialRender}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}