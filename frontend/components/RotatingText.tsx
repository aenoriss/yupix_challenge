'use client'

import { useEffect, useState } from 'react'

interface RotatingTextProps {
  words: string[]
  interval?: number
}

export function RotatingText({ words, interval = 3500 }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span className="relative inline-block w-full" style={{ height: '1.4em' }}>
      {words.map((word, index) => (
        <span
          key={word}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out ${
            index === currentIndex
              ? 'opacity-100 transform translate-y-0'
              : index === (currentIndex - 1 + words.length) % words.length
              ? 'opacity-0 transform -translate-y-8'
              : 'opacity-0 transform translate-y-8'
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  )
}