'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AddTodo } from './AddTodo'
import { TodoList } from './TodoList'
import { EditTaskModal } from './EditTaskModal'
import { DeleteTaskModal } from '@/components/modals/DeleteTaskModal'
import { TaskCalendar } from './TaskCalendar'
import { CategoryManager } from '@/components/CategoryManager'
import { CategoriesPanel } from './CategoriesPanel'
import { AIPanel } from '@/components/AIPanel'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, X, ChevronDown, ChevronUp, Plus, Layers, CalendarDays, Menu } from 'lucide-react'
import { format } from 'date-fns'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useReorderTasks } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import { CreateTaskDto, Task } from '@/types/task'

interface TodoInterfaceProps {
  onMenuItemsReady?: (menuItems: React.ReactNode) => void
}

export function TodoInterface({ onMenuItemsReady }: TodoInterfaceProps = {}) {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: categories = [] } = useCategories()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const reorderTasks = useReorderTasks()
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | undefined>()
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [completionFilter, setCompletionFilter] = useState<'pending' | 'completed'>('pending')
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null)

  const addTodo = (task: CreateTaskDto) => {
    createTask.mutate(task)
  }

  const toggleTodo = (id: string) => {
    const task = tasks.find(t => t._id === id)
    if (task) {
      updateTask.mutate({ id, data: { completed: !task.completed } })
    }
  }

  const deleteTodo = (id: string) => {
    const task = tasks.find(t => t._id === id)
    if (task) {
      setTaskToDelete({ id, title: task.title })
    }
  }
  
  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete.id)
      setTaskToDelete(null)
    }
  }

  const editTodo = (id: string) => {
    const task = tasks.find(t => t._id === id)
    if (task) {
      setEditingTask(task)
    }
  }

  const saveEditedTodo = (id: string, updates: { title: string; dueDate: string | null; categoryId: string | null }) => {
    updateTask.mutate({ id, data: updates })
  }

  const reorderTodo = (taskId: string, newOrder: number, isCompleted: boolean) => {
    reorderTasks.mutate({ taskId, newOrder, isCompleted })
  }

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]
    
    filtered = filtered.filter(task => 
      completionFilter === 'completed' ? task.completed : !task.completed
    )
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => 
        categoryFilter === 'uncategorized' 
          ? !task.categoryId 
          : task.categoryId?._id === categoryFilter
      )
    }
    
    if (dateFilter !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      
      filtered = filtered.filter(task => {
        if (!task.dueDate) return dateFilter === 'no-date'
        
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        
        switch (dateFilter) {
          case 'overdue':
            return dueDate < today
          case 'today':
            return dueDate.getTime() === today.getTime()
          case 'this-week':
            return dueDate >= today && dueDate < weekFromNow
          case 'no-date':
            return false
          case 'selected':
            if (!selectedDateFilter) return true
            const selectedDay = new Date(selectedDateFilter)
            selectedDay.setHours(0, 0, 0, 0)
            return dueDate.getTime() === selectedDay.getTime()
          default:
            return true
        }
      })
    }
    
    // Sort by pendingOrder or completedOrder based on completion status
    filtered.sort((a, b) => {
      if (a.completed && b.completed) {
        return (a.completedOrder || 0) - (b.completedOrder || 0)
      } else if (!a.completed && !b.completed) {
        return (a.pendingOrder || 0) - (b.pendingOrder || 0)
      }
      return 0
    })
    
    return filtered
  }, [tasks, categoryFilter, dateFilter, completionFilter, selectedDateFilter])

  const activeFilters = categoryFilter !== 'all' || dateFilter !== 'all'

  useEffect(() => {
    if (onMenuItemsReady) {
      const menuItems = null
      onMenuItemsReady(menuItems)
    }
  }, [onMenuItemsReady])

  return (
    <div className="w-full lg:max-w-7xl lg:mx-auto">
      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={saveEditedTodo}
      />
      
      <DeleteTaskModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title || ''}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-[250px,1fr,480px] gap-0 lg:gap-6">
        <div className="order-1 lg:order-1 hidden lg:block space-y-6">
          <AIPanel />
          <CategoriesPanel 
            tasks={tasks} 
            selectedCategory={categoryFilter}
            onCategorySelect={setCategoryFilter}
          />
        </div>
        <Card className="order-3 lg:order-2 bg-background/70 backdrop-blur-sm rounded-none lg:rounded-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Tasks</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{filteredTasks.length} of {tasks.length} tasks</span>
                  {activeFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryFilter('all')
                        setDateFilter('all')
                        setSelectedDateFilter(undefined)
                      }}
                      className="h-7 px-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="date-filter" className="text-xs mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </Label>
                  <div className="flex gap-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger id="date-filter" className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="no-date">No Due Date</SelectItem>
                        {dateFilter === 'selected' && selectedDateFilter && (
                          <SelectItem value="selected">
                            {format(selectedDateFilter, 'MMM d, yyyy')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="lg:hidden">
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-9 w-9"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <TaskCalendar 
                            tasks={tasks} 
                            onDateSelect={(date) => {
                              if (date) {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const selectedDay = new Date(date)
                                selectedDay.setHours(0, 0, 0, 0)
                                
                                if (selectedDay.getTime() === today.getTime()) {
                                  setDateFilter('today')
                                } else {
                                  setDateFilter('selected')
                                  setSelectedDateFilter(date)
                                }
                                setCalendarOpen(false)
                              } else {
                                setDateFilter('all')
                                setSelectedDateFilter(undefined)
                                setCalendarOpen(false)
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <div className="lg:hidden">
                  <Label htmlFor="category-filter" className="text-xs mb-1 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Category
                  </Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category-filter" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category._id} value={category._id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <Tabs value={completionFilter} onValueChange={(value) => setCompletionFilter(value as 'pending' | 'completed')} className="w-full">
            <TabsList className="w-full rounded-none bg-transparent border-b border-border/50 grid grid-cols-2 h-12 p-0">
              <TabsTrigger 
                value="pending" 
                className="rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">Pending</span>
                  <span className="text-xs opacity-60">({tasks.filter(t => !t.completed).length})</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">Completed</span>
                  <span className="text-xs opacity-60">({tasks.filter(t => t.completed).length})</span>
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={completionFilter} className="p-6 mt-0">
              <div className="lg:hidden mb-4">
              <Sheet open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                <SheetTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Create New Task</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Add a task with optional due date and category
                      </p>
                      <CategoryManager />
                    </div>
                    <AddTodo onAdd={(task) => {
                      addTodo(task)
                      setCreateTaskOpen(false)
                    }} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading tasks...
                </div>
              ) : (
                <TodoList
                  todos={filteredTasks}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                  onReorder={reorderTodo}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="order-2 lg:order-3 space-y-6 hidden lg:block">
          <Card className="bg-background/70 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Create New Task</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a task with optional due date and category
                  </p>
                </div>
                <CategoryManager />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AddTodo onAdd={addTodo} />
            </CardContent>
          </Card>
          
          <TaskCalendar 
            tasks={tasks} 
            onDateSelect={(date) => {
              if (date) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const selectedDay = new Date(date)
                selectedDay.setHours(0, 0, 0, 0)
                
                if (selectedDay.getTime() === today.getTime()) {
                  setDateFilter('today')
                } else {
                  setDateFilter('selected')
                  setSelectedDateFilter(date)
                }
              } else {
                setDateFilter('all')
                setSelectedDateFilter(undefined)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}