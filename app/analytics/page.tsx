import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsContent } from "@/components/analytics/analytics-content"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get all lessons for this teacher
  const { data: lessons } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      subject:subjects(name, grade)
    `)
    .eq("teacher_id", user.id)

  // Get all progress data for teacher's lessons
  const lessonIds = lessons?.map((l) => l.id) || []

  const { data: progressData } = await supabase
    .from("student_progress")
    .select(`
      *,
      student:profiles(name, roll_no),
      lesson:lessons(title)
    `)
    .in("lesson_id", lessonIds)
    .order("created_at", { ascending: false })

  // Aggregate stats
  const totalViews = progressData?.filter((p) => p.action === "viewed").length || 0
  const totalUnderstood = progressData?.filter((p) => p.action === "understood").length || 0
  const totalReplays = progressData?.filter((p) => p.action === "replay").length || 0

  // Per-lesson stats
  const lessonStats =
    lessons?.map((lesson) => {
      const lessonProgress = progressData?.filter((p) => p.lesson_id === lesson.id) || []
      return {
        ...lesson,
        views: lessonProgress.filter((p) => p.action === "viewed").length,
        understood: lessonProgress.filter((p) => p.action === "understood").length,
        replays: lessonProgress.filter((p) => p.action === "replay").length,
      }
    }) || []

  return (
    <AnalyticsContent
      stats={{
        totalViews,
        totalUnderstood,
        totalReplays,
      }}
      lessonStats={lessonStats}
      recentProgress={progressData?.slice(0, 20) || []}
    />
  )
}
