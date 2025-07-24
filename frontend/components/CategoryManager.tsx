'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Trash2, Edit2, Check, X, Plus, Palette } from 'lucide-react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'

const colors = [
  '#DC2626', '#EA580C', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#64748B', '#71717A', '#171717'
]

export function CategoryManager() {
  const { data: categories = [], isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  
  const [open, setOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategoryName.trim()) {
      createCategory.mutate(
        {
          name: newCategoryName.trim(),
          color: newCategoryColor
        },
        {
          onSuccess: () => {
            setNewCategoryName('')
            setNewCategoryColor('#3B82F6')
          }
        }
      )
    }
  }

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
  }

  const handleUpdate = () => {
    if (editingId && editName.trim()) {
      updateCategory.mutate({
        id: editingId,
        data: {
          name: editName.trim(),
          color: editColor
        }
      })
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            Organize your tasks with custom categories and colors
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">New Category</Label>
              <div className="flex gap-2">
                <Input
                  id="category-name"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  size="sm"
                  disabled={!newCategoryName.trim() || createCategory.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Choose Color
              </Label>
              <div className="grid grid-cols-10 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-8 w-8 rounded-md ring-2 ring-offset-2 transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: newCategoryColor === color ? `0 0 0 2px ${color}` : undefined
                    }}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
          </form>

          <div className="space-y-2">
            <Label>Existing Categories</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-2">Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No categories yet</p>
                  <p className="text-xs mt-1">Create your first category above</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div 
                    key={category._id} 
                    className="group relative rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                  >
                    {editingId === category._id ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-md flex-shrink-0"
                          style={{ backgroundColor: editColor }}
                        />
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleUpdate}
                            disabled={!editName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-8 w-8 rounded-md flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(category._id, category.name, category.color)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDelete(category._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {editingId === category._id && (
                      <div className="mt-3 grid grid-cols-10 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="h-6 w-6 rounded ring-2 ring-offset-1 transition-all hover:scale-110"
                            style={{ 
                              backgroundColor: color,
                              boxShadow: editColor === color ? `0 0 0 2px ${color}` : undefined
                            }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}