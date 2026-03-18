"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Search, BookOpen, ChevronRight, Filter, Monitor } from "lucide-react"
import type { Lesson, Subject } from "@/lib/types"

interface LessonsListContentProps {
  lessons: (Lesson & { subject?: Subject })[]
  subjects: Subject[]
}

export function LessonsListContent({ lessons, subjects }: LessonsListContentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")

  const grades = [...new Set(subjects.map((s) => s.grade))]

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = selectedSubject === "all" || lesson.subject_id === selectedSubject

    const matchesGrade = selectedGrade === "all" || lesson.subject?.grade === selectedGrade

    return matchesSearch && matchesSubject && matchesGrade
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">All Lessons</h1>
                <p className="text-sm text-muted-foreground">{lessons.length} lessons total</p>
              </div>
            </div>
            <Link href="/lessons/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Lesson
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects
                      .filter((s) => selectedGrade === "all" || s.grade === selectedGrade)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No lessons found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedSubject !== "all" || selectedGrade !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first lesson to get started"}
              </p>
              <Link href="/lessons/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{lesson.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {lesson.subject?.name} • {lesson.subject?.grade}
                      </p>
                    </div>
                    {lesson.is_published && (
                      <Badge variant="default" className="shrink-0">
                        Published
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {lesson.summary || lesson.topic || "No summary available"}
                  </p>
                  {lesson.keywords && lesson.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lesson.keywords.slice(0, 3).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/lessons/${lesson.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-1 bg-transparent">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/lessons/${lesson.id}/display`}>
                      <Button variant="ghost" size="icon">
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
