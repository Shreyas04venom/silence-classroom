import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "teacher") {
    redirect("/student/dashboard")
  }

  // Get stats
  const [{ count: classesCount }, { count: lessonsCount }, { count: studentsCount }] = await Promise.all([
    supabase.from("classes").select("*", { count: "exact", head: true }).eq("teacher_id", user.id),
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("teacher_id", user.id),
    supabase
      .from("class_assignments")
      .select("*, classes!inner(teacher_id)", { count: "exact", head: true })
      .eq("classes.teacher_id", user.id),
  ])

  // Get recent lessons
  const { data: recentLessons } = await supabase
    .from("lessons")
    .select(`
      *,
      subject:subjects(name, grade)
    `)
    .eq("teacher_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5)

  // Get subjects
  const { data: subjects } = await supabase.from("subjects").select("*").order("grade").order("name")

  return (
    <DashboardContent
      profile={profile}
      stats={{
        classes: classesCount || 0,
        lessons: lessonsCount || 0,
        students: studentsCount || 0,
      }}
      recentLessons={recentLessons || []}
      subjects={subjects || []}
    />
  )
}
