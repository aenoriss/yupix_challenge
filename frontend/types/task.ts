export interface Category {
  _id: string
  name: string
  color: string
}

export interface Task {
  _id: string
  title: string
  completed: boolean
  pendingOrder?: number
  completedOrder?: number
  dueDate?: string | null
  categoryId?: Category | null
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface CreateTaskDto {
  title: string
  dueDate?: string | null
  categoryId?: string | null
}

export interface UpdateTaskDto {
  title?: string
  completed?: boolean
  dueDate?: string | null
  categoryId?: string | null
}