import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LessonDetailContent } from "@/components/lessons/lesson-detail-content"

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`
      *,
      subject:subjects(id, name, grade, board),
      concepts(id, index, title, notes, sign_language_video_url),
      media_resources(id, media_type, source, url, thumbnail_url, title, meta)
    `)
    .eq("id", id)
    .single()

  if (error || !lesson) {
    notFound()
  }

  return <LessonDetailContent lesson={lesson} />
}
