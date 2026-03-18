"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Check, Maximize2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lesson, MediaResource } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface StudentKioskDisplayProps {
  lesson: Lesson
  mediaResources: MediaResource[]
  studentId?: string
  isKiosk?: boolean
  onExit?: () => void
}

export function StudentKioskDisplay({
  lesson,
  mediaResources,
  studentId,
  isKiosk = false,
  onExit,
}: StudentKioskDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(isKiosk)
  const [showUnderstood, setShowUnderstood] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [startTime, setStartTime] = useState(0)

  // Initialize start time on client only
  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  const images = mediaResources.filter((m) => m.media_type === "image" || m.media_type === "gif")
  const videos = mediaResources.filter((m) => m.media_type === "video")
  const currentMedia = images[currentIndex]

  // Track progress
  const trackProgress = useCallback(
    async (action: "viewed" | "understood" | "replay") => {
      if (!studentId) return

      const supabase = createClient()
      const duration = Math.floor((Date.now() - startTime) / 1000)

      await supabase.from("student_progress").insert({
        student_id: studentId,
        lesson_id: lesson.id,
        action,
        duration_seconds: duration,
      })
    },
    [studentId, lesson.id, startTime],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          handleNext()
          break
        case "ArrowLeft":
          handlePrev()
          break
        case " ":
          e.preventDefault()
          setIsPlaying((prev) => !prev)
          break
        case "Escape":
          if (!isKiosk) {
            setIsFullscreen(false)
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, images.length, isKiosk])

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying, images.length])

  // Track view on mount
  useEffect(() => {
    trackProgress("viewed")
  }, [trackProgress])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleReplay = () => {
    setCurrentIndex(0)
    setIsPlaying(true)
    trackProgress("replay")
  }

  const handleUnderstood = async () => {
    setShowUnderstood(true)
    await trackProgress("understood")
    setTimeout(() => setShowUnderstood(false), 2000)
  }

  const toggleFullscreen = () => {
    if (!isKiosk) {
      setIsFullscreen((prev) => !prev)
    }
  }

  return (
    <div
      className={cn(
        "bg-background flex flex-col",
        isFullscreen ? "fixed inset-0 z-50" : "min-h-[600px] rounded-xl border",
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">{lesson.title}</h1>
          <p className="text-lg text-muted-foreground">{lesson.topic}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isKiosk && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <X className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </Button>
          )}
        </div>
      </header>

      {/* Summary */}
      <div className="bg-primary/5 p-6 border-b">
        <p className="text-xl md:text-2xl text-foreground text-center font-medium leading-relaxed">
          {lesson.summary || "No summary available"}
        </p>
        {lesson.keywords && lesson.keywords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {lesson.keywords.map((keyword, i) => (
              <span key={i} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-lg font-medium">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
        {/* Image Display */}
        {images.length > 0 && currentMedia && (
          <div className="relative w-full max-w-4xl aspect-video bg-muted rounded-xl overflow-hidden">
            <img
              src={currentMedia.url || "/placeholder.svg"}
              alt={currentMedia.title || `Visual ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Video Section */}
        {videos.length > 0 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-xl font-semibold mb-4 text-center">Educational Videos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.slice(0, 4).map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {video.meta?.youtubeId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.meta.youtubeId}`}
                        title={video.title || "Educational video"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={video.thumbnail_url || "/placeholder.svg?height=200&width=400&query=video thumbnail"}
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No content message */}
        {images.length === 0 && videos.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="text-2xl">No visual content available yet</p>
            <p className="text-lg mt-2">Ask your teacher to generate visuals for this lesson</p>
          </div>
        )}
      </main>

      {/* Control Bar */}
      <footer className="p-6 border-t bg-card">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Navigation */}
          <Button
            size="lg"
            variant="outline"
            onClick={handlePrev}
            disabled={images.length <= 1}
            className="h-16 w-16 rounded-full bg-transparent"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="h-16 w-16 rounded-full"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleNext}
            disabled={images.length <= 1}
            className="h-16 w-16 rounded-full bg-transparent"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleReplay}
            className="h-16 px-6 rounded-full bg-transparent"
            aria-label="Replay all"
          >
            <RotateCcw className="h-6 w-6 mr-2" />
            Replay
          </Button>

          {/* Understood Button */}
          <Button
            size="lg"
            onClick={handleUnderstood}
            className={cn(
              "h-20 px-12 rounded-full text-2xl font-bold transition-all",
              showUnderstood && "animate-pulse-success bg-success hover:bg-success",
            )}
            aria-label="Mark as understood"
          >
            <Check className="h-8 w-8 mr-3" />
            {showUnderstood ? "Great!" : "Understood"}
          </Button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Keyboard: <kbd className="px-2 py-1 bg-muted rounded">←</kbd> Previous
            <span className="mx-2">|</span>
            <kbd className="px-2 py-1 bg-muted rounded">→</kbd> Next
            <span className="mx-2">|</span>
            <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> Play/Pause
          </p>
        </div>
      </footer>

      {/* Understood overlay animation */}
      {showUnderstood && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-success/20 pointer-events-none z-50"
          aria-hidden="true"
        >
          <div className="text-success text-9xl animate-bounce">
            <Check className="h-48 w-48" />
          </div>
        </div>
      )}
    </div>
  )
}
