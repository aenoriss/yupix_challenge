'use client'

import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  unicornReady: boolean
  setLoading: (loading: boolean) => void
  setUnicornReady: (ready: boolean) => void
  reset: () => void
}

export const useLoading = create<LoadingState>((set) => ({
  isLoading: true,
  unicornReady: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setUnicornReady: (ready) => set({ unicornReady: ready }),
  reset: () => set({ isLoading: true, unicornReady: false })
}))