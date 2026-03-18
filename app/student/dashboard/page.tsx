import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentDashboardContent } from "@/components/student/student-dashboard-content"

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/student-login")
  }

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "student") {
    redirect("/dashboard")
  }

  // Get assigned lessons through class assignments
  const { data: assignedLessons } = await supabase
    .from("lesson_assignments")
    .select(`
      lesson:lessons(
        id,
        title,
        topic,
        summary,
        subject:subjects(name, grade)
      ),
      class:classes(name)
    `)
    .in("class_id", supabase.from("class_assignments").select("class_id").eq("student_id", user.id))

  // Get progress stats
  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, action")
    .eq("student_id", user.id)

  const understoodCount = progress?.filter((p) => p.action === "understood").length || 0
  const viewedCount = progress?.filter((p) => p.action === "viewed").length || 0

  return (
    <StudentDashboardContent
      profile={profile}
      assignedLessons={assignedLessons || []}
      stats={{
        understood: understoodCount,
        viewed: viewedCount,
      }}
    />
  )
}
