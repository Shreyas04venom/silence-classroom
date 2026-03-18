"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Eye, CheckCircle, RotateCcw, TrendingUp, Download } from "lucide-react"

interface AnalyticsContentProps {
  stats: {
    totalViews: number
    totalUnderstood: number
    totalReplays: number
  }
  lessonStats: Array<{
    id: string
    title: string
    subject?: { name: string; grade: string } | null
    views: number
    understood: number
    replays: number
  }>
  recentProgress: Array<{
    id: string
    action: string
    created_at: string
    student?: { name: string; roll_no?: string } | null
    lesson?: { title: string } | null
  }>
}

export function AnalyticsContent({ stats, lessonStats, recentProgress }: AnalyticsContentProps) {
  const handleExportCSV = () => {
    const headers = ["Lesson", "Subject", "Grade", "Views", "Understood", "Replays"]
    const rows = lessonStats.map((l) => [
      l.title,
      l.subject?.name || "",
      l.subject?.grade || "",
      l.views,
      l.understood,
      l.replays,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "lesson-analytics.csv"
    a.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Track student engagement and progress</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Understood</CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success">{stats.totalUnderstood}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Replays</CardTitle>
              <RotateCcw className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-warning">{stats.totalReplays}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Per-Lesson Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lesson Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lessonStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No lesson data available yet</p>
              ) : (
                <div className="space-y-6">
                  {lessonStats.map((lesson) => {
                    const total = Math.max(lesson.views, 1)
                    const understandingRate = Math.round((lesson.understood / total) * 100)

                    return (
                      <div key={lesson.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {lesson.subject?.name} • {lesson.subject?.grade}
                            </p>
                          </div>
                          <span className="text-sm font-medium">{understandingRate}% understood</span>
                        </div>
                        <Progress value={understandingRate} className="h-2" />
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{lesson.views} views</span>
                          <span>{lesson.understood} understood</span>
                          <span>{lesson.replays} replays</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProgress.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {recentProgress.map((progress) => (
                    <div key={progress.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          progress.action === "understood"
                            ? "bg-success/10 text-success"
                            : progress.action === "replay"
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {progress.action === "understood" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : progress.action === "replay" ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{progress.student?.name || "Student"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {progress.action} - {progress.lesson?.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(progress.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
