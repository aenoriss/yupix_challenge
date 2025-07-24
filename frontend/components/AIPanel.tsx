'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { AIModal } from './AIModal'
import { KaiAvatar } from './KaiAvatar'

export function AIPanel() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Card className="h-fit bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
              <KaiAvatar 
                size="md"
                onClick={() => setModalOpen(true)}
                className="relative z-10"
              />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Meet Kai
              </h3>
              <p className="text-sm text-muted-foreground">
                Your AI task assistant
              </p>
            </div>
            
            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-3 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              Ask Kai Anything!
            </button>
          </div>
        </CardContent>
      </Card>
      
      <AIModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
      />
    </>
  )
}