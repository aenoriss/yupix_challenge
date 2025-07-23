import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '@/lib/api'
import { CreateTaskDto, UpdateTaskDto } from '@/types/task'

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: taskApi.getAll,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTaskDto) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => 
      taskApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useReorderTasks() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, newOrder, isCompleted }: { taskId: string; newOrder: number; isCompleted: boolean }) => 
      taskApi.reorder(taskId, newOrder, isCompleted),
    onMutate: async ({ taskId, newOrder, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      const previousTasks = queryClient.getQueryData(['tasks'])
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old
        
        const taskIndex = old.findIndex((t: any) => t._id === taskId)
        if (taskIndex === -1) return old
        
        const task = old[taskIndex]
        if (task.completed !== isCompleted) return old // Don't reorder if status doesn't match
        
        // Filter tasks by completion status for reordering
        const samStatusTasks = old.filter((t: any) => t.completed === isCompleted)
        const otherTasks = old.filter((t: any) => t.completed !== isCompleted)
        
        // Find index within same status tasks
        const currentIndex = samStatusTasks.findIndex((t: any) => t._id === taskId)
        if (currentIndex === -1) return old
        
        // Reorder within same status
        const reordered = [...samStatusTasks]
        const [removed] = reordered.splice(currentIndex, 1)
        reordered.splice(newOrder, 0, removed)
        
        // Update order fields based on completion status
        const orderField = isCompleted ? 'completedOrder' : 'pendingOrder'
        const updatedSameStatus = reordered.map((task: any, index: number) => ({
          ...task,
          [orderField]: index
        }))
        
        // Combine back with other status tasks
        return isCompleted 
          ? [...otherTasks, ...updatedSameStatus]
          : [...updatedSameStatus, ...otherTasks]
      })
      
      return { previousTasks }
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}