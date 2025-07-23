'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Save } from 'lucide-react'
import { format } from 'date-fns'
import { useCategories } from '@/hooks/useCategories'
import { Task } from '@/types/task'

interface EditTaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: { title: string; dueDate: string | null; categoryId: string | null }) => void
}

export function EditTaskModal({ task, open, onOpenChange, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<Date>()
  const [categoryId, setCategoryId] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const { data: categories = [] } = useCategories()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setCategoryId(task.categoryId?._id || '')
    }
  }, [task])

  const handleSave = () => {
    if (task && title.trim()) {
      let dueDateString = null
      if (date) {
        const adjustedDate = new Date(date)
        adjustedDate.setHours(12, 0, 0, 0)
        dueDateString = adjustedDate.toISOString()
      }
      
      onSave(task._id, {
        title: title.trim(),
        dueDate: dueDateString,
        categoryId: categoryId === 'none' || !categoryId ? null : categoryId
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Name</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate)
                    setShowDatePicker(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {date && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDate(undefined)}
                className="w-full"
              >
                Clear date
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}