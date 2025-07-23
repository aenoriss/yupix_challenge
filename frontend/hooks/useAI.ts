import { useState } from 'react'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askKai = async (question: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      return data.response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const processVoice = async (audioBlob: Blob) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const reader = new FileReader()
      
      const audioData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          } else {
            reject('Failed to read audio')
          }
        }
        reader.readAsDataURL(audioBlob)
      })

      const response = await fetch('http://localhost:5000/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ audioData })
      })

      if (!response.ok) {
        throw new Error('Failed to process voice')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    askKai,
    processVoice,
    loading,
    error
  }
}