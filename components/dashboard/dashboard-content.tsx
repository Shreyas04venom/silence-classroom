"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Hand,
  Plus,
  BookOpen,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Mic,
  FileText,
  ChevronRight,
  Loader2,
  FolderPlus,
} from "lucide-react"
import { MicRecorder } from "@/components/mic-recorder"
import type { Profile, Lesson, Subject } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface DashboardContentProps {
  profile: Profile
  stats: {
    classes: number
    lessons: number
    students: number
  }
  recentLessons: (Lesson & { subject?: { name: string; grade: string } })[]
  subjects: Subject[]
}

export function DashboardContent({ profile, stats, recentLessons, subjects }: DashboardContentProps) {
  const router = useRouter()
  const [showNewLessonDialog, setShowNewLessonDialog] = useState(false)
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [transcribedText, setTranscribedText] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  // New lesson form state
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonTopic, setLessonTopic] = useState("")
  const [lessonText, setLessonText] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  // New subject form state
  const [subjectName, setSubjectName] = useState("")
  const [subjectGrade, setSubjectGrade] = useState("")
  const [subjectDescription, setSubjectDescription] = useState("")

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleCreateLesson = async () => {
    if (!lessonTitle || !selectedSubject) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/lessons/new/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          topic: lessonTopic,
          subjectId: selectedSubject,
          lessonText: transcribedText || lessonText,
          transcribedText: transcribedText,
          autoSplitConcepts: true,
        }),
      })

      if (!response.ok) throw new Error("Failed to create lesson")

      const data = await response.json()
      setShowNewLessonDialog(false)
      router.push(`/lessons/${data.lessonId}`)
    } catch (error) {
      console.error("Create lesson error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateSubject = async () => {
    if (!subjectName || !subjectGrade) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subjectName,
          grade: subjectGrade,
          description: subjectDescription,
        }),
      })

      if (!response.ok) throw new Error("Failed to create subject")

      setShowNewSubjectDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Create subject error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTranscript = (text: string) => {
    setTranscribedText((prev) => prev + " " + text)
    setLessonText((prev) => prev + " " + text)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">Silent Classrooms</span>
              <p className="text-sm text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Classes</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.classes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lessons</CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.lessons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowNewLessonDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                New Lesson
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNewSubjectDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subject
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/classes/new">
                  <Users className="h-4 w-4 mr-2" />
                  New Class
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/analytics">
            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              <BarChart3 className="h-5 w-5" />
              View Analytics
            </Button>
          </Link>
        </div>

        {/* Voice Input Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Quick Voice Lesson
            </CardTitle>
            <CardDescription>
              Click the mic and speak your lesson concept. We&apos;ll generate visual content automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <MicRecorder onTranscript={handleTranscript} onRecordingChange={setIsRecording} size="lg" />
            <div className="flex-1">
              {isRecording ? (
                <p className="text-primary animate-pulse">Listening... Speak your lesson concept</p>
              ) : transcribedText ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transcribed:</p>
                  <p className="text-foreground">{transcribedText}</p>
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => {
                      setShowNewLessonDialog(true)
                    }}
                  >
                    Create Lesson from This
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Example: &quot;Photosynthesis basic concept — sunlight, chlorophyll, leaves&quot;
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Lessons</CardTitle>
              <Link href="/lessons">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No lessons yet. Create your first lesson!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLessons.map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lesson.subject?.name} • {lesson.subject?.grade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.is_published && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Published</span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* New Lesson Dialog */}
      <Dialog open={showNewLessonDialog} onOpenChange={setShowNewLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
            <DialogDescription>
              Enter lesson details or use voice input. Visual content will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Photosynthesis"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Plant Biology"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lessonText">Lesson Content</Label>
                <MicRecorder onTranscript={handleTranscript} onRecordingChange={setIsRecording} />
              </div>
              <Textarea
                id="lessonText"
                placeholder="Type or speak your lesson content..."
                className="min-h-[150px]"
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
              />
              {isRecording && <p className="text-sm text-primary animate-pulse">Listening...</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLessonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLesson} disabled={!lessonTitle || !selectedSubject || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Create & Generate Visuals"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Subject Dialog */}
      <Dialog open={showNewSubjectDialog} onOpenChange={setShowNewSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>Add a new subject to organize your lessons.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                placeholder="e.g., Science"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectGrade">Grade/Standard</Label>
              <Select value={subjectGrade} onValueChange={setSubjectGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Std 6">Standard 6</SelectItem>
                  <SelectItem value="Std 7">Standard 7</SelectItem>
                  <SelectItem value="Std 8">Standard 8</SelectItem>
                  <SelectItem value="Std 9">Standard 9</SelectItem>
                  <SelectItem value="Std 10">Standard 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectDescription">Description (Optional)</Label>
              <Textarea
                id="subjectDescription"
                placeholder="Brief description of the subject..."
                value={subjectDescription}
                onChange={(e) => setSubjectDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSubjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubject} disabled={!subjectName || !subjectGrade || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Subject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
