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

  const connect = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No auth token found')
      return
    }

    const ws = new WebSocket('ws://localhost:5000/ws/realtime')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data)
        
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
            console.log('Received audio delta, length:', message.data.delta.length)
            audioChunksRef.current.push(message.data.delta)
          }
          break
          
        case 'response.audio.done':
          console.log('Audio done, chunks collected:', audioChunksRef.current.length, 'muted:', isMuted)
          // Use ref to get current mute state
          const currentIsMuted = isMutedRef.current
          console.log('Current mute state from ref:', currentIsMuted)
          if (!currentIsMuted && audioChunksRef.current.length > 0) {
            playAudio()
          }
          audioChunksRef.current = []
          break
          
        case 'response.done':
          setIsProcessing(false)
          break
          
        case 'user_transcript':
          if (message.data?.transcript) {
            // Accumulate transcript
            setTranscript(prev => {
              // If it's a completely new transcript (not just adding to existing)
              if (message.data.transcript.length > prev.length + 10) {
                return message.data.transcript
              }
              // Otherwise append
              return prev + message.data.transcript
            })
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
      setIsProcessing(true)
      audioChunksRef.current = []
      setHasRecordedAudio(false)
      
      // Tell backend to create response from the audio we sent
      wsRef.current.send(JSON.stringify({ type: 'create_response' }))
    }
  }, [connected, isProcessing, hasRecordedAudio])
  
  const playAudio = useCallback(async () => {
    console.log('playAudio called, chunks:', audioChunksRef.current.length)
    
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
      // Combine all audio chunks
      const combinedBase64 = audioChunksRef.current.join('')
      console.log('Combined base64 length:', combinedBase64.length)
      console.log('First chunk preview:', audioChunksRef.current[0]?.substring(0, 50))
      
      const binaryString = atob(combinedBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      console.log('Binary data length:', bytes.length)
      console.log('First few bytes:', Array.from(bytes.slice(0, 10)))
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(pcm16.length)
      
      let maxVal = 0
      let minVal = 0
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0
        maxVal = Math.max(maxVal, float32[i])
        minVal = Math.min(minVal, float32[i])
      }
      
      console.log('Audio data range:', minVal, 'to', maxVal)
      console.log('Creating audio buffer, samples:', float32.length, 'duration:', float32.length / 24000, 'seconds')
      
      // Create audio buffer and play
      const audioBuffer = audioPlayerRef.current.createBuffer(1, float32.length, 24000)
      audioBuffer.copyToChannel(float32, 0)
      
      const source = audioPlayerRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioPlayerRef.current.destination)
      
      source.onended = () => {
        console.log('Audio playback ended')
      }
      
      source.start()
      console.log('Audio started playing at:', new Date().toISOString())
    } catch (error) {
      console.error('Error playing audio:', error)
      console.error('Error stack:', error.stack)
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
      setTranscript('') // Clear previous transcript
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
    audioLevel
  }
}