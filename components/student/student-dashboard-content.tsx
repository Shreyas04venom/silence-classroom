"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Hand, Settings, LogOut, BookOpen, CheckCircle, Eye, ChevronRight, Moon, Sun, Type } from "lucide-react"
import type { Profile, Lesson, Subject } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface StudentDashboardContentProps {
  profile: Profile
  assignedLessons: Array<{
    lesson: (Lesson & { subject?: Subject }) | null
    class: { name: string } | null
  }>
  stats: {
    understood: number
    viewed: number
  }
}

export function StudentDashboardContent({ profile, assignedLessons, stats }: StudentDashboardContentProps) {
  const router = useRouter()
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev)
    document.documentElement.classList.toggle("high-contrast")
  }

  const toggleLargeText = () => {
    setLargeText((prev) => !prev)
    document.documentElement.classList.toggle("large-text")
  }

  const lessons = assignedLessons.filter((a) => a.lesson).map((a) => ({ ...a.lesson!, className: a.class?.name }))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Hand className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold">Silent Classrooms</span>
              <p className="text-muted-foreground">Welcome, {profile.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Accessibility Controls */}
            <Button
              variant={highContrast ? "default" : "outline"}
              size="icon"
              onClick={toggleHighContrast}
              aria-label="Toggle high contrast"
              className="h-12 w-12"
            >
              {highContrast ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>
            <Button
              variant={largeText ? "default" : "outline"}
              size="icon"
              onClick={toggleLargeText}
              aria-label="Toggle large text"
              className="h-12 w-12"
            >
              <Type className="h-6 w-6" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <Settings className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Lessons Viewed</CardTitle>
              <Eye className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{stats.viewed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Understood</CardTitle>
              <CheckCircle className="h-8 w-8 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-success">{stats.understood}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="h-7 w-7" />
              My Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">No lessons assigned yet</p>
                <p className="text-lg mt-2">Ask your teacher to assign lessons to your class</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}/display`}>
                    <div className="flex items-center justify-between p-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all">
                      <div>
                        <h3 className="text-xl font-semibold">{lesson.title}</h3>
                        <p className="text-muted-foreground">
                          {lesson.subject?.name} • {lesson.subject?.grade}
                        </p>
                        {lesson.className && <p className="text-sm text-primary mt-1">Class: {lesson.className}</p>}
                      </div>
                      <Button size="lg" className="h-14 px-8 text-lg">
                        Start
                        <ChevronRight className="h-6 w-6 ml-2" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
