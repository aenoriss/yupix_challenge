'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/useCategories'
import { Task } from '@/types/task'
import { cn } from '@/lib/utils'

interface CategoriesPanelProps {
  tasks: Task[]
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
}

export function CategoriesPanel({ tasks, selectedCategory, onCategorySelect }: CategoriesPanelProps) {
  const { data: categories = [] } = useCategories()
  
  const getCategoryTaskCount = (categoryId: string | null) => {
    return tasks.filter(task => {
      if (categoryId === null) {
        return !task.categoryId
      }
      return task.categoryId?._id === categoryId
    }).length
  }
  
  const totalTasks = tasks.length
  const uncategorizedCount = getCategoryTaskCount(null)
  
  return (
    <Card className="bg-background/70 backdrop-blur-sm h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <button
          onClick={() => onCategorySelect('all')}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
            selectedCategory === 'all' 
              ? "bg-primary/10 hover:bg-primary/15" 
              : "hover:bg-muted"
          )}
        >
          <span className="font-medium">All Tasks</span>
          <Badge variant="secondary">{totalTasks}</Badge>
        </button>
        
        {uncategorizedCount > 0 && (
          <button
            onClick={() => onCategorySelect('uncategorized')}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
              selectedCategory === 'uncategorized' 
                ? "bg-primary/10 hover:bg-primary/15" 
                : "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-muted-foreground" />
              <span>Uncategorized</span>
            </div>
            <Badge variant="secondary">{uncategorizedCount}</Badge>
          </button>
        )}
        
        {categories.map((category) => {
          const count = getCategoryTaskCount(category._id)
          return (
            <button
              key={category._id}
              onClick={() => onCategorySelect(category._id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                selectedCategory === category._id 
                  ? "bg-primary/10 hover:bg-primary/15" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}