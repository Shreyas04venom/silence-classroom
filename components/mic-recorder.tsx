"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface MicRecorderProps {
  onTranscript: (text: string) => void
  onRecordingChange?: (isRecording: boolean) => void
  className?: string
  size?: "default" | "lg"
}

export function MicRecorder({ onTranscript, onRecordingChange, className, size = "default" }: MicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
        onRecordingChange?.(false)
      }

      recognition.onend = () => {
        if (isRecording) {
          // Auto-restart if still recording
          try {
            recognition.start()
          } catch {
            setIsRecording(false)
            onRecordingChange?.(false)
          }
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording, onRecordingChange])

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      onRecordingChange?.(false)
      if (transcript) {
        onTranscript(transcript)
        setTranscript("")
      }
    } else {
      setTranscript("")
      recognitionRef.current.start()
      setIsRecording(true)
      onRecordingChange?.(true)
    }
  }, [isRecording, transcript, onTranscript, onRecordingChange])

  if (!isSupported) {
    return (
      <Button variant="outline" disabled className={className}>
        <MicOff className="h-5 w-5 mr-2" />
        Speech not supported
      </Button>
    )
  }

  const buttonSize = size === "lg" ? "h-14 w-14" : "h-10 w-10"
  const iconSize = size === "lg" ? "h-7 w-7" : "h-5 w-5"

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={toggleRecording}
      className={cn(buttonSize, "rounded-full relative", className)}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isRecording ? (
        <>
          <Mic className={cn(iconSize, "animate-pulse")} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
        </>
      ) : (
        <Mic className={iconSize} />
      )}
    </Button>
  )
}
