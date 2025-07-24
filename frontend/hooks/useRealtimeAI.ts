import { useState, useRef, useCallback, useEffect } from 'react'

interface RealtimeMessage {
  type: string
  data?: any
  text?: string
  audio?: string
  message?: string
}

export function useRealtimeAI() {
  const [connected, setConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioChunksRef = useRef<string[]>([])
  const audioPlayerRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const isRecordingRef = useRef(false)
  const isMutedRef = useRef(false)

  const initAudioContext = useCallback(async () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioContext()
    }
    
    if (audioPlayerRef.current.state === 'suspended') {
      await audioPlayerRef.current.resume()
    }
    
    console.log('Audio context initialized:', audioPlayerRef.current.state)
  }, [])

  const connect = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No auth token found')
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    // Remove /api from URL for WebSocket connection since WS endpoint is at /ws/realtime not /api/ws/realtime
    const baseUrl = apiUrl.replace(/\/api$/, '')
    const wsUrl = baseUrl.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsUrl}/ws/realtime`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data)
        
        // Log all message types
        console.log('WebSocket message type:', message.type)
        
        switch (message.type) {
        case 'auth_success':
          setConnected(true)
          break
          
        case 'conversation.updated':
          if (message.data?.item?.content) {
            const content = message.data.item.content
            if (content[0]?.transcript) {
              setTranscript(content[0].transcript)
            }
          }
          break
          
        case 'response.audio_transcript.delta':
          if (message.data?.delta) {
            setResponse(prev => prev + message.data.delta)
          }
          break
          
        case 'response.complete':
          if (message.data?.text) {
            setResponse(message.data.text)
          }
          break
          
        case 'response.audio.delta':
          if (message.data?.delta) {
            // Convert object with numeric keys to array
            let audioData = message.data.delta
            
            if (typeof audioData === 'object' && !Array.isArray(audioData)) {
              // Convert object {0: val1, 1: val2, ...} to array [val1, val2, ...]
              const keys = Object.keys(audioData).map(k => parseInt(k)).sort((a, b) => a - b)
              const maxKey = keys[keys.length - 1]
              const array = new Array(maxKey + 1)
              for (let i = 0; i <= maxKey; i++) {
                array[i] = audioData[i] || 0
              }
              audioData = array
              console.log('Converted object to array, length:', array.length)
            }
            
            audioChunksRef.current.push(audioData)
            console.log('Total chunks so far:', audioChunksRef.current.length)
          }
          break
          
        case 'response.audio.done':
          console.log('=== AUDIO DONE ===')
          console.log('Chunks collected:', audioChunksRef.current.length)
          console.log('Is muted (state):', isMuted)
          console.log('Is muted (ref):', isMutedRef.current)
          
          if (audioChunksRef.current.length > 0) {
            // Calculate total samples
            let totalSamples = 0
            audioChunksRef.current.forEach(chunk => {
              if (Array.isArray(chunk)) {
                totalSamples += chunk.length
              }
            })
            console.log('Total audio samples:', totalSamples)
            console.log('Duration (seconds):', totalSamples / 24000)
          }
          
          if (!isMutedRef.current && audioChunksRef.current.length > 0) {
            console.log('>>> PLAYING AUDIO <<<')
            playAudio().then(() => {
              console.log('PlayAudio completed')
            }).catch(error => {
              console.error('Error in playAudio:', error)
            })
          } else if (audioChunksRef.current.length === 0) {
            console.log('No audio chunks to play')
          } else {
            console.log('Audio is muted, clearing chunks')
            audioChunksRef.current = []
          }
          break
          
        case 'response.done':
          setIsProcessing(false)
          
          // Play audio if we have chunks
          console.log('=== RESPONSE DONE ===')
          console.log('Chunks collected:', audioChunksRef.current.length)
          console.log('Is muted (ref):', isMutedRef.current)
          
          if (audioChunksRef.current.length > 0) {
            // Calculate total samples
            let totalSamples = 0
            audioChunksRef.current.forEach(chunk => {
              if (Array.isArray(chunk)) {
                totalSamples += chunk.length
              }
            })
            console.log('Total audio samples:', totalSamples)
            console.log('Duration (seconds):', totalSamples / 24000)
            
            if (!isMutedRef.current) {
              console.log('>>> PLAYING AUDIO <<<')
              playAudio().then(() => {
                console.log('PlayAudio completed')
              }).catch(error => {
                console.error('Error in playAudio:', error)
              })
            } else {
              console.log('Audio is muted, clearing chunks')
              audioChunksRef.current = []
            }
          }
          break
          
        case 'user_transcript':
          if (message.data?.transcript) {
            console.log('Received user transcript:', message.data.transcript)
            // Set transcript directly
            setTranscript(message.data.transcript)
          }
          break
          
        case 'speech_started':
          setIsProcessing(true)
          break
          
        case 'speech_stopped':
          break
          
        case 'error':
          console.error('WebSocket error:', message.message)
          setConnected(false)
          break
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = () => {
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
    }
  }, [isMuted])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && connected && !isProcessing) {
      // Clear previous state
      setResponse('')
      setTranscript('')
      setIsProcessing(true)
      audioChunksRef.current = []
      setHasRecordedAudio(false)
      
      console.log('Sending message:', text)
      wsRef.current.send(JSON.stringify({ 
        type: 'text_message', 
        text 
      }))
    }
  }, [connected, isProcessing])
  
  const sendRecordedAudio = useCallback(() => {
    if (wsRef.current && connected && !isProcessing && hasRecordedAudio) {
      // Clear previous state
      setResponse('')
      setTranscript('') // Clear transcript after sending
      setIsProcessing(true)
      audioChunksRef.current = []
      setHasRecordedAudio(false)
      
      // Tell backend to create response from the audio we sent
      wsRef.current.send(JSON.stringify({ type: 'create_response' }))
    }
  }, [connected, isProcessing, hasRecordedAudio])
  
  const playAudio = useCallback(async () => {
    console.log('playAudio called, chunks:', audioChunksRef.current.length)
    console.log('Current mute state:', isMutedRef.current)
    
    if (isMutedRef.current) {
      console.log('Audio is muted, skipping playback')
      return
    }
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioContext()
    }
    
    // Resume audio context if it's suspended (browser security)
    if (audioPlayerRef.current.state === 'suspended') {
      console.log('Audio context suspended, resuming...')
      await audioPlayerRef.current.resume()
    }
    
    console.log('AudioContext state after resume:', audioPlayerRef.current.state)
    console.log('AudioContext sample rate:', audioPlayerRef.current.sampleRate)
    
    try {
      // Check what format we have
      const firstChunk = audioChunksRef.current[0]
      let float32: Float32Array
      
      if (Array.isArray(firstChunk) || (typeof firstChunk === 'object' && firstChunk !== null)) {
        // Chunks are arrays of PCM16 samples (or objects converted to arrays)
        console.log('Processing PCM16 arrays, chunks:', audioChunksRef.current.length)
        
        // Calculate total length
        let totalLength = 0
        audioChunksRef.current.forEach(chunk => {
          if (Array.isArray(chunk)) {
            totalLength += chunk.length
          }
        })
        
        console.log('Total PCM16 samples:', totalLength)
        
        // Combine all chunks into one array
        const combined = new Int16Array(totalLength)
        let offset = 0
        audioChunksRef.current.forEach(chunk => {
          if (Array.isArray(chunk)) {
            combined.set(chunk, offset)
            offset += chunk.length
          }
        })
        
        // Convert to Float32
        float32 = new Float32Array(combined.length)
        for (let i = 0; i < combined.length; i++) {
          float32[i] = combined[i] / 32768.0
        }
        
        console.log('Combined samples:', float32.length)
      } else if (typeof firstChunk === 'string') {
        // Chunks are base64 strings
        console.log('Processing base64 strings')
        
        const combinedBase64 = audioChunksRef.current.join('')
        const binaryString = atob(combinedBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        const dataView = new DataView(bytes.buffer)
        float32 = new Float32Array(bytes.length / 2)
        
        for (let i = 0; i < float32.length; i++) {
          const sample = dataView.getInt16(i * 2, true)
          float32[i] = sample / 32768.0
        }
      } else {
        console.error('Unknown chunk format:', typeof firstChunk)
        audioChunksRef.current = []
        return
      }
      
      // Check audio data
      let maxVal = 0
      let minVal = 0
      let hasNonZero = false
      
      for (let i = 0; i < float32.length; i++) {
        maxVal = Math.max(maxVal, float32[i])
        minVal = Math.min(minVal, float32[i])
        if (float32[i] !== 0) hasNonZero = true
      }
      
      console.log('Audio data range:', minVal, 'to', maxVal)
      console.log('Has non-zero samples:', hasNonZero)
      console.log('Creating audio buffer, samples:', float32.length, 'duration:', float32.length / 24000, 'seconds')
      
      if (!hasNonZero) {
        console.warn('Audio data is all zeros - no sound will be heard')
      }
      
      // Create audio buffer and play
      const audioBuffer = audioPlayerRef.current.createBuffer(1, float32.length, 24000)
      audioBuffer.copyToChannel(float32, 0)
      
      console.log('Audio buffer created:', {
        duration: audioBuffer.duration,
        length: audioBuffer.length,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      })
      
      const source = audioPlayerRef.current.createBufferSource()
      source.buffer = audioBuffer
      
      // Add gain node for volume control
      const gainNode = audioPlayerRef.current.createGain()
      gainNode.gain.value = 1.0
      
      source.connect(gainNode)
      gainNode.connect(audioPlayerRef.current.destination)
      
      source.onended = () => {
        console.log('Audio playback ended at:', new Date().toISOString())
      }
      
      console.log('Starting audio playback...')
      console.log('Buffer duration:', audioBuffer.duration, 'seconds')
      console.log('Context state:', audioPlayerRef.current.state)
      
      source.start(0)
      console.log('Audio started playing at:', new Date().toISOString())
      console.log('Destination max channel count:', audioPlayerRef.current.destination.maxChannelCount)
      
      // Clear chunks after successfully starting playback
      audioChunksRef.current = []
    } catch (error) {
      console.error('Error playing audio:', error)
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
      }
      // Clear chunks even on error to prevent accumulation
      audioChunksRef.current = []
    }
  }, [])
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMutedState = !prev
      isMutedRef.current = newMutedState
      console.log('Toggled mute state to:', newMutedState)
      return newMutedState
    })
  }, [])

  const testAudioPlayback = useCallback(async () => {
    console.log('Testing audio playback...')
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioContext()
    }
    
    if (audioPlayerRef.current.state === 'suspended') {
      await audioPlayerRef.current.resume()
    }
    
    try {
      const oscillator = audioPlayerRef.current.createOscillator()
      const gainNode = audioPlayerRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioPlayerRef.current.destination)
      
      oscillator.frequency.value = 440
      gainNode.gain.value = 0.3 // Increased volume
      
      oscillator.start()
      oscillator.stop(audioPlayerRef.current.currentTime + 0.5)
      
      console.log('Test tone played successfully')
      console.log('AudioContext state:', audioPlayerRef.current.state)
      console.log('AudioContext sampleRate:', audioPlayerRef.current.sampleRate)
      console.log('System volume check - can you hear the beep?')
    } catch (error) {
      console.error('Error playing test tone:', error)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })

      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1)
      
      // Create analyser for audio level detection
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      let chunkCount = 0
      processorRef.current.onaudioprocess = (e) => {
        if (!isRecordingRef.current || !wsRef.current || !connected) return

        const inputData = e.inputBuffer.getChannelData(0)
        const pcm16 = new Int16Array(inputData.length)
        
        // Calculate audio level
        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
          sum += Math.abs(inputData[i])
        }
        const level = sum / inputData.length
        setAudioLevel(Math.min(1, level * 10))

        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
        
        // Log every 10th chunk to avoid spam
        if (chunkCount % 10 === 0) {
          console.log('Sending audio chunk', chunkCount, 'base64 length:', base64.length)
        }
        chunkCount++
        
        wsRef.current.send(JSON.stringify({
          type: 'audio_chunk',
          audio: base64
        }))
      }

      source.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)
      
      setIsRecording(true)
      isRecordingRef.current = true
      // Don't clear transcript immediately - wait for new transcription
      setResponse('')
      setHasRecordedAudio(false)
      
      console.log('Recording started, isRecording:', true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [connected, isRecording])

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Don't trigger response here - wait for user to tap "Ask Kai"
    setIsRecording(false)
    isRecordingRef.current = false
    setHasRecordedAudio(true)
    setAudioLevel(0)
    
    console.log('Recording stopped')
  }, [])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connected,
    connect,
    disconnect,
    sendTextMessage,
    sendRecordedAudio,
    startRecording,
    stopRecording,
    isRecording,
    transcript,
    response,
    isProcessing,
    isMuted,
    toggleMute,
    hasRecordedAudio,
    audioLevel,
    testAudioPlayback,
    initAudioContext
  }
}