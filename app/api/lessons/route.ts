import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subjectId = searchParams.get("subjectId")

    let query = supabase
      .from("lessons")
      .select(`
        *,
        subject:subjects(id, name, grade)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (subjectId) {
      query = query.eq("subject_id", subjectId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Lessons fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, topic, subjectId, lessonText } = body

    if (!title || !subjectId) {
      return NextResponse.json({ error: "Title and subject are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        title,
        topic,
        subject_id: subjectId,
        teacher_id: user.id,
        lesson_text: lessonText,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Lesson create error:", error)
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}
