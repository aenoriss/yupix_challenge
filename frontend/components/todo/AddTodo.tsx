'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Plus, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useCategories } from '@/hooks/useCategories'
import { CreateTaskDto } from '@/types/task'

interface AddTodoProps {
  onAdd: (task: CreateTaskDto) => void
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const [text, setText] = useState('')
  const [date, setDate] = useState<Date>()
  const [categoryId, setCategoryId] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const { data: categories = [] } = useCategories()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      let dueDateString = null
      if (date) {
        const adjustedDate = new Date(date)
        adjustedDate.setHours(12, 0, 0, 0)
        dueDateString = adjustedDate.toISOString()
      }
      
      onAdd({
        title: text.trim(),
        dueDate: dueDateString,
        categoryId: categoryId === 'none' || !categoryId ? null : categoryId
      })
      setText('')
      setDate(undefined)
      setCategoryId('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="w-full"
      />
      
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex gap-2 flex-1">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Due date'}
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
          
          {categories.length > 0 && (
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
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
          )}
        </div>
        
        <Button type="submit" disabled={!text.trim()} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </form>
  )
}