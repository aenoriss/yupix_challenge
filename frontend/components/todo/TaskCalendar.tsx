'use client'

import { useState, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/task'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

interface TaskCalendarProps {
  tasks: Task[]
  onDateSelect?: (date: Date | undefined) => void
}

export function TaskCalendar({ tasks, onDateSelect }: TaskCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (onDateSelect) {
      onDateSelect(date)
    }
  }
  
  const tasksByDate = useMemo(() => {
    const dateMap = new Map<string, Task[]>()
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const year = taskDate.getFullYear()
        const month = String(taskDate.getMonth() + 1).padStart(2, '0')
        const day = String(taskDate.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`
        
        const existing = dateMap.get(dateKey) || []
        dateMap.set(dateKey, [...existing, task])
      }
    })
    
    return dateMap
  }, [tasks])
  
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return tasksByDate.get(dateKey) || []
  }, [selectedDate, tasksByDate])
  
  const modifiers = useMemo(() => {
    const modifierMap: { [key: string]: Date[] } = {
      hasTask: [],
      hasMultipleTasks: [],
      hasOverdue: []
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    tasksByDate.forEach((tasks, dateKey) => {
      const [year, month, day] = dateKey.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      
      if (tasks.length > 0) {
        modifierMap.hasTask.push(date)
      }
      
      if (tasks.length > 2) {
        modifierMap.hasMultipleTasks.push(date)
      }
      
      if (date < today && tasks.some(task => !task.completed)) {
        modifierMap.hasOverdue.push(date)
      }
    })
    
    return modifierMap
  }, [tasksByDate])
  
  const modifiersClassNames = {
    hasTask: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
    hasMultipleTasks: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full',
    hasOverdue: 'relative after:bg-destructive'
  }

  return (
    <Card className="h-fit bg-background/70 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Task Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md"
        />
        
        {selectedDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
              <Badge variant="secondary">
                {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {selectedDateTasks.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedDateTasks.map((task) => (
                  <div 
                    key={task._id}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted"
                  >
                    <div 
                      className={`w-2 h-2 rounded-full ${task.completed ? 'bg-muted-foreground' : 'bg-primary'}`}
                    />
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                    {task.categoryId && (
                      <div 
                        className="w-3 h-3 rounded-full ml-auto"
                        style={{ backgroundColor: task.categoryId.color }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {selectedDateTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks scheduled for this date
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Has tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            <span>Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}