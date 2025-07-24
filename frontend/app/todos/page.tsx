'use client'

import { useState } from 'react'
import { TodoInterface } from '@/components/todo/TodoInterface'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { UnicornBackground } from '@/components/UnicornBackground'

export default function TodosPage() {
  const [todoMenuItems, setTodoMenuItems] = useState<React.ReactNode>(null)
  
  return (
    <div className="min-h-screen relative flex flex-col">
      <UnicornBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar todoMenuItems={todoMenuItems} />
        <div className="flex-1 lg:container lg:mx-auto lg:py-8">
          <TodoInterface onMenuItemsReady={setTodoMenuItems} />
        </div>
        <Footer />
      </div>
    </div>
  )
}