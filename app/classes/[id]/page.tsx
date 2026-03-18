import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClassDetailContent } from "@/components/classes/class-detail-content"

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get class with students
  const { data: classData, error } = await supabase
    .from("classes")
    .select(`
      *,
      class_assignments(
        id,
        student:profiles(id, name, roll_no, created_at)
      )
    `)
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single()

  if (error || !classData) {
    notFound()
  }

  // Get lessons that can be assigned
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, subject:subjects(name)")
    .eq("teacher_id", user.id)
    .order("title")

  // Get already assigned lessons
  const { data: assignedLessons } = await supabase
    .from("lesson_assignments")
    .select(`
      id,
      lesson:lessons(id, title, subject:subjects(name)),
      assigned_at
    `)
    .eq("class_id", id)

  return <ClassDetailContent classData={classData} lessons={lessons || []} assignedLessons={assignedLessons || []} />
}
