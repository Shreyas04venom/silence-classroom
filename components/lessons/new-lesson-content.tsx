"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { MicRecorder } from "@/components/mic-recorder"
import type { Subject } from "@/lib/types"

interface NewLessonContentProps {
  subjects: Subject[]
}

export function NewLessonContent({ subjects }: NewLessonContentProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [lessonText, setLessonText] = useState("")
  const [autoSplitConcepts, setAutoSplitConcepts] = useState(true)

  const handleTranscript = (text: string) => {
    setLessonText((prev) => (prev ? prev + " " + text : text))
  }

  const handleGenerate = async () => {
    if (!title || !subjectId || !lessonText) return

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress stages
      setProgressMessage("Analyzing lesson content...")
      setProgress(20)

      const response = await fetch("/api/lessons/new/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          subjectId,
          lessonText,
          autoSplitConcepts,
        }),
      })

      setProgressMessage("Extracting keywords...")
      setProgress(40)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate")
      }

      setProgressMessage("Fetching visual resources...")
      setProgress(60)

      const data = await response.json()

      setProgressMessage("Creating lesson...")
      setProgress(80)

      await new Promise((resolve) => setTimeout(resolve, 500))

      setProgressMessage("Done!")
      setProgress(100)

      await new Promise((resolve) => setTimeout(resolve, 300))

      router.push(`/lessons/${data.lessonId}`)
    } catch (error) {
      console.error("Generate error:", error)
      setProgressMessage("Error generating lesson. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedGrade = subjects.find((s) => s.id === subjectId)?.grade

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Lesson</h1>
              <p className="text-sm text-muted-foreground">Generate visual content from your lesson text</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Lesson Details
            </CardTitle>
            <CardDescription>
              Enter your lesson content or use voice input. Visual resources will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title and Topic */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Lesson Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Photosynthesis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Plant Biology"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} - {subject.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGrade && <p className="text-sm text-muted-foreground">Selected: {selectedGrade}</p>}
            </div>

            {/* Lesson Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lessonText">
                  Lesson Content <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  {isRecording && <span className="text-sm text-primary animate-pulse">Listening...</span>}
                  <MicRecorder onTranscript={handleTranscript} onRecordingChange={setIsRecording} />
                </div>
              </div>
              <Textarea
                id="lessonText"
                placeholder="Enter your lesson content here, or click the microphone to use voice input...

Example: Photosynthesis is the process by which plants make their own food using sunlight, water, and carbon dioxide. The process takes place in the chloroplasts of plant cells, which contain a green pigment called chlorophyll..."
                className="min-h-[200px]"
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">{lessonText.length} characters</p>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSplit"
                checked={autoSplitConcepts}
                onCheckedChange={(checked) => setAutoSplitConcepts(checked as boolean)}
              />
              <Label htmlFor="autoSplit" className="text-sm font-normal cursor-pointer">
                Automatically split lesson into concept sections based on keywords
              </Label>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>{progressMessage}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent" disabled={isGenerating}>
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleGenerate}
                disabled={!title || !subjectId || !lessonText || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Visuals
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
