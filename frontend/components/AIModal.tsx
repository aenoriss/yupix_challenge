'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Mic, MicOff, Send, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react'
import { KaiAvatar } from './KaiAvatar'
import { useRealtimeAI } from '@/hooks/useRealtimeAI'
import { SoundWave } from './SoundWave'

interface AIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIModal({ open, onOpenChange }: AIModalProps) {
  const [question, setQuestion] = useState('')
  const [displayedResponse, setDisplayedResponse] = useState('')
  const responseRef = useRef<string>('')
  const typewriterRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
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
  } = useRealtimeAI()

  useEffect(() => {
    if (open && !connected) {
      connect()
    }
    return () => {
      if (!open && connected) {
        disconnect()
      }
    }
  }, [open, connected, connect, disconnect])
  
  useEffect(() => {
    if (open) {
      initAudioContext()
    }
  }, [open, initAudioContext])

  useEffect(() => {
    if (transcript) {
      setQuestion(transcript)
    }
  }, [transcript])
  
  useEffect(() => {
    // Update displayed response whenever response changes
    setDisplayedResponse(response)
    responseRef.current = response
  }, [response])

  const handleAsk = () => {
    if (!connected || isProcessing) return
    
    if (isRecording) {
      // Stop recording first
      stopRecording()
      // Then send immediately
      setTimeout(() => {
        sendRecordedAudio()
      }, 100)
      setDisplayedResponse('')
      setQuestion('')
    } else if (hasRecordedAudio) {
      // Send recorded audio
      setDisplayedResponse('')
      setQuestion('')
      sendRecordedAudio()
    } else if (question.trim()) {
      // Send text message
      setDisplayedResponse('')
      setQuestion('')
      sendTextMessage(question)
    }
  }

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background/98 to-background/95 backdrop-blur-md border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Kai Anything!
            </span>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={testAudioPlayback}
                className="h-8 px-2"
              >
                Test Audio
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="h-8 px-2"
              >
                {isMuted ? (
                  <><VolumeX className="h-4 w-4" /> <span className="text-xs ml-1">Muted</span></>
                ) : (
                  <><Volume2 className="h-4 w-4" /> <span className="text-xs ml-1">Sound On</span></>
                )}
              </Button>
              <span className="flex items-center gap-1 text-xs font-normal">
                {connected ? (
                  <><Wifi className="h-3 w-3 text-green-500" /> Connected</>                
                ) : (
                  <><WifiOff className="h-3 w-3 text-muted-foreground" /> Connecting...</>
                )}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
            <KaiAvatar size="lg" className="relative z-10" />
          </div>
          
          <div className="w-full min-h-[80px] p-4 rounded-lg bg-muted/50">
            {displayedResponse ? (
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 text-sm whitespace-pre-wrap">
                  {displayedResponse}
                  {isProcessing && displayedResponse === response && (
                    <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Kai is thinking...</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                Ask me anything about your tasks!
              </div>
            )}
          </div>
          
          <div className="w-full space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="What can I help you with today?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!connected || isProcessing || isRecording}
                className="flex-1 bg-background/50 border-primary/20 focus:border-primary/40"
                autoFocus
              />
              <Button
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                onClick={handleRecord}
                disabled={!connected || isProcessing}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            {(isRecording || hasRecordedAudio || transcript) && (
              <div className="text-sm text-muted-foreground text-center space-y-2">
                {isRecording && (
                  <div className="flex items-center justify-center">
                    <SoundWave isActive={isRecording} audioLevel={audioLevel} />
                  </div>
                )}
                <div>
                  {isRecording ? 'Recording... Speak now' : 'Recording ready - tap button below to send'}
                </div>
                {transcript && (
                  <div className="text-xs italic">
                    Heard: "{transcript}"
                  </div>
                )}
              </div>
            )}
            <Button 
              onClick={handleAsk}
              disabled={!connected || isProcessing || (!question.trim() && !hasRecordedAudio && !isRecording)}
              className="w-full bg-primary/90 hover:bg-primary"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {isProcessing ? 'Thinking...' : isRecording ? 'Send Audio' : hasRecordedAudio ? 'Send Recording' : 'Ask Kai'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}