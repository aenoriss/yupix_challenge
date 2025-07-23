'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { UnicornBackground } from '@/components/UnicornBackground'
import { RotatingText } from '@/components/RotatingText'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [displayText, setDisplayText] = useState('')
  const fullText = "Hi, I'm Kai"
  
  
  useEffect(() => {
    let index = 0
    const typewriterInterval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(typewriterInterval)
      }
    }, 200)
    
    return () => clearInterval(typewriterInterval)
  }, [])

  return (
    <div className="min-h-screen relative flex flex-col">
      <UnicornBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <section className="container mx-auto px-4 py-16 md:py-24 flex-1">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <p className="text-2xl md:text-3xl text-white font-light h-9">
                {displayText}
                <span className="animate-pulse">|</span>
              </p>
              <div className="flex justify-center">
                <div 
                  data-us-project="G3dVbSWEBmmIca20PstX" 
                  style={{ width: '200px', height: '200px' }}
                  className="rounded-full overflow-hidden shadow-2xl"
                />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl text-center space-y-2">
              <div className="h-20 flex items-center justify-center">
                <RotatingText words={['Your everpresent', 'Your smart', 'Your proactive', 'Your helpful', 'Your reliable']} />
              </div>
              <div className="text-primary">productivity buddy</div>
            </h1>
            <div className="flex gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => router.push('/signup')}
                className="text-base px-6"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push('/login')}
                className="text-base px-6"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  )
}
