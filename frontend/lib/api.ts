import { Task, CreateTaskDto, UpdateTaskDto, Category } from '@/types/task'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface User {
  _id: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const authApi = {
  signup: async (email: string, password: string): Promise<{ message: string; email: string }> => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to sign up')
    }
    return res.json()
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to login')
    }
    return res.json()
  },

  getProfile: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to get profile')
    return res.json()
  },

  deleteAccount: async (): Promise<void> => {
    const res = await fetch(`${API_URL}/auth/account`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to delete account')
  },
}

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch tasks')
    return res.json()
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create task')
    return res.json()
  },

  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update task')
    return res.json()
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to delete task')
  },

  reorder: async (taskId: string, newOrder: number, isCompleted: boolean): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ taskId, newOrder, isCompleted }),
    })
    if (!res.ok) throw new Error('Failed to reorder tasks')
    return res.json()
  },
}

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await fetch(`${API_URL}/categories`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
  },

  create: async (data: { name: string; color: string }): Promise<Category> => {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create category')
    return res.json()
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Category> => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update category')
    return res.json()
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to delete category')
  },
}