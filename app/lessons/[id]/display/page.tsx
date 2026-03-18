import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentKioskDisplay } from "@/components/student-kiosk-display"

export default async function LessonDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ kiosk?: string }>
}) {
  const { id } = await params
  const { kiosk } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`
      *,
      subject:subjects(id, name, grade),
      media_resources(id, media_type, source, url, thumbnail_url, title, meta)
    `)
    .eq("id", id)
    .single()

  if (error || !lesson) {
    notFound()
  }

  return (
    <div className={kiosk === "true" ? "kiosk-mode" : ""}>
      <StudentKioskDisplay
        lesson={lesson}
        mediaResources={lesson.media_resources || []}
        studentId={user?.id}
        isKiosk={kiosk === "true"}
      />
    </div>
  )
}
