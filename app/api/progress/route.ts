import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId, conceptId, action, durationSeconds } = body

    if (!lessonId || !action) {
      return NextResponse.json({ error: "Lesson ID and action are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("student_progress")
      .insert({
        student_id: user.id,
        lesson_id: lessonId,
        concept_id: conceptId,
        action,
        duration_seconds: durationSeconds || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Progress track error:", error)
    return NextResponse.json({ error: "Failed to track progress" }, { status: 500 })
  }
}
